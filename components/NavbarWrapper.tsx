// صفحه هایی که نوبار ندارند 
"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function NavbarWrapper() {
  const pathname = usePathname();

  // نوبار در صفحات ادمین و صفحات رویدادها (Discovery) نشان داده نشود
  if (pathname.startsWith("/admin") || pathname.startsWith("/events")) {
    return null;
  }

  return <Navbar />;
}
