import type { Metadata } from "next";
import {
  AdminThemeProvider,
  AdminThemeToggle,
} from "@/components/admin/AdminThemeProvider";
import { ADMIN_THEME_NO_FLASH_SCRIPT } from "@/lib/theme-no-flash";

export const metadata: Metadata = {
  title: {
    absolute: "پنل ادمین",
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div id="admin-theme-root" suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: ADMIN_THEME_NO_FLASH_SCRIPT }} />
      <AdminThemeProvider>
        {children}
        <AdminThemeToggle />
      </AdminThemeProvider>
    </div>
  );
}
