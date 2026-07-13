import Link from "next/link";
import { Ticket } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AuthCardProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export default function AuthCard({
  title,
  description,
  children,
  footer,
}: AuthCardProps) {
  return (
    <Card className="rounded-3xl border-neutral-200 bg-white shadow-sm ring-0 dark:border-neutral-800 dark:bg-neutral-900">
      <CardHeader className="items-center text-center">
        <Link
          href="/"
          className="mb-2 flex items-center gap-2 text-xl font-black text-red-600"
        >
          <Ticket className="h-7 w-7" />
          <span>بلیت‌مال</span>
        </Link>
        <CardTitle className="text-xl font-black text-neutral-900 dark:text-neutral-100">
          {title}
        </CardTitle>
        <CardDescription className="text-neutral-500 dark:text-neutral-400">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer && (
        <div className="border-t border-neutral-100 px-6 py-4 text-center text-sm text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
          {footer}
        </div>
      )}
    </Card>
  );
}
