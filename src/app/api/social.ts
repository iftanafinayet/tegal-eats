import { AuthUser } from "../../lib/auth-client";
import { dataRequest } from "../../lib/data-client";
import { AppReview } from "./contracts";

export type SocialProfile = {
  userId: string; handle: string; displayName: string; avatarUrl: string; bio: string;
  reviewCount: number; averageRating: number; followerCount: number; followingCount: number; isFollowing: boolean;
};
export type SocialActivityItem = {
  id: string; kind: "review"; actor: SocialProfile; review: AppReview; placeName: string; relativeLabel: string; emphasis: string;
};
export type ProfileTimelineItem = { id: string; title: string; detail: string; relativeLabel: string; placeName: string };

export const ensureCurrentUserSocialProfile = (user: AuthUser | null | undefined) => user ? dataRequest<void>("social.ensureProfile") : Promise.resolve();
export const fetchSuggestedProfiles = (_currentUserId?: string | null, limit = 4) => dataRequest<SocialProfile[]>("social.suggested", { limit });
export const fetchCommunityFeed = (_currentUserId?: string | null, limit = 8) => dataRequest<SocialActivityItem[]>("social.feed", { limit, followingOnly: false });
export const fetchFollowingFeed = (_currentUserId?: string | null, limit = 6) => dataRequest<SocialActivityItem[]>("social.feed", { limit, followingOnly: true });
export const fetchMySocialProfile = (_user: AuthUser) => {
  void _user;
  return dataRequest<SocialProfile>("social.me");
};
export const fetchPublicSocialProfile = (handle: string, _currentUserId?: string | null) => {
  void _currentUserId;
  return dataRequest<SocialProfile | null>("social.profile", { handle });
};
export const followProfile = (_currentUserId: string, targetUserId: string, shouldFollow: boolean) => dataRequest<void>("social.follow", { targetUserId, shouldFollow });
export const updateSocialProfile = (_userId: string, input: { displayName?: string; bio?: string; avatarUrl?: string }) => dataRequest<void>("social.update", { input });
export const fetchProfileActivity = (userId: string, limit = 6) => dataRequest<ProfileTimelineItem[]>("social.activity", { userId, limit });
export const fetchProfileReviews = (userId: string, limit = 6) => dataRequest<AppReview[]>("social.reviews", { userId, limit });
