import type { EventDay, EventFormData } from "@/lib/events/types";

export type ImportProvider = "honarticket" | "melotik" | "generic";

export type ImportQuestion = {
  id: "city" | "category";
  label: string;
  type: "select";
  options: { value: string; label: string }[];
  required?: boolean;
};

export type ParsedEventPartial = {
  title?: string;
  city?: string;
  category?: string;
  place?: string;
  placeAddress?: string;
  price?: string;
  imageUrl?: string;
  days?: EventDay[];
  cityCandidates?: string[];
  categoryCandidates?: string[];
};

export type ImportResult = {
  provider: ImportProvider;
  confidence: number;
  draft: EventFormData;
  warnings: string[];
  questions: ImportQuestion[];
  sourceUrl: string;
};
