import type { Metadata } from "next";
import MyEventThemeProvider from "@/components/my-event/MyEventThemeProvider";
import DomResilience from "@/components/DomResilience";
import { MY_EVENT_STUDIO_TAB_TITLE } from "@/lib/my-event/constants";
import { MY_EVENT_THEME_NO_FLASH_SCRIPT } from "@/lib/theme-no-flash";

export const metadata: Metadata = {
  title: {
    absolute: MY_EVENT_STUDIO_TAB_TITLE,
  },
};

export default function MyEventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div id="my-event-theme-root" suppressHydrationWarning>
      <script
        dangerouslySetInnerHTML={{ __html: MY_EVENT_THEME_NO_FLASH_SCRIPT }}
      />
      <MyEventThemeProvider>
        <DomResilience />
        {children}
      </MyEventThemeProvider>
    </div>
  );
}
