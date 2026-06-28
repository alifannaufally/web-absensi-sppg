import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import ServiceWorker from "@/components/ServiceWorker";
import { Toaster } from "sonner";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta-sans",
});

export const metadata: Metadata = {
  title: "Absensi SPPG",
  description: "Sistem Absensi Pos Security",
  manifest: "/manifest.json",
  icons: {
    icon: "/bgn.svg",
    apple: "/bgn.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Absensi SPPG",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#092F54",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${plusJakartaSans.variable} font-sans bg-gray-50 text-gray-900 antialiased`}>
        {children}
        <ServiceWorker />
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
