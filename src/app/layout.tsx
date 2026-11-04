import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: { default: "Wisdom To Life Ministry", template: "%s | Wisdom To Life Ministry" },
  description: "A place of faith, hope and transformation. Discover the life-changing wisdom of God with Wisdom To Life Ministry.",
  keywords: ["Wisdom To Life Ministry", "church", "Christian ministry", "worship", "sermons"],
  openGraph: { title: "Wisdom To Life Ministry", description: "God's wisdom. Real life. Lasting transformation.", type: "website" },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSettings();
  return <html lang="en"><body><a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-white focus:p-3">Skip to content</a><Navbar identity={settings.site_identity} /><main id="main-content">{children}</main><Footer settings={settings} /></body></html>;
}
