// سه دسته سه اسلایدی
"use client";
import React, { useRef, useEffect } from "react";
import EventCard from "./EventCard";
import { ChevronRight, ChevronLeft, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface CategorySliderProps {
  title: string;
  cityName: string;
  data: any[];
  categoryLink: string;
}

const CategorySlider = ({ title, cityName, data, categoryLink }: CategorySliderProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const repeatedData = data && data.length > 0 ? [...data, ...data, ...data, ...data, ...data] : [];

  useEffect(() => {
    if (scrollRef.current && data.length > 0) {
      const singleSectionWidth = scrollRef.current.scrollWidth / 5;
      scrollRef.current.scrollLeft = -singleSectionWidth * 2;
    }
  }, [data]);

  if (!data || data.length === 0) return null;

  const handleInfiniteScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    const sectionWidth = scrollWidth / 5;

    if (scrollLeft > -10) {
      scrollRef.current.style.scrollBehavior = "auto";
      scrollRef.current.scrollLeft = -sectionWidth * 2;
    } else if (Math.abs(scrollLeft) + clientWidth >= scrollWidth - 10) {
      scrollRef.current.style.scrollBehavior = "auto";
      scrollRef.current.scrollLeft = -sectionWidth * 2;
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const moveAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.style.scrollBehavior = "smooth";
      scrollRef.current.scrollBy({
        left: direction === "left" ? moveAmount : -moveAmount,
      });
    }
  };

  return (
    <div className="mb-16 overflow-visible">
      <div className="flex items-end justify-between mb-6 px-1">
        <div>
          <h2 className="text-2xl font-black text-neutral-900">{title}</h2>
          <p className="text-sm font-medium text-neutral-400 mt-1">
            محبوب‌ترین {title} در {cityName}
          </p>
        </div>
        <Link
          href={categoryLink}
          className="group flex items-center gap-2 text-xs font-bold bg-neutral-100 hover:bg-neutral-900 hover:text-white px-4 py-2 rounded-full transition-all duration-300"
        >
          <span>مشاهده همه</span>
          <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="relative group">
        <button
          onClick={() => scroll("right")}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-12 h-12 flex items-center justify-center bg-white/90 backdrop-blur-md shadow-xl rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110 border border-neutral-100"
        >
          <ChevronRight className="w-6 h-6 text-neutral-800" />
        </button>

        <button
          onClick={() => scroll("left")}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-12 h-12 flex items-center justify-center bg-white/90 backdrop-blur-md shadow-xl rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110 border border-neutral-100"
        >
          <ChevronLeft className="w-6 h-6 text-neutral-800" />
        </button>

        <div
          ref={scrollRef}
          onScroll={handleInfiniteScroll}
          className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-6 pt-2"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            paddingRight: "20px",
            paddingLeft: "100px",
          }}
        >
          {repeatedData.map((event, index) => (
            <div
              key={`${event.id}-${index}`}
              className="min-w-[85%] md:min-w-[30%] snap-start shrink-0"
            >
              <EventCard event={event} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategorySlider;