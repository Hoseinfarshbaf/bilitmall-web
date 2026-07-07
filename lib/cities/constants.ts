export type DefaultCitySeed = {
  name: string;
  slug: string;
  isPopular: boolean;
  sortOrder: number;
};

export const DEFAULT_CITIES: DefaultCitySeed[] = [
  { name: "تهران", slug: "tehran", isPopular: true, sortOrder: 1 },
  { name: "اصفهان", slug: "isfahan", isPopular: true, sortOrder: 2 },
  { name: "شیراز", slug: "shiraz", isPopular: true, sortOrder: 3 },
  { name: "مشهد", slug: "mashhad", isPopular: true, sortOrder: 4 },
  { name: "تبریز", slug: "tabriz", isPopular: true, sortOrder: 5 },
  { name: "کیش", slug: "kish", isPopular: false, sortOrder: 6 },
  { name: "کرج", slug: "karaj", isPopular: false, sortOrder: 7 },
  { name: "اهواز", slug: "ahvaz", isPopular: false, sortOrder: 8 },
  { name: "رشت", slug: "rasht", isPopular: false, sortOrder: 9 },
  { name: "کرمان", slug: "kerman", isPopular: false, sortOrder: 10 },
];

/** @deprecated Use useCities() or getCityNames() — kept for type compatibility */
export const DEFAULT_CITY_NAMES = DEFAULT_CITIES.map((c) => c.name);
