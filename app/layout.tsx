import type { Metadata } from "next";
import "./globals.css";
import FooterWrapper from "@/components/FooterWrapper";
import NavbarWrapper from "@/components/NavbarWrapper";
import { AuthProvider } from "@/components/AuthProvider";
import { CitiesProvider } from "@/components/CitiesProvider";
import { CityProvider } from "@/components/CityContext";

export const metadata: Metadata = {
  title: "بلیت‌مال",
  description: "خرید بلیت رویدادها",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <AuthProvider>
          <CitiesProvider>
            <CityProvider>
              <NavbarWrapper />
              {children}
              <FooterWrapper />
            </CityProvider>
          </CitiesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
