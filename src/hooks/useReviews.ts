import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Review {
  id: string;
  rating: number;
  text: string;
  author: string;
  date: string;
  skillTitle?: string;
}

export const useReviews = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReviews = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("target_user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        const mapped: Review[] = data.map((r: any) => ({
          id: r.id,
          rating: r.rating,
          text: r.text,
          author: r.author_name || "Anonymous",
          date: new Date(r.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long" }),
        }));
        setReviews(mapped);
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return { reviews, loading, refresh: fetchReviews };
};
