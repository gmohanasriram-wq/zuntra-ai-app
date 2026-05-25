import { api } from "@/lib/api/client";
import { seededImage } from "@/lib/utils";
import type { BackendProperty, ChatPayload, Match, PropertyView, RegisterPayload } from "@/lib/types";

const toView = (property: BackendProperty): PropertyView => ({
  ...property,
  title: property.propertyName || "Untitled property",
  subtitle: [property.locality, property.city].filter(Boolean).join(", "),
  image: seededImage(`${property.propertyId}-cover`, 1200, 900),
  gallery: [0, 1, 2, 3].map((i) => seededImage(`${property.propertyId}-${i}`, 1400, 900))
});

export async function registerUser(payload: RegisterPayload) {
  const { data } = await api.post<{ message: string; userId: number }>("/register", payload);
  return data;
}

export async function getProperties(params?: { city?: string; locality?: string; propertyType?: string; limit?: number }) {
  const { data } = await api.get<BackendProperty[]>("/properties", { params });
  return data.map(toView);
}

export async function semanticSearch(params: { query: string; city?: string; topK?: number }) {
  const { data } = await api.get<BackendProperty[]>("/properties/semantic", { params });
  return data.map(toView);
}

export async function getPropertyById(propertyId: number, city?: string) {
  const list = await getProperties({ city, limit: 100 });
  return list.find((property) => property.propertyId === propertyId) ?? null;
}

export async function getMoveInSuggestions(propertyId: number) {
  const { data } = await api.get<{ moveInSuggestions: string[] }>(`/move-in/${propertyId}`);
  return data.moveInSuggestions;
}

export async function likeProperty(payload: { userId: number; propertyId: number }) {
  const { data } = await api.post<{ message: string }>("/like", payload);
  return data;
}

export async function bookVisit(payload: { userId: number; propertyId: number; visitDateTime: string }) {
  const { data } = await api.post<{ message: string }>("/visit", payload);
  return data;
}

export async function messageOwner(payload: { senderId: number; propertyId: number; message: string }) {
  const { data } = await api.post<{ message: string }>("/message", payload);
  return data;
}

export async function sendChat(payload: ChatPayload) {
  const { data } = await api.post<{ reply: string; retrievedCount: number }>("/chat", payload);
  return data;
}

export async function getMatches(uid: number) {
  const { data } = await api.get<Match[]>(`/matches/${uid}`);
  return data;
}
