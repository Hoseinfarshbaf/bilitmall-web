"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";
import { isMyEventPublicHost } from "@/lib/my-event/domains";
import { shouldShowMarketplaceFooter } from "@/lib/layout-visibility";

type Props = {
  /** From middleware on organizer subdomain — avoids SSR chrome flash. */
  organizerPublic?: boolean;
};

export default function FooterWrapper({ organizerPublic = false }: Props) {
  const pathname = usePathname() ?? "";
  const [hostPublic, setHostPublic] = useState(false);

  useEffect(() => {
    const host = window.location.host.split(":")[0]?.toLowerCase() ?? "";
    setHostPublic(isMyEventPublicHost(host));
  }, []);

  if (
    !shouldShowMarketplaceFooter(pathname, {
      organizerPublic: organizerPublic || hostPublic,
    })
  ) {
    return null;
  }

  return <Footer />;
}
