"use client";

import { create } from "zustand";

type UserState = {
  userId: number | null;
  name: string;
  mobile: string;
  city: string;
  setUser: (payload: { userId: number; name: string; mobile: string; city: string }) => void;
};

export const useUserStore = create<UserState>((set) => ({
  userId: null,
  name: "",
  mobile: "",
  city: "Chennai",
  setUser: (payload) => set(payload)
}));
