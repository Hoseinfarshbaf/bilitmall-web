# راه‌اندازی دامنه‌ها: bilitmall.com + My Event

## معماری URL

| آدرس | نقش |
|--------|-----|
| `bilitmall.com` | سایت اصلی، ادمین، استودیو برگزارکننده (`/my-event`) |
| `www.myevent.{slug}` | صفحه عمومی برگزارکننده |
| `www.myevent.{slug}/{eventEn}/{cityEn}` | صفحه رویداد (مثلاً `/arminzarei/tehran`) |
| `/sites/{slug}/{eventEn}/{cityEn}` | همان صفحه در حالت توسعه محلی |

مثال: `https://www.myevent.cofe-roz/arminzarei/tehran`

لینک‌های قدیمی `/sites/cofe-roz/کنسرت-...` به‌صورت خودکار به URL جدید ریدایرکت می‌شوند.

از بلیت‌مال، کارت رویدادهای My Event مستقیماً به همین صفحه اختصاصی می‌روند.

---

## متغیرهای محیطی

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MY_EVENT_HOST_SUFFIX=.localhost
NEXT_PUBLIC_MY_EVENT_USE_WWW_HOST=true
```

در production می‌توانید `NEXT_PUBLIC_MY_EVENT_HOST_SUFFIX` را خالی بگذارید اگر DNS دقیقاً `www.myevent.cofe-roz` است.

---

## تست محلی

مرورگرهای مدرن `*.localhost` را به `127.0.0.1` resolve می‌کنند:

- `http://localhost:3000` → بلیت‌مال
- `http://www.myevent.cofe-roz.localhost:3000/arminzarei/tehran` → صفحه رویداد
- `http://localhost:3000/sites/cofe-roz/arminzarei/tehran` → همان صفحه (مسیر داخلی)

---

## Legacy: `{slug}.myevent.ae`

هنوز از middleware پشتیبانی می‌شود و به `/sites/{slug}/...` rewrite می‌شود.