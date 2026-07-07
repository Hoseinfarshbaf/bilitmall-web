export type CityRecord = {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
  isPopular: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CityWithUsage = CityRecord & {
  eventCount: number;
  venueCount: number;
};
