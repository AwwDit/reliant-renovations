import test, { type TestContext } from "node:test";
import assert from "node:assert/strict";
import { getGoogleReviews } from "../lib/google-reviews";

const placeId = "ChIJ_fake_place_for_unit_tests";
const apiKey = "fake-places-key-never-sent";
const businessUrl = "https://maps.google.com/?cid=12345";

function review(index: number, stars = 5) {
  return {
    name: `places/${placeId}/reviews/review-${index}`,
    authorAttribution: {
      displayName: `Reviewer ${index}`,
      uri: `https://www.google.com/maps/contrib/${index}`,
      photoUri: `https://lh3.googleusercontent.com/reviewer-${index}=s128-c`,
    },
    rating: stars,
    text: {
      text: `Review ${index}.\nThe exact words stay intact.`,
      languageCode: "en",
    },
    originalText: {
      text: `Review ${index}.\nThe exact words stay intact.`,
      languageCode: "en",
    },
    publishTime: "2026-09-01T12:34:56.123456789Z",
    relativePublishTimeDescription: "a week ago",
    googleMapsUri: `https://www.google.com/maps/reviews/data=review-${index}`,
  };
}

function place() {
  return {
    id: placeId,
    displayName: { text: "Example Renovations", languageCode: "en" },
    rating: 4.2,
    userRatingCount: 37,
    googleMapsUri: businessUrl,
    reviews: [review(1, 2), review(2, 5), review(3, 1)],
    attributions: [
      {
        provider: "Example data provider",
        providerUri: "https://provider.example.test/credit",
      },
    ],
  };
}

function setup(t: TestContext) {
  for (const [key, value] of Object.entries({
    GOOGLE_PLACES_API_KEY: apiKey,
    GOOGLE_PLACES_PLACE_ID: placeId,
  })) {
    const previous = process.env[key];
    process.env[key] = value;
    t.after(() => {
      if (previous === undefined) delete process.env[key];
      else process.env[key] = previous;
    });
  }
  // Every test intercepts fetch before calling the module; live HTTP is forbidden.
  return t.mock.method(globalThis, "fetch", async () => Response.json(place()));
}

test("fetches only the configured place, without persistence or credentials in the result", async (t) => {
  const request = setup(t);
  const data = await getGoogleReviews();
  assert.ok(data);
  assert.equal(request.mock.callCount(), 1);
  const [url, options] = request.mock.calls[0].arguments;
  assert.equal(url, `https://places.googleapis.com/v1/places/${placeId}`);
  assert.equal(options?.method, "GET");
  assert.equal(options?.cache, "no-store");
  assert.equal(options?.redirect, "error");
  assert.ok(options?.signal instanceof AbortSignal);
  const headers = new Headers(options?.headers);
  assert.equal(headers.get("X-Goog-Api-Key"), apiKey);
  assert.equal(
    headers.get("X-Goog-FieldMask"),
    "id,displayName,rating,userRatingCount,googleMapsUri,reviews,attributions",
  );
  assert.equal(data.displayName, "Example Renovations");
  assert.equal(data.rating, 4.2);
  assert.equal(data.userRatingCount, 37);
  assert.equal(data.googleMapsUri, businessUrl);
  assert.deepEqual(
    data.reviews.map((item) => item.rating),
    [2, 5, 1],
  );
  assert.equal(data.reviews[0].text, review(1).text.text);
  assert.equal(data.reviews[0].authorName, "Reviewer 1");
  assert.equal(data.reviews[0].authorUrl, review(1).authorAttribution.uri);
  assert.equal(
    data.reviews[0].authorPhotoUrl,
    review(1).authorAttribution.photoUri,
  );
  assert.equal(data.reviews[0].publishTime, review(1).publishTime);
  assert.equal(data.reviews[0].relativePublishTimeDescription, "a week ago");
  assert.equal(data.reviews[0].googleMapsUri, review(1).googleMapsUri);
  assert.equal(data.reviews[0].originalText, undefined);
  assert.deepEqual(data.attributions, [
    {
      displayName: "Example data provider",
      uri: "https://provider.example.test/credit",
    },
  ]);
  assert.ok(!JSON.stringify(data).includes(apiKey));

  await getGoogleReviews();
  assert.equal(
    request.mock.callCount(),
    2,
    "a new request must not reuse stored reviews",
  );
});

test("preserves translated and original wording, rating-only reviews, and the first five in relevance order", async (t) => {
  const request = setup(t);
  const translated = {
    ...review(1, 1),
    text: { text: "  Exact <words> & punctuation!\n", languageCode: "en" },
    originalText: { text: "Texte original.", languageCode: "fr" },
  };
  const originalOnly = {
    ...review(2, 2),
    text: undefined,
    originalText: { text: "Texto original.", languageCode: "es" },
  };
  const ratingOnly = {
    ...review(3, 3),
    text: undefined,
    originalText: undefined,
  };
  const emptyTranslation = {
    ...review(4, 4),
    text: { text: "", languageCode: "en" },
    originalText: {
      text: "Original words remain available.",
      languageCode: "en",
    },
  };
  request.mock.mockImplementation(async () =>
    Response.json({
      ...place(),
      reviews: [
        translated,
        originalOnly,
        ratingOnly,
        emptyTranslation,
        review(5, 5),
        review(6, 5),
      ],
    }),
  );
  const data = await getGoogleReviews();
  assert.ok(data);
  assert.deepEqual(
    data.reviews.map((item) => item.rating),
    [1, 2, 3, 4, 5],
  );
  assert.equal(data.reviews[0].text, translated.text.text);
  assert.equal(data.reviews[0].originalText, translated.originalText.text);
  assert.equal(data.reviews[1].text, originalOnly.originalText.text);
  assert.equal(data.reviews[1].originalText, undefined);
  assert.equal(data.reviews[2].text, "");
  assert.equal(data.reviews[3].text, emptyTranslation.originalText.text);
});

test("rejects reviews without a real author, valid stars, or an individual HTTPS source", async (t) => {
  const request = setup(t);
  const invalid = [
    null,
    [],
    { ...review(1), googleMapsUri: undefined },
    { ...review(1), googleMapsUri: "javascript:alert(1)" },
    { ...review(1), googleMapsUri: "http://www.google.com/maps/reviews/1" },
    {
      ...review(1),
      googleMapsUri: "https://user:password@www.google.com/maps/reviews/1",
    },
    { ...review(1), googleMapsUri: "https://www.google.com/\nmalformed" },
    { ...review(1), authorAttribution: { displayName: "  " } },
    { ...review(1), authorAttribution: [] },
    { ...review(1), rating: "5" },
    { ...review(1), rating: 0 },
    { ...review(1), rating: 6 },
  ];
  for (const item of invalid) {
    request.mock.mockImplementation(async () =>
      Response.json({ ...place(), reviews: [item, review(2, 1)] }),
    );
    const data = await getGoogleReviews();
    assert.ok(data);
    assert.deepEqual(
      data.reviews.map((entry) => entry.id),
      [review(2).name],
    );
  }
});

test("omits unsafe optional links and restricts author photos to the googleusercontent.com family", async (t) => {
  const request = setup(t);
  for (const photoUri of [
    "https://photos.example.test/avatar.jpg",
    "https://googleusercontent.com.attacker.example.test/avatar.jpg",
    "https://notgoogleusercontent.com/avatar.jpg",
    "data:image/svg+xml,<svg/>",
    "http://lh3.googleusercontent.com/avatar.jpg",
  ]) {
    request.mock.mockImplementation(async () =>
      Response.json({
        ...place(),
        reviews: [
          {
            ...review(1),
            publishTime: "not a date",
            relativePublishTimeDescription: null,
            authorAttribution: {
              displayName: "Real supplied name",
              uri: "javascript:alert(1)",
              photoUri,
            },
          },
        ],
      }),
    );
    const data = await getGoogleReviews();
    assert.ok(data);
    assert.equal(data.reviews.length, 1);
    assert.equal(data.reviews[0].authorPhotoUrl, null);
    assert.equal(data.reviews[0].authorUrl, null);
    assert.equal(data.reviews[0].publishTime, null);
    assert.equal(data.reviews[0].relativePublishTimeDescription, "");
  }
});

test("rejects malformed place data and unusable required provider attribution", async (t) => {
  const request = setup(t);
  const invalid = [
    null,
    [],
    "not a place",
    {},
    { ...place(), id: "a-different-business" },
    { ...place(), displayName: { text: " " } },
    { ...place(), googleMapsUri: "javascript:alert(1)" },
    { ...place(), rating: 0 },
    { ...place(), rating: "4.2" },
    { ...place(), userRatingCount: -1 },
    { ...place(), userRatingCount: 3.5 },
    { ...place(), userRatingCount: "37" },
    { ...place(), reviews: {} },
    { ...place(), attributions: {} },
    {
      ...place(),
      attributions: [
        { provider: "Required credit", providerUri: "javascript:alert(1)" },
      ],
    },
    {
      ...place(),
      attributions: [{ provider: "", providerUri: "https://example.test" }],
    },
  ];
  for (const item of invalid) {
    request.mock.mockImplementation(async () => Response.json(item));
    assert.equal(await getGoogleReviews(), null);
  }
});

test("accepts a genuine place that has no ratings or reviews without inventing them", async (t) => {
  const request = setup(t);
  request.mock.mockImplementation(async () =>
    Response.json({
      id: placeId,
      displayName: { text: "Example Renovations" },
      googleMapsUri: businessUrl,
    }),
  );
  assert.deepEqual(await getGoogleReviews(), {
    displayName: "Example Renovations",
    rating: null,
    userRatingCount: 0,
    googleMapsUri: businessUrl,
    reviews: [],
    attributions: [],
  });
});

test("does not send requests with absent or blank credentials or an invalid place ID", async (t) => {
  const request = setup(t);
  for (const [key, value] of [
    ["GOOGLE_PLACES_API_KEY", undefined],
    ["GOOGLE_PLACES_API_KEY", "   "],
    ["GOOGLE_PLACES_PLACE_ID", undefined],
    ["GOOGLE_PLACES_PLACE_ID", "   "],
    ["GOOGLE_PLACES_PLACE_ID", "../other-place?key=wrong"],
  ] as const) {
    process.env.GOOGLE_PLACES_API_KEY = apiKey;
    process.env.GOOGLE_PLACES_PLACE_ID = placeId;
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
    assert.equal(await getGoogleReviews(), null);
  }
  assert.equal(request.mock.callCount(), 0);
});

test("provider errors, invalid JSON and network failures return null without retries or leaked diagnostics", async (t) => {
  const request = setup(t);
  const warn = t.mock.method(console, "warn", () => {});
  const error = t.mock.method(console, "error", () => {});
  const rejected = new Response(`Provider error exposing ${apiKey}`, {
    status: 403,
  });
  const readBody = t.mock.method(rejected, "json", async () => {
    throw new Error("Error response bodies must not be read.");
  });
  request.mock.mockImplementation(async () => rejected);
  assert.equal(await getGoogleReviews(), null);
  assert.equal(readBody.mock.callCount(), 0);
  assert.equal(request.mock.callCount(), 1);
  request.mock.mockImplementation(async () => new Response("invalid JSON"));
  assert.equal(await getGoogleReviews(), null);
  assert.equal(request.mock.callCount(), 2);
  request.mock.mockImplementation(async () => {
    throw new Error(`Network error containing ${apiKey}`);
  });
  assert.equal(await getGoogleReviews(), null);
  assert.equal(request.mock.callCount(), 3);
  assert.equal(warn.mock.callCount(), 0);
  assert.equal(error.mock.callCount(), 0);
});

test("sets a three-second deadline and lets its abort cancel a pending request", async (t) => {
  const request = setup(t);
  const controller = new AbortController();
  t.mock.method(AbortSignal, "timeout", (milliseconds: number) => {
    assert.equal(milliseconds, 3000);
    return controller.signal;
  });
  request.mock.mockImplementation(
    async (_url, options) =>
      new Promise<Response>((_resolve, reject) => {
        assert.equal(options?.signal, controller.signal);
        options.signal.addEventListener(
          "abort",
          () => reject(options.signal?.reason),
          { once: true },
        );
        setImmediate(() =>
          controller.abort(
            new DOMException("Deadline reached", "TimeoutError"),
          ),
        );
      }),
  );
  assert.equal(await getGoogleReviews(), null);
  assert.equal(controller.signal.aborted, true);
  assert.equal(request.mock.callCount(), 1);
});
