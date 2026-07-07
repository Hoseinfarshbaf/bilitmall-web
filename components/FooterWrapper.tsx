"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";
import { shouldShowMarketplaceFooter } from "@/lib/layout-visibility";

export default function FooterWrapper() {
  const pathname = usePathname();

  if (!shouldShowMarketplaceFooter(pathname)) {
    return null;
  }

  return <Footer />;
}
