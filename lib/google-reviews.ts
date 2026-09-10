import "server-only";
import type { GoogleReview, GoogleReviewsData } from "./google-reviews-types";

const fieldMask =
  "id,displayName,rating,userRatingCount,googleMapsUri,reviews,attributions";

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readable(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function localizedText(value: unknown): string | null {
  const text = record(value)?.text;
  return typeof text === "string" ? text : null;
}

function httpsUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const candidate = value.trim();
  if (/[\u0000-\u0020\u007f]/.test(candidate)) return null;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

function authorPhoto(value: unknown): string | null {
  const url = httpsUrl(value);
  if (!url) return null;
  const hostname = new URL(url).hostname;
  return hostname === "googleusercontent.com" ||
    hostname.endsWith(".googleusercontent.com")
    ? url
    : null;
}

function rating(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 1 &&
    value <= 5
  );
}

function normalizeReview(value: unknown): GoogleReview | null {
  const review = record(value);
  if (!review || !rating(review.rating)) return null;
  const author = record(review.authorAttribution);
  const authorName = readable(author?.displayName);
  const googleMapsUri = httpsUrl(review.googleMapsUri);
  // Each displayed review must credit a real author and link to its own source.
  if (!authorName || !googleMapsUri) return null;

  const originalText = localizedText(review.originalText);
  const text = readable(localizedText(review.text)) ?? originalText ?? "";
  const publishTime =
    typeof review.publishTime === "string" &&
    /^\d{4}-\d{2}-\d{2}T/.test(review.publishTime) &&
    Number.isFinite(Date.parse(review.publishTime))
      ? review.publishTime
      : null;

  return {
    id: readable(review.name) ?? googleMapsUri,
    authorName,
    authorUrl: httpsUrl(author?.uri),
    authorPhotoUrl: authorPhoto(author?.photoUri),
    rating: review.rating,
    text,
    publishTime,
    relativePublishTimeDescription:
      typeof review.relativePublishTimeDescription === "string"
        ? review.relativePublishTimeDescription
        : "",
    googleMapsUri,
    ...(originalText !== null && originalText !== text ? { originalText } : {}),
  };
}

function normalizePlace(
  value: unknown,
  placeId: string,
): GoogleReviewsData | null {
  const place = record(value);
  if (!place || place.id !== placeId) return null;
  const displayName = readable(localizedText(place.displayName));
  const googleMapsUri = httpsUrl(place.googleMapsUri);
  if (!displayName || !googleMapsUri) return null;
  if (place.rating != null && !rating(place.rating)) return null;
  const userRatingCount = place.userRatingCount ?? 0;
  if (
    typeof userRatingCount !== "number" ||
    !Number.isSafeInteger(userRatingCount) ||
    userRatingCount < 0
  ) {
    return null;
  }
  if (place.reviews !== undefined && !Array.isArray(place.reviews)) return null;
  if (place.attributions !== undefined && !Array.isArray(place.attributions)) {
    return null;
  }

  const attributions: GoogleReviewsData["attributions"] = [];
  for (const value of place.attributions ?? []) {
    const attribution = record(value);
    const displayName = readable(attribution?.provider);
    const uri = httpsUrl(attribution?.providerUri);
    // Required provider attribution cannot safely be omitted from the result.
    if (!displayName || !uri) return null;
    attributions.push({ displayName, uri });
  }

  return {
    displayName,
    rating: rating(place.rating) ? place.rating : null,
    userRatingCount,
    googleMapsUri,
    // Places returns at most five reviews in relevance order; never sort by stars.
    reviews: (place.reviews ?? [])
      .slice(0, 5)
      .map(normalizeReview)
      .filter((review): review is GoogleReview => review !== null),
    attributions,
  };
}

export async function getGoogleReviews(): Promise<GoogleReviewsData | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim();
  const placeId = process.env.GOOGLE_PLACES_PLACE_ID?.trim();
  if (!apiKey || !placeId || !/^[A-Za-z0-9_-]+$/.test(placeId)) return null;

  try {
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
      {
        method: "GET",
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": fieldMask,
        },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(3000),
      },
    );
    if (!response.ok) return null;
    return normalizePlace(await response.json(), placeId);
  } catch {
    // Reviews are optional. Never expose provider response bodies or credentials.
    return null;
  }
}
