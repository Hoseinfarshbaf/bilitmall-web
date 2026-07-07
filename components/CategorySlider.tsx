"use client";

import React, { useRef, useEffect, useCallback, useMemo } from "react";
import EventCard from "./EventCard";
import { ChevronRight, ChevronLeft, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { EventItem } from "@/lib/events/types";
import { buildDiscoveryPageUrl, getDiscoveryCategorySlug } from "@/lib/events/helpers";

type CategorySliderVariant = "upcoming" | "popular";

interface CategorySliderProps {
  categoryLabel: string;
  cityName: string;
  data: EventItem[];
  /** فیلتر دسته — اگر مشخص شود فقط رویدادهای همان شهر و دسته نمایش داده می‌شوند */
  category?: string;
  variant?: CategorySliderVariant;
}

const UPCOMING_SUBTITLES: Record<string, (city: string) => string> = {
  کنسرت: (city) => `کنسرت‌های پیش رو در ${city}`,
  تئاتر: (city) => `تئاترهای پیش رو در ${city}`,
  ایونت: (city) => `ایونت‌های پیش رو در ${city}`,
};

function buildDisplayTitle(
  categoryLabel: string,
  variant: CategorySliderVariant
): string {
  if (variant === "popular") return "محبوب‌ترین";
  return categoryLabel;
}

function buildSubtitle(
  cityName: string,
  categoryLabel: string,
  variant: CategorySliderVariant
): string {
  if (variant === "popular") {
    return `رویدادهای پرطرفدار ${cityName}`;
  }
  const builder = UPCOMING_SUBTITLES[categoryLabel];
  return builder ? builder(cityName) : `${categoryLabel}‌های پیش رو در ${cityName}`;
}

const CategorySlider = ({
  categoryLabel,
  cityName,
  data,
  category,
  variant = "upcoming",
}: CategorySliderProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const listHref = useMemo(
    () =>
      buildDiscoveryPageUrl(
        cityName,
        getDiscoveryCategorySlug(variant, category, categoryLabel)
      ),
    [cityName, variant, category, categoryLabel]
  );

  const visibleData = useMemo(() => {
    return data.filter((event) => {
      if (event.city !== cityName) return false;
      if (category && event.category !== category) return false;
      if (variant === "popular" && event.popular !== true) return false;
      return true;
    });
  }, [data, cityName, category, variant]);

  const isInfiniteDesktop = visibleData.length >= 4;

  const repeatedData = isInfiniteDesktop
    ? [...visibleData, ...visibleData, ...visibleData, ...visibleData, ...visibleData]
    : visibleData;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !isInfiniteDesktop) return;
    const sectionWidth = el.scrollWidth / 5;
    el.scrollLeft = -(sectionWidth * 2);
  }, [visibleData, isInfiniteDesktop]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || !isInfiniteDesktop) return;
    if (window.innerWidth < 768) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const sectionWidth = scrollWidth / 5;
    if (scrollLeft > -10) {
      el.style.scrollBehavior = "auto";
      el.scrollLeft = -(sectionWidth * 2);
      setTimeout(() => {
        el.style.scrollBehavior = "smooth";
      }, 50);
    } else if (Math.abs(scrollLeft) + clientWidth >= scrollWidth - 10) {
      el.style.scrollBehavior = "auto";
      el.scrollLeft = -(sectionWidth * 2);
      setTimeout(() => {
        el.style.scrollBehavior = "smooth";
      }, 50);
    }
  };

  const scroll = useCallback((direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = 300 + 16;
    el.style.scrollBehavior = "smooth";
    el.scrollBy({ left: direction === "left" ? -cardWidth : cardWidth });
  }, []);

  if (!visibleData || visibleData.length === 0) return null;

  const displayTitle = buildDisplayTitle(categoryLabel, variant);
  const subtitle = buildSubtitle(cityName, categoryLabel, variant);

  const wrapperClass = isInfiniteDesktop
    ? "flex flex-nowrap gap-4 pb-4 pt-2 px-2 overflow-x-auto snap-x snap-mandatory"
    : "flex flex-nowrap gap-4 pb-4 pt-2 px-2 overflow-x-auto snap-x snap-mandatory touch-pan-x md:overflow-visible md:flex-wrap md:snap-none";

  return (
    <div className="mb-12">
      <div className="mb-5 flex items-end justify-between gap-4 px-1">
        <Link
          href={listHref}
          className="group/title min-w-0 transition-opacity hover:opacity-90"
        >
          <h2 className="text-[26px] font-extrabold leading-tight tracking-tight text-neutral-900 group-hover/title:text-red-600 sm:text-[28px]">
            {displayTitle}
          </h2>
          <p className="mt-1 text-sm font-normal leading-relaxed tracking-tight text-neutral-400 group-hover/title:text-neutral-500 sm:text-[15px]">
            {subtitle}
          </p>
        </Link>

        {visibleData.length >= 4 ? (
          <Link
            href={listHref}
            className="flex shrink-0 items-center gap-2 rounded-full bg-neutral-100 px-4 py-2 text-xs font-bold transition-all duration-300 hover:bg-neutral-900 hover:text-white"
          >
            <span>مشاهده همه</span>
            <ArrowLeft className="h-3 w-3" />
          </Link>
        ) : null}
      </div>

      <div className="relative">
        {isInfiniteDesktop && (
          <>
            <button
              type="button"
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 z-30 -mr-4 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-100 bg-white shadow-lg transition-all hover:scale-110 md:flex"
            >
              <ChevronRight className="h-5 w-5 text-neutral-800" />
            </button>
            <button
              type="button"
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 z-30 -ml-4 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-100 bg-white shadow-lg transition-all hover:scale-110 md:flex"
            >
              <ChevronLeft className="h-5 w-5 text-neutral-800" />
            </button>
          </>
        )}

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className={wrapperClass}
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {repeatedData.map((event, index) => (
            <div key={`${event.id}-${index}`} className="shrink-0 snap-start">
              <EventCard event={event} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategorySlider;
