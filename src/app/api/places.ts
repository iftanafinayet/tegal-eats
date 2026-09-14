import { dataRequest } from "../../lib/data-client";
import { AppPlace, AppReview, PlaceRecord, ReviewRecord } from "./contracts";

export const fetchPlaces = () => dataRequest<AppPlace[]>("places.list");
export const fetchPlaceById = (id: string) => dataRequest<AppPlace | null>("places.get", { id });
export async function fetchPlaceNameById(id: string) { return (await fetchPlaceById(id))?.name || "Tempat Ini"; }
export const fetchMapPlaces = (limit = 50) => dataRequest<AppPlace[]>("places.map", { limit });
export const fetchFavoritePlaces = (placeIds: string[]) => placeIds.length ? dataRequest<AppPlace[]>("places.byIds", { placeIds }) : Promise.resolve([]);
export const fetchReviewsForPlace = (placeId: string) => dataRequest<AppReview[]>("reviews.byPlace", { placeId });
export const fetchUserReviews = (userId: string) => dataRequest<AppReview[]>("reviews.byUser", { userId });

export type CreatePlaceInput = { name: string; category: string; address: string; lat: number; lng: number; imageUrl: string | null; description?: string; hours?: string | null; priceLabel?: string | null };
export const createPlace = (input: CreatePlaceInput) => dataRequest<PlaceRecord>("places.create", { input });
export const importInternetPlace = (input: Omit<CreatePlaceInput, "imageUrl">) => dataRequest<AppPlace>("places.import", { input });
export const createReview = (input: { placeId: string; userId: string; rating: number; comment: string; photoUrls: string[]; placeName: string; userName: string; avatarUrl: string | null }) => dataRequest<void>("reviews.create", { input });
export const isPlaceFavorited = (_userId: string, placeId: string) => {
  void _userId;
  return dataRequest<boolean>("favorites.has", { placeId });
};
export const listFavoritePlaceIds = (_userId: string) => {
  void _userId;
  return dataRequest<string[]>("favorites.list");
};
export const setPlaceFavorite = (_userId: string, placeId: string, shouldFavorite: boolean) => {
  void _userId;
  return dataRequest<void>("favorites.set", { placeId, shouldFavorite });
};
export const listAllPlaces = () => dataRequest<PlaceRecord[]>("admin.places");
export const listAllReviews = () => dataRequest<ReviewRecord[]>("admin.reviews");
export const updatePlace = (id: string, fields: Record<string, unknown>) => dataRequest<PlaceRecord>("admin.place.update", { id, fields });
export const deletePlace = (id: string) => dataRequest<void>("admin.place.delete", { id });
export const deleteReview = (id: string) => dataRequest<void>("admin.review.delete", { id });
