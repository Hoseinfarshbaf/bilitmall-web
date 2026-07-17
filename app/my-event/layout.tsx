import MyEventThemeProvider from "@/components/my-event/MyEventThemeProvider";
import DomResilience from "@/components/DomResilience";

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
