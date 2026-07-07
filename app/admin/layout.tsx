import {
  AdminThemeProvider,
  AdminThemeToggle,
} from "@/components/admin/AdminThemeProvider";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminThemeProvider>
      {children}
      <AdminThemeToggle />
    </AdminThemeProvider>
  );
}
