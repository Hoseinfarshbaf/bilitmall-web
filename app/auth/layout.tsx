import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "حساب کاربری | بلیت‌مال",
  description: "ورود و ثبت‌نام در بلیت‌مال",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-neutral-50 px-4 py-12 dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-md">{children}</div>
    </div>
  );
}
