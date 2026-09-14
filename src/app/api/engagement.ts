import { dataRequest } from "../../lib/data-client";
import { getVisitPlan, getVisitPlanCounts, getVisitPlans, isReviewAppreciated, saveVisitPlan as saveVisitPlanLocal, toggleReviewAppreciation, VisitPlan } from "../utils/personalization";

export async function loadVisitPlans(userId?: string | null) { return userId ? dataRequest<VisitPlan[]>("plans.list") : getVisitPlans(); }
export async function saveVisitPlan(userId: string | null | undefined, plan: VisitPlan) {
  saveVisitPlanLocal(plan);
  if (userId) await dataRequest("plans.save", { plan });
  return plan;
}
export async function loadReviewAppreciations(userId?: string | null, placeId?: string | null) {
  return userId && placeId ? new Set(await dataRequest<string[]>("appreciations.list", { placeId })) : new Set<string>();
}
export async function toggleReviewTrust(userId: string | null | undefined, placeId: string, reviewId: string) {
  const localValue = toggleReviewAppreciation(`${placeId}:${reviewId}`);
  if (userId) await dataRequest("appreciations.set", { placeId, reviewId, active: localValue });
  return localValue;
}
export const getVisitPlanSummary = () => getVisitPlanCounts();
export const getLocalVisitPlan = (placeId: string) => getVisitPlan(placeId);
export const hasLocalReviewAppreciation = (placeId: string, reviewId: string) => isReviewAppreciated(`${placeId}:${reviewId}`);
