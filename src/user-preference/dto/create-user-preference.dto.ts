export class CreateUserPreferenceDto {
  userId!: number;
  city?: string;
  locality?: string;
  search?: string;
  pgFor?: string;
  sharingTypes?: any;
  preferredTenant?: string;
  availability?: string;
  parking?: string;
  foodIncluded?: boolean;
  rentMin?: number;
  rentMax?: number;
  amenities?: any;
  nearby?: any;
  restrictions?: any;
  premiumSort?: string;
}