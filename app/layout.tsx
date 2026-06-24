import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
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
        <CityProvider>
          <Navbar />
          {children}
        </CityProvider>
      </body>
    </html>
  );
}
