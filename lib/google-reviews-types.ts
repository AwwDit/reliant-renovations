export type GoogleReview = {
  id: string;
  authorName: string;
  authorUrl: string | null;
  authorPhotoUrl: string | null;
  rating: number;
  text: string;
  publishTime: string | null;
  relativePublishTimeDescription: string;
  googleMapsUri: string;
  originalText?: string;
};

export type GoogleReviewsData = {
  displayName: string;
  rating: number | null;
  userRatingCount: number;
  googleMapsUri: string;
  reviews: GoogleReview[];
  attributions: Array<{ displayName: string; uri: string }>;
};
