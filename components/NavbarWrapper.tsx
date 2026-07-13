"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import { shouldShowMarketplaceNavbar } from "@/lib/layout-visibility";

export default function NavbarWrapper() {
  const pathname = usePathname();

  if (!shouldShowMarketplaceNavbar(pathname)) {
    return null;
  }

  return <Navbar />;
}
