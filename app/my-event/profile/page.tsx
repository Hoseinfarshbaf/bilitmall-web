"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import MyEventShell from "@/components/my-event/MyEventShell";
import { getMyEventPublicUrl, normalizeMyEventSlug } from "@/lib/my-event/auth";
import { hasUploadedImage } from "@/lib/events/helpers";
import { getEventImageStyle } from "@/lib/events/helpers";
import type { MyEventOrganizerProfile } from "@/lib/my-event/store";

async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/uploads", { method: "POST", body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "خطا در آپلود تصویر");
  return data.url as string;
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-500";
const labelClass = "mb-2 block text-sm font-bold text-slate-300";

export default function MyEventProfilePage() {
  const router = useRouter();
  const [organizerId, setOrganizerId] = useState<number | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [slugInput, setSlugInput] = useState("");
  const [originalSlug, setOriginalSlug] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [logoImage, setLogoImage] = useState("");
  const [avatarImage, setAvatarImage] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "ok" | "taken" | "invalid">(
    "idle"
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"avatar" | "logo" | "cover" | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const slug = normalizeMyEventSlug(slugInput);
  const previewUrl = slug ? getMyEventPublicUrl(slug) : "";

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/my-event/me");
      if (!response.ok) {
        router.replace("/my-event/login");
        return;
      }
      const data = await response.json();
      const org = data.organizer as MyEventOrganizerProfile;
      setOrganizerId(org.id);
      setFirstName(data.user.firstName ?? "");
      setLastName(data.user.lastName ?? "");
      setPhone(data.user.phone ?? "");
      setDisplayName(org.displayName);
      setSlugInput(org.slug);
      setOriginalSlug(org.slug);
      setBio(org.bio ?? "");
      setEmail(org.email ?? "");
      setCoverImage(org.coverImage);
      setLogoImage(org.logoImage);
      setAvatarImage(org.avatarImage ?? "");
    }

    void load();
  }, [router]);

  useEffect(() => {
    if (!slug) {
      setSlugStatus("invalid");
      return;
    }

    if (slug === originalSlug) {
      setSlugStatus("ok");
      return;
    }

    setSlugStatus("checking");
    const timer = setTimeout(async () => {
      const params = new URLSearchParams({ slug });
      if (organizerId) params.set("excludeOrganizerId", String(organizerId));
      const res = await fetch(`/api/my-event/slug-check?${params}`);
      const data = await res.json();
      if (!data.valid) {
        setSlugStatus("invalid");
      } else if (data.available) {
        setSlugStatus("ok");
      } else {
        setSlugStatus("taken");
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [slug, originalSlug, organizerId]);

  async function handleImageUpload(
    file: File | null,
    kind: "avatar" | "logo" | "cover"
  ) {
    if (!file) return;
    setUploading(kind);
    try {
      const url = await uploadImage(file);
      if (kind === "avatar") setAvatarImage(url);
      if (kind === "logo") setLogoImage(url);
      if (kind === "cover") setCoverImage(url);
    } catch (error) {
      alert(error instanceof Error ? error.message : "خطا در آپلود");
    } finally {
      setUploading(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (slug !== originalSlug && slugStatus !== "ok") {
      alert("آدرس صفحه معتبر نیست یا قبلاً ثبت شده است.");
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      alert("رمز عبور جدید و تکرار آن یکسان نیستند.");
      return;
    }

    if (newPassword && !currentPassword) {
      alert("برای تغییر رمز، رمز فعلی را وارد کنید.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/my-event/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          displayName,
          slug: slugInput,
          bio,
          email,
          coverImage,
          logoImage,
          avatarImage,
          ...(newPassword
            ? { currentPassword, newPassword }
            : {}),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "خطا در ذخیره");

      router.push("/my-event/dashboard");
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "خطا در ذخیره");
    } finally {
      setSaving(false);
    }
  }

  if (organizerId == null) {
    return (
      <MyEventShell>
        <p className="text-slate-400">در حال بارگذاری...</p>
      </MyEventShell>
    );
  }

  const avatarPreview = hasUploadedImage(avatarImage) ? avatarImage : "";
  const logoPreview = hasUploadedImage(logoImage) ? logoImage : "";
  const coverPreview = hasUploadedImage(coverImage) ? coverImage : "";

  return (
    <MyEventShell title="پروفایل برگزارکننده">
      <form
        onSubmit={handleSubmit}
        className="max-w-2xl space-y-8 rounded-3xl border border-white/10 bg-white/5 p-6"
      >
        <section className="space-y-4">
          <h2 className="text-lg font-black text-white">اطلاعات شخصی</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>نام</label>
              <input
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>نام خانوادگی</label>
              <input
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>شماره موبایل</label>
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
                dir="ltr"
                placeholder="09123456789"
              />
            </div>
            <div>
              <label className={labelClass}>ایمیل (اختیاری)</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                dir="ltr"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-black text-white">برند و لینک صفحه</h2>
          <div>
            <label className={labelClass}>نام برند / مجموعه</label>
            <input
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={inputClass}
              placeholder="مثلاً کافه رُز"
            />
          </div>
          <div>
            <label className={labelClass}>آدرس انگلیسی صفحه (نام کاربری)</label>
            <p className="mb-2 text-xs text-slate-500">
              فقط حروف کوچک انگلیسی، عدد و خط تیره. هر نام فقط یک‌بار قابل ثبت است.
            </p>
            <input
              required
              value={slugInput}
              onChange={(e) => setSlugInput(e.target.value)}
              className={`${inputClass} font-mono`}
              dir="ltr"
              placeholder="coferoze"
            />
            {slugStatus === "checking" ? (
              <p className="mt-2 text-xs text-slate-400">در حال بررسی...</p>
            ) : null}
            {slugStatus === "ok" && slug !== originalSlug ? (
              <p className="mt-2 text-xs text-emerald-400">این آدرس آزاد است.</p>
            ) : null}
            {slugStatus === "taken" ? (
              <p className="mt-2 text-xs text-red-400">این آدرس قبلاً ثبت شده است.</p>
            ) : null}
            {slugStatus === "invalid" && slugInput.trim() ? (
              <p className="mt-2 text-xs text-red-400">فرمت آدرس معتبر نیست.</p>
            ) : null}
            {previewUrl ? (
              <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
                <p className="text-xs font-bold text-emerald-300">پیش‌نمایش لینک صفحه</p>
                <p className="mt-1 font-mono text-sm text-white" dir="ltr">
                  {previewUrl}
                </p>
              </div>
            ) : null}
          </div>
          <div>
            <label className={labelClass}>درباره برند</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className={inputClass}
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-black text-white">تصاویر</h2>

          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
            <label className={labelClass}>عکس کاربری</label>
            <div className="flex flex-wrap items-center gap-4">
              <div
                className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-slate-800 bg-cover bg-center text-xs text-slate-500"
                style={avatarPreview ? getEventImageStyle(avatarPreview) : undefined}
              >
                {!avatarPreview ? "بدون عکس" : null}
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => handleImageUpload(e.target.files?.[0] ?? null, "avatar")}
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploading === "avatar"}
                className="inline-flex items-center gap-2 rounded-xl border border-dashed border-white/20 px-4 py-2 text-sm font-bold text-slate-200 hover:border-emerald-500/50 disabled:opacity-60"
              >
                <Upload className="h-4 w-4" />
                {uploading === "avatar" ? "در حال آپلود..." : "آپلود عکس کاربری"}
              </button>
              {avatarPreview ? (
                <button
                  type="button"
                  onClick={() => setAvatarImage("")}
                  className="inline-flex items-center gap-1 text-sm font-bold text-red-400"
                >
                  <X className="h-4 w-4" />
                  حذف
                </button>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
            <label className={labelClass}>لوگوی برند</label>
            <p className="mb-3 text-xs text-slate-500">در صفحه عمومی رویدادها نمایش داده می‌شود.</p>
            <div className="flex flex-wrap items-center gap-4">
              <div
                className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-800 bg-cover bg-center text-xs text-slate-500"
                style={logoPreview ? getEventImageStyle(logoPreview) : undefined}
              >
                {!logoPreview ? "لوگو" : null}
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => handleImageUpload(e.target.files?.[0] ?? null, "logo")}
              />
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploading === "logo"}
                className="inline-flex items-center gap-2 rounded-xl border border-dashed border-white/20 px-4 py-2 text-sm font-bold text-slate-200 hover:border-emerald-500/50 disabled:opacity-60"
              >
                <Upload className="h-4 w-4" />
                {uploading === "logo" ? "در حال آپلود..." : "آپلود لوگو"}
              </button>
              {logoPreview ? (
                <button
                  type="button"
                  onClick={() => setLogoImage("")}
                  className="inline-flex items-center gap-1 text-sm font-bold text-red-400"
                >
                  <X className="h-4 w-4" />
                  حذف
                </button>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
            <label className={labelClass}>تصویر کاور صفحه (اختیاری)</label>
            <div className="space-y-3">
              {coverPreview ? (
                <div
                  className="h-32 w-full rounded-xl border border-white/10 bg-cover bg-center"
                  style={getEventImageStyle(coverPreview)}
                />
              ) : null}
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => handleImageUpload(e.target.files?.[0] ?? null, "cover")}
              />
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploading === "cover"}
                className="inline-flex items-center gap-2 rounded-xl border border-dashed border-white/20 px-4 py-2 text-sm font-bold text-slate-200 hover:border-emerald-500/50 disabled:opacity-60"
              >
                <Upload className="h-4 w-4" />
                {uploading === "cover" ? "در حال آپلود..." : "آپلود کاور"}
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/50 p-4">
          <h2 className="text-lg font-black text-white">تغییر رمز عبور</h2>
          <p className="text-xs text-slate-500">اگر نمی‌خواهید رمز را عوض کنید، این بخش را خالی بگذارید.</p>
          <div>
            <label className={labelClass}>رمز فعلی</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputClass}
              dir="ltr"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>رمز جدید</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
                dir="ltr"
                minLength={6}
              />
            </div>
            <div>
              <label className={labelClass}>تکرار رمز جدید</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
                dir="ltr"
                minLength={6}
              />
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={saving || slugStatus === "taken" || slugStatus === "invalid"}
          className="w-full rounded-xl bg-emerald-600 py-3 font-black hover:bg-emerald-500 disabled:opacity-60"
        >
          {saving ? "در حال ذخیره..." : "ذخیره پروفایل"}
        </button>
      </form>
    </MyEventShell>
  );
}
