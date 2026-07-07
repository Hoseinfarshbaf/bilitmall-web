"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AccountNav from "@/components/account/AccountNav";
import AccountShell from "@/components/account/AccountShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Profile = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
};

export default function AccountProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/account/profile")
      .then(async (res) => {
        if (!res.ok) {
          router.replace("/auth/login");
          return null;
        }
        return res.json() as Promise<Profile>;
      })
      .then((data) => {
        if (!data) return;
        setProfile(data);
        setName(data.name);
        setEmail(data.email ?? "");
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          currentPassword: newPassword ? currentPassword : undefined,
          newPassword: newPassword || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "خطا در ذخیره");

      setProfile(data);
      setCurrentPassword("");
      setNewPassword("");
      setMessage("تغییرات ذخیره شد.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ذخیره");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AccountShell title="ویرایش حساب">
        <p className="text-neutral-500">در حال بارگذاری...</p>
      </AccountShell>
    );
  }

  if (!profile) return null;

  return (
    <AccountShell title="ویرایش حساب">
      <AccountNav />

      <form
        onSubmit={handleSubmit}
        className="max-w-lg space-y-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
      >
        <div className="space-y-2">
          <Label>شماره موبایل</Label>
          <Input value={profile.phone} disabled dir="ltr" className="bg-neutral-50" />
          <p className="text-xs text-neutral-400">شماره موبایل قابل تغییر نیست.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">نام</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">ایمیل (اختیاری)</Label>
          <Input
            id="email"
            type="email"
            dir="ltr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <hr className="border-neutral-100" />

        <div className="space-y-2">
          <Label htmlFor="currentPassword">رمز عبور فعلی</Label>
          <Input
            id="currentPassword"
            type="password"
            dir="ltr"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword">رمز عبور جدید</Label>
          <Input
            id="newPassword"
            type="password"
            dir="ltr"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
          />
        </div>

        {message && <p className="text-sm font-medium text-green-600">{message}</p>}
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <Button type="submit" disabled={saving} className="w-full rounded-full">
          {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
        </Button>
      </form>
    </AccountShell>
  );
}
