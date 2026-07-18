# راه‌اندازی دامنه‌ها: bilitmall.com + صفحه برگزارکننده

## معماری URL

| آدرس | نقش |
|--------|-----|
| `bilitmall.com` | مارکت‌پلیس بلیت‌مال |
| `bilitmall.com/my-event` | استودیو برگزارکننده (My Event Studio) |
| `{slug}.bilitmall.com` | صفحه فروش اختصاصی برگزارکننده |
| `{slug}.bilitmall.com/{event}` | صفحه رویداد (مثلاً `afra.bilitmall.com/dorehami`) |
| `/sites/{slug}/{event}` | همان صفحه در حالت توسعه محلی |

از بلیت‌مال، کارت رویدادهای My Event به همین صفحه اختصاصی می‌روند.

---

## متغیرهای محیطی (production)

```
NEXT_PUBLIC_APP_URL=https://bilitmall.com
MY_EVENT_PAGES_DOMAIN=bilitmall.com
NEXT_PUBLIC_MY_EVENT_PAGES_DOMAIN=bilitmall.com
NEXT_PUBLIC_MY_EVENT_USE_LOCAL_PATHS=false
```

## توسعه محلی

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
# بدون USE_LOCAL_PATHS=false → لینک‌ها /sites/{slug}/... هستند
```

- `http://localhost:3000` → مارکت‌پلیس
- `http://localhost:3000/sites/afra/dorehami` → صفحه رویداد
- برای تست ساب‌دامین محلی: host مثل `afra.localhost:3000` با `MY_EVENT_PAGES_DOMAIN=localhost`

---

## DNS / TLS (خارج از اپ)

- رکورد wildcard: `*.bilitmall.com` → همان اپلیکیشن
- گواهی TLS برای wildcard

---

## سازگاری موقت (legacy)

این hostها هنوز در middleware به `/sites/{slug}/...` rewrite می‌شوند:

- `{slug}.myevent.ae`
- `myevent.{slug}.ae`

لینک‌های ساخته‌شده در UI فقط شکل `{slug}.bilitmall.com` هستند.
