import type { Metadata } from "next";
import MyEventThemeProvider from "@/components/my-event/MyEventThemeProvider";
import DomResilience from "@/components/DomResilience";
import { MY_EVENT_STUDIO_TAB_TITLE } from "@/lib/my-event/constants";

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
    <MyEventThemeProvider>
      <DomResilience />
      {children}
    </MyEventThemeProvider>
  );
}
