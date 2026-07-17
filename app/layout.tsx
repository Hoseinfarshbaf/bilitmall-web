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
import DomResilience from "@/components/DomResilience";
import { THEME_NO_FLASH_SCRIPT } from "@/lib/theme-no-flash";

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
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_NO_FLASH_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased transition-colors duration-200">
        <DomResilience />
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
