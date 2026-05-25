export type BackendProperty = {
  propertyId: number;
  userId?: number;
  city?: string;
  locality?: string;
  street?: string;
  landmark?: string;
  latitude?: number | null;
  longitude?: number | null;
  propertyName?: string;
  propertyType?: string;
  parking?: string;
  score?: number;
};

export type PropertyView = BackendProperty & {
  title: string;
  subtitle: string;
  image: string;
  gallery: string[];
};

export type RegisterPayload = {
  name: string;
  mobile: string;
  city: string;
};

export type ChatPayload = {
  userId: number;
  message: string;
  city?: string;
};

export type Match = {
  userId: number;
  name: string;
  mobile: string;
  score: number;
};
