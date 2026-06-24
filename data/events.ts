export type EventItem = {
  id: number;
  title: string;
  city: string;
  category: string;
  date: string;
  place: string;
  price: string;
  badge?: string;
};

export const events: EventItem[] = [
  {
    id: 1,
    title: "کنسرت علیرضا قربانی",
    city: "تهران",
    category: "کنسرت",
    date: "۲۸ تیر ۱۴۰۳",
    place: "برج میلاد",
    price: "از ۴۵۰,۰۰۰ تومان",
    badge: "پیشنهاد ویژه",
  },
  {
    id: 2,
    title: "نمایش هملت",
    city: "تهران",
    category: "تئاتر",
    date: "۳۰ تیر ۱۴۰۳",
    place: "تئاتر شهر",
    price: "از ۲۲۰,۰۰۰ تومان",
  },
  {
    id: 3,
    title: "استقلال و پرسپولیس",
    city: "تهران",
    category: "ورزش",
    date: "۳ مرداد ۱۴۰۳",
    place: "ورزشگاه آزادی",
    price: "از ۱۵۰,۰۰۰ تومان",
  },
  {
    id: 4,
    title: "کنسرت محسن یگانه",
    city: "تهران",
    category: "کنسرت",
    date: "۵ مرداد ۱۴۰۳",
    place: "سالن میلاد",
    price: "از ۳۸۰,۰۰۰ تومان",
  },
  {
    id: 5,
    title: "جشنواره موسیقی ساحلی",
    city: "کیش",
    category: "کنسرت",
    date: "۷ مرداد ۱۴۰۳",
    place: "سالن خلیج فارس",
    price: "از ۳۱۰,۰۰۰ تومان",
    badge: "محبوب این هفته",
  },
  {
    id: 6,
    title: "استندآپ کمدی جنوب",
    city: "کیش",
    category: "تئاتر",
    date: "۹ مرداد ۱۴۰۳",
    place: "مرکز همایش‌ها",
    price: "از ۲۰۰,۰۰۰ تومان",
  },
  {
    id: 7,
    title: "فستیوال شب‌های شیراز",
    city: "شیراز",
    category: "کنسرت",
    date: "۱۰ مرداد ۱۴۰۳",
    place: "حافظیه",
    price: "از ۲۸۰,۰۰۰ تومان",
    badge: "ویژه",
  },
  {
    id: 8,
    title: "نمایش راز باغ",
    city: "شیراز",
    category: "تئاتر",
    date: "۱۲ مرداد ۱۴۰۳",
    place: "تالار هنر",
    price: "از ۱۷۰,۰۰۰ تومان",
  },
];
