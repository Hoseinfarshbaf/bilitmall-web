# بلیت‌مال (bilitmall-web)

سایت فروش بلیت رویداد با Next.js 16، PostgreSQL و Prisma.

## اجرا

```bash
npm install
npm run db:setup   # اولین بار: ساخت DB + migrate + seed
npm run dev
```

## اسکریپت‌های دیتابیس

| دستور | کاربرد |
|--------|--------|
| `npm run db:create` | ساخت دیتابیس PostgreSQL محلی |
| `npm run db:migrate` | اعمال migrationها |
| `npm run db:seed` | داده اولیه |
| `npm run db:setup` | هر سه مرحله بالا |

## مسیرهای اصلی

- `/` — مارکت‌پلیس رویدادها
- `/admin` — پنل مدیریت بلیت‌مال
- `/my-event` — استودیو برگزارکننده (My Event)
- `/sites/{slug}` — صفحه عمومی برگزارکننده (یا `{slug}.myevent.ae` در production)

راه‌اندازی دامنه `myevent.ae`: [docs/MY_EVENT_DOMAINS.md](docs/MY_EVENT_DOMAINS.md)
