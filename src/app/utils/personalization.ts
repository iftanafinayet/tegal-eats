export type DiscoveryBudget = "hemat" | "sedang" | "premium";
export type DiscoveryMood = "makan" | "coffee" | "nongkrong";
export type DiscoveryOccasion = "kerja" | "keluarga" | "malam";

export type DiscoveryPreferences = {
  moods: DiscoveryMood[];
  budgets: DiscoveryBudget[];
  occasions: DiscoveryOccasion[];
  onboardedAt: string;
};

export type VisitPlanStatus = "wishlist" | "this_week" | "visited";

export type VisitPlan = {
  placeId: string;
  placeName?: string;
  status: VisitPlanStatus;
  updatedAt: string;
};

const PREFERENCES_KEY = "tegal-eats:discovery-preferences";
const VISIT_PLANS_KEY = "tegal-eats:visit-plans";
const REVIEW_APPRECIATIONS_KEY = "tegal-eats:review-appreciations";

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  return parseJson<T>(window.localStorage.getItem(key), fallback);
}

function writeStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getDiscoveryPreferences() {
  return readStorage<DiscoveryPreferences | null>(PREFERENCES_KEY, null);
}

export function saveDiscoveryPreferences(preferences: DiscoveryPreferences) {
  writeStorage(PREFERENCES_KEY, preferences);
}

export function getVisitPlans() {
  return readStorage<VisitPlan[]>(VISIT_PLANS_KEY, []);
}

export function getVisitPlan(placeId: string) {
  return getVisitPlans().find((plan) => plan.placeId === placeId) ?? null;
}

export function saveVisitPlan(plan: VisitPlan) {
  const nextPlans = getVisitPlans().filter((item) => item.placeId !== plan.placeId);
  nextPlans.push(plan);
  writeStorage(VISIT_PLANS_KEY, nextPlans);
}

export function removeVisitPlan(placeId: string) {
  const nextPlans = getVisitPlans().filter((item) => item.placeId !== placeId);
  writeStorage(VISIT_PLANS_KEY, nextPlans);
}

export function getVisitPlanCounts() {
  return getVisitPlans().reduce(
    (acc, plan) => {
      acc[plan.status] += 1;
      return acc;
    },
    {
      wishlist: 0,
      this_week: 0,
      visited: 0,
    }
  );
}

type ReviewAppreciations = Record<string, boolean>;

export function isReviewAppreciated(reviewKey: string) {
  const appreciations = readStorage<ReviewAppreciations>(REVIEW_APPRECIATIONS_KEY, {});
  return Boolean(appreciations[reviewKey]);
}

export function toggleReviewAppreciation(reviewKey: string) {
  const appreciations = readStorage<ReviewAppreciations>(REVIEW_APPRECIATIONS_KEY, {});
  const nextValue = !appreciations[reviewKey];
  const nextAppreciations = {
    ...appreciations,
    [reviewKey]: nextValue,
  };
  writeStorage(REVIEW_APPRECIATIONS_KEY, nextAppreciations);
  return nextValue;
}
