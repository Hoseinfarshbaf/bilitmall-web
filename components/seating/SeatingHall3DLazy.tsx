"use client";

import dynamic from "next/dynamic";
import type { SeatCell, SeatSaleStatus, SeatingLayout } from "@/lib/seating/types";

const SeatingHall3D = dynamic(() => import("@/components/seating/SeatingHall3D"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[min(68vh,560px)] items-center justify-center rounded-2xl bg-[#0c1222] text-sm font-bold text-white/70">
      در حال بارگذاری سالن سه‌بعدی…
    </div>
  ),
});

type SeatingHall3DLazyProps = {
  layout: SeatingLayout;
  selectedIds: string[];
  onToggleSeat: (seatId: string, cell: SeatCell) => void;
  occupancy?: Record<string, Exclude<SeatSaleStatus, "available" | "selected">>;
  className?: string;
};

export default function SeatingHall3DLazy(props: SeatingHall3DLazyProps) {
  return <SeatingHall3D {...props} />;
}
