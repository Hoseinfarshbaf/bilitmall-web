//  سرچ باکس

import { Search } from "lucide-react";

export default function SearchBar() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="relative">
        <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-red-600" />
        <input
          type="text"
          placeholder="جستجوی رویداد، هنرمند، تیم و..."
          className="w-full rounded-full border border-neutral-200 bg-white py-4 pr-12 pl-5 text-sm text-neutral-800 shadow-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
        />
      </div>
    </div>
  );
}
