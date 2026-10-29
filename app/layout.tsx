import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "stillroom — A better place to focus",
  description: "A calm, simple way to manage your reading room and find your seat.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
