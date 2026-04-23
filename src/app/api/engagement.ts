import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../../supabaseClient";
import {
  getVisitPlan,
  getVisitPlanCounts,
  getVisitPlans,
  isReviewAppreciated,
  saveVisitPlan as saveVisitPlanLocal,
  toggleReviewAppreciation,
  VisitPlan,
} from "../utils/personalization";

function shouldFallback(error: PostgrestError | Error | null) {
  if (!error) return false;
  const message = `${error.message || ""} ${"details" in error ? error.details || "" : ""}`.toLowerCase();
  return (
    message.includes("does not exist") ||
    message.includes("relation") ||
    message.includes("schema cache") ||
    message.includes("permission denied") ||
    message.includes("rls")
  );
}

export async function loadVisitPlans(userId?: string | null) {
  if (!userId) return getVisitPlans();

  const { data, error } = await supabase
    .from("user_place_states")
    .select("place_id, place_name, plan_status, updated_at")
    .eq("user_id", userId)
    .not("plan_status", "is", null);

  if (error) {
    if (shouldFallback(error)) return getVisitPlans();
    throw error;
  }

  return (data || []).map((item: any) => ({
    placeId: String(item.place_id),
    placeName: item.place_name || undefined,
    status: item.plan_status,
    updatedAt: item.updated_at || new Date().toISOString(),
  })) as VisitPlan[];
}

export async function saveVisitPlan(userId: string | null | undefined, plan: VisitPlan) {
  saveVisitPlanLocal(plan);

  if (!userId) return plan;

  const { error } = await supabase.from("user_place_states").upsert(
    {
      user_id: userId,
      place_id: plan.placeId,
      place_name: plan.placeName || null,
      plan_status: plan.status,
      updated_at: plan.updatedAt,
    },
    { onConflict: "user_id,place_id" }
  );

  if (error && !shouldFallback(error)) {
    throw error;
  }

  return plan;
}

export async function loadReviewAppreciations(userId?: string | null, placeId?: string | null) {
  if (!userId || !placeId) {
    return new Set<string>();
  }

  const { data, error } = await supabase
    .from("review_appreciations")
    .select("review_id")
    .eq("user_id", userId)
    .eq("place_id", placeId);

  if (error) {
    if (shouldFallback(error)) {
      return new Set<string>();
    }
    throw error;
  }

  return new Set((data || []).map((item: any) => String(item.review_id)));
}

export async function toggleReviewTrust(userId: string | null | undefined, placeId: string, reviewId: string) {
  const localValue = toggleReviewAppreciation(`${placeId}:${reviewId}`);

  if (!userId) {
    return localValue;
  }

  if (localValue) {
    const { error } = await supabase.from("review_appreciations").upsert(
      {
        user_id: userId,
        place_id: placeId,
        review_id: reviewId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,review_id" }
    );

    if (error && !shouldFallback(error)) {
      throw error;
    }

    return localValue;
  }

  const { error } = await supabase
    .from("review_appreciations")
    .delete()
    .eq("user_id", userId)
    .eq("review_id", reviewId);

  if (error && !shouldFallback(error)) {
    throw error;
  }

  return localValue;
}

export function getVisitPlanSummary() {
  return getVisitPlanCounts();
}

export function getLocalVisitPlan(placeId: string) {
  return getVisitPlan(placeId);
}

export function hasLocalReviewAppreciation(placeId: string, reviewId: string) {
  return isReviewAppreciated(`${placeId}:${reviewId}`);
}
