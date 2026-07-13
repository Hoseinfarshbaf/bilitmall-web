import type { Metadata } from "next";
import "./globals.css";
import FooterWrapper from "@/components/FooterWrapper";
import NavbarWrapper from "@/components/NavbarWrapper";
import { AuthProvider } from "@/components/AuthProvider";
import { FavoritesProvider } from "@/components/FavoritesProvider";
import { ToastProvider } from "@/components/ToastProvider";
import { CitiesProvider } from "@/components/CitiesProvider";
import { CityProvider } from "@/components/CityContext";
import CitySelectionSync from "@/components/CitySelectionSync";
import { ThemeProvider } from "@/components/ThemeProvider";

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
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased transition-colors duration-200">
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <FavoritesProvider>
                <CitiesProvider>
                  <CityProvider>
                    <CitySelectionSync />
                    <NavbarWrapper />
                    {children}
                    <FooterWrapper />
                  </CityProvider>
                </CitiesProvider>
              </FavoritesProvider>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
