import cityRows from "@/lib/cities/data/iran-cities.source.json";
import countyRows from "@/lib/cities/data/iran-counties.source.json";
import provinceRows from "@/lib/cities/data/iran-provinces.source.json";

type DivisionRow = {
  name: string;
};

function normalizeIranDivisionName(name: string) {
  return name
    .replace(/\u200c/g, " ")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function buildNameMap(rows: DivisionRow[]) {
  return new Map(rows.map((row) => [normalizeIranDivisionName(row.name), row.name]));
}

const CITY_NAME_MAP = buildNameMap(cityRows as DivisionRow[]);
const COUNTY_NAME_MAP = buildNameMap(countyRows as DivisionRow[]);
const PROVINCE_NAME_MAP = buildNameMap(provinceRows as DivisionRow[]);

export function validateIranCityOrCounty(name: string):
  | { ok: true; canonicalName: string; kind: "city" | "county" }
  | { ok: false; error: string } {
  const normalized = normalizeIranDivisionName(name);

  if (!normalized) {
    return { ok: false, error: "نام شهر الزامی است." };
  }

  const provinceName = PROVINCE_NAME_MAP.get(normalized);
  if (provinceName) {
    return {
      ok: false,
      error: `«${provinceName}» استان است. فقط شهر یا شهرستانِ واقعیِ ایران قابل ثبت است.`,
    };
  }

  const cityName = CITY_NAME_MAP.get(normalized);
  if (cityName) {
    return { ok: true, canonicalName: cityName, kind: "city" };
  }

  const countyName = COUNTY_NAME_MAP.get(normalized);
  if (countyName) {
    return { ok: true, canonicalName: countyName, kind: "county" };
  }

  return {
    ok: false,
    error:
      "این نام در فهرست رسمی شهرها و شهرستان‌های ایران پیدا نشد. فقط شهر یا شهرستانِ واقعیِ ایران قابل ثبت است.",
  };
}
