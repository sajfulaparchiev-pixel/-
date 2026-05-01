import { useState, useEffect } from "react";

export interface Review {
  id: string;
  sessionId: string;
  author: string;
  text: string;
  rating: number;
  skill: string;
  date: string;
}

const REVIEWS_KEY = "skillflow_reviews";

export const useReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(REVIEWS_KEY);
    if (stored) {
      setReviews(JSON.parse(stored));
    }
  }, []);

  const addReview = (review: Omit<Review, "id" | "date">) => {
    const newReview: Review = {
      ...review,
      id: crypto.randomUUID(),
      date: new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long" }),
    };
    const updated = [newReview, ...reviews];
    setReviews(updated);
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(updated));
    return newReview;
  };

  const getReviewBySessionId = (sessionId: string) => {
    return reviews.find((r) => r.sessionId === sessionId);
  };

  return { reviews, addReview, getReviewBySessionId };
};
