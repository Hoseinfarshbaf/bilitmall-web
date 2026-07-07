import MyEventThemeProvider from "@/components/my-event/MyEventThemeProvider";

export default function MyEventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MyEventThemeProvider>{children}</MyEventThemeProvider>;
}
