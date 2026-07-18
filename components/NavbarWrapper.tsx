"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import { isMyEventPublicHost } from "@/lib/my-event/domains";
import { shouldShowMarketplaceNavbar } from "@/lib/layout-visibility";

type Props = {
  /** From middleware on organizer subdomain — avoids SSR chrome flash. */
  organizerPublic?: boolean;
};

export default function NavbarWrapper({ organizerPublic = false }: Props) {
  const pathname = usePathname() ?? "";
  const [hostPublic, setHostPublic] = useState(false);

  useEffect(() => {
    const host = window.location.host.split(":")[0]?.toLowerCase() ?? "";
    setHostPublic(isMyEventPublicHost(host));
  }, []);

  if (
    !shouldShowMarketplaceNavbar(pathname, {
      organizerPublic: organizerPublic || hostPublic,
    })
  ) {
    return null;
  }

  return <Navbar />;
}
