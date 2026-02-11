export type ReviewLike = {
  rating: number;
};

export function getAverageRating(reviews: ReviewLike[], fallback = 0) {
  if (reviews.length === 0) return fallback;
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return total / reviews.length;
}

export function getReviewTotal(reviews: ReviewLike[], fallback = 0) {
  return Math.max(fallback, reviews.length);
}
