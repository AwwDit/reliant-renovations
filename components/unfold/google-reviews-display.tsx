"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Star,
} from "@phosphor-icons/react";
import type {
  GoogleReview,
  GoogleReviewsData,
} from "@/lib/google-reviews-types";
import "./google-reviews.css";

const reviewPolicyUrl =
  "https://support.google.com/contributionpolicy/answer/7400114";
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});
const countFormatter = new Intl.NumberFormat("en-US");

function ReviewStars({ rating }: { rating: number }) {
  return (
    <span
      className="uf-reviews-stars"
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <span className="uf-reviews-star" key={index} aria-hidden="true">
          <Star weight="regular" size={18} />
          <span
            className="uf-reviews-star-fill"
            style={{
              width: `${Math.max(0, Math.min(1, rating - index)) * 100}%`,
            }}
          >
            <Star weight="fill" size={18} />
          </span>
        </span>
      ))}
    </span>
  );
}

function ReviewDate({ review }: { review: GoogleReview }) {
  const date = review.publishTime ? new Date(review.publishTime) : null;
  if (date && Number.isFinite(date.getTime())) {
    return (
      <time dateTime={date.toISOString()}>{dateFormatter.format(date)}</time>
    );
  }
  return review.relativePublishTimeDescription ? (
    <span>{review.relativePublishTimeDescription}</span>
  ) : null;
}

function ReviewAvatar({ review }: { review: GoogleReview }) {
  const [failed, setFailed] = useState(false);
  const initials = review.authorName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => Array.from(part)[0])
    .join("");

  return (
    <span className="uf-reviews-avatar" aria-hidden="true">
      {review.authorPhotoUrl && !failed ? (
        // Google author attribution is displayed directly, without an image proxy.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={review.authorPhotoUrl}
          alt=""
          width={48}
          height={48}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </span>
  );
}

export function GoogleReviewsDisplay({ data }: { data: GoogleReviewsData }) {
  const sectionRef = useRef<HTMLElement>(null);
  const selectorRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [expandedReviews, setExpandedReviews] = useState<
    Record<string, boolean>
  >({});
  const instanceId = useId();
  const reviews = data.reviews;
  const activeIndex = reviews.length ? selectedIndex % reviews.length : 0;
  const selectedReview = reviews[activeIndex];
  const titleId = `${instanceId}-title`;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    // Without hydration the complete, ordered review list remains visible.
    section.dataset.enhanced = "true";
    return () => {
      delete section.dataset.enhanced;
    };
  }, []);

  function selectReview(index: number) {
    if (reviews.length) {
      setExpandedReviews({});
      sectionRef.current
        ?.querySelectorAll<HTMLDetailsElement>("details[open]")
        .forEach((details) => {
          details.open = false;
        });
      setSelectedIndex((index + reviews.length) % reviews.length);
    }
  }

  function handleSelectorKey(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let nextIndex: number;
    switch (event.key) {
      case "ArrowLeft":
        nextIndex = (index - 1 + reviews.length) % reviews.length;
        break;
      case "ArrowRight":
        nextIndex = (index + 1) % reviews.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = reviews.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    selectReview(nextIndex);
    selectorRefs.current[nextIndex]?.focus();
  }

  return (
    <section
      ref={sectionRef}
      id="google-reviews"
      className="uf-reviews"
      aria-labelledby={titleId}
      data-empty={reviews.length === 0 ? "true" : "false"}
    >
      <div className="rf-container uf-reviews-layout">
        <header className="uf-reviews-summary">
          <a
            className="uf-reviews-googlemark"
            href={data.googleMapsUri}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${data.displayName} on Google Maps`}
          >
            <Image
              src="/images/brand/google-maps-dark.svg"
              alt="Google Maps"
              width={98}
              height={19}
              className="theme-logo-dark"
              unoptimized
            />
            <Image
              src="/images/brand/google-maps-light.svg"
              alt="Google Maps"
              width={98}
              height={19}
              className="theme-logo-light"
              unoptimized
            />
          </a>
          <h2 id={titleId}>Google reviews</h2>
          {data.rating !== null && (
            <div className="uf-reviews-rating">
              <span className="uf-reviews-rating-value" aria-hidden="true">
                {data.rating.toFixed(1)}
              </span>
              <div>
                <ReviewStars rating={data.rating} />
                <p className="uf-reviews-count">
                  {countFormatter.format(data.userRatingCount)}{" "}
                  {data.userRatingCount === 1 ? "review" : "reviews"}
                </p>
              </div>
            </div>
          )}
          {data.rating === null && data.userRatingCount > 0 && (
            <p className="uf-reviews-count uf-reviews-count-alone">
              {countFormatter.format(data.userRatingCount)}{" "}
              {data.userRatingCount === 1 ? "review" : "reviews"}
            </p>
          )}
          <a
            className="uf-reviews-source"
            href={data.googleMapsUri}
            target="_blank"
            rel="noopener noreferrer"
          >
            Read reviews on Google Maps
            <ArrowUpRight size={20} aria-hidden="true" />
          </a>
        </header>

        {reviews.length > 0 && (
          <div className="uf-reviews-collection">
            <div className="uf-reviews-articles">
              {reviews.map((review, index) => {
                const reviewId = `${instanceId}-review-${index}`;
                const authorId = `${reviewId}-author`;
                const textId = `${reviewId}-text`;
                const expanded = Boolean(expandedReviews[review.id]);
                const longReview = review.text.length > 420;
                const author = (
                  <>
                    <ReviewAvatar review={review} />
                    <span id={authorId}>{review.authorName}</span>
                  </>
                );

                return (
                  <article
                    key={review.id}
                    id={reviewId}
                    className="uf-reviews-review"
                    aria-labelledby={authorId}
                    data-active={index === activeIndex ? "true" : "false"}
                    data-long={longReview ? "true" : "false"}
                    data-expanded={expanded ? "true" : "false"}
                  >
                    <header className="uf-reviews-review-header">
                      {review.authorUrl ? (
                        <a
                          href={review.authorUrl}
                          className="uf-reviews-author"
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${review.authorName} on Google Maps`}
                        >
                          {author}
                        </a>
                      ) : (
                        <div className="uf-reviews-author">{author}</div>
                      )}
                      <div className="uf-reviews-review-rating">
                        <ReviewStars rating={review.rating} />
                        <ReviewDate review={review} />
                      </div>
                    </header>
                    {review.text && (
                      <>
                        <blockquote className="uf-reviews-text" id={textId}>
                          {review.text}
                        </blockquote>
                        {longReview && (
                          <button
                            type="button"
                            className="uf-reviews-expand"
                            aria-expanded={expanded}
                            aria-controls={textId}
                            onClick={() =>
                              setExpandedReviews((current) => ({
                                ...current,
                                [review.id]: !current[review.id],
                              }))
                            }
                          >
                            {expanded ? "Show less" : "Read full review"}
                          </button>
                        )}
                      </>
                    )}
                    {review.originalText &&
                      review.originalText !== review.text && (
                        <div className="uf-reviews-translation">
                          <p>Translated by Google</p>
                          <details>
                            <summary>Show original</summary>
                            <blockquote>{review.originalText}</blockquote>
                          </details>
                        </div>
                      )}
                    <a
                      className="uf-reviews-review-source"
                      href={review.googleMapsUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Read ${review.authorName}’s review on Google Maps`}
                    >
                      View on Google Maps
                      <ArrowUpRight size={16} aria-hidden="true" />
                    </a>
                  </article>
                );
              })}
            </div>

            {reviews.length > 1 && (
              <div className="uf-reviews-navigation">
                <div
                  className="uf-reviews-selectors"
                  role="group"
                  aria-label="Choose a review"
                >
                  {reviews.map((review, index) => (
                    <button
                      key={review.id}
                      ref={(element) => {
                        selectorRefs.current[index] = element;
                      }}
                      type="button"
                      className="uf-reviews-selector"
                      aria-pressed={index === activeIndex}
                      aria-controls={`${instanceId}-review-${index}`}
                      onClick={() => selectReview(index)}
                      onKeyDown={(event) => handleSelectorKey(event, index)}
                    >
                      <span
                        className="uf-reviews-selector-number"
                        aria-hidden="true"
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span>{review.authorName}</span>
                    </button>
                  ))}
                </div>
                <div
                  className="uf-reviews-arrows"
                  role="group"
                  aria-label="Review navigation"
                >
                  <button
                    type="button"
                    aria-label="Previous review"
                    onClick={() => selectReview(activeIndex - 1)}
                  >
                    <ArrowLeft size={21} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next review"
                    onClick={() => selectReview(activeIndex + 1)}
                  >
                    <ArrowRight size={21} aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
            <p
              className="uf-reviews-announcement"
              aria-live="polite"
              aria-atomic="true"
            >
              {selectedReview &&
                `Review ${activeIndex + 1} of ${reviews.length}: ${selectedReview.authorName}`}
            </p>
          </div>
        )}

        <footer className="uf-reviews-disclosure">
          <p>Reviews ordered by relevance by Google Maps.</p>
          <div>
            {data.attributions.map((attribution, index) => (
              <a
                key={`${attribution.uri}-${index}`}
                href={attribution.uri}
                target="_blank"
                rel="noopener noreferrer"
              >
                {attribution.displayName}
              </a>
            ))}
            <a href={reviewPolicyUrl} target="_blank" rel="noopener noreferrer">
              Google review policy
              <ArrowUpRight size={13} aria-hidden="true" />
            </a>
          </div>
        </footer>
      </div>
    </section>
  );
}
