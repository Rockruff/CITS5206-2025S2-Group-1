import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SafeTrack - Health, Safety & Wellbeing Training Tracker",
  description: "UWA HSW Training Tracker",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-muted color-foreground overflow-x-hidden overflow-y-auto`}>
        <div>{children}</div>
        <Toaster />
      </body>
    </html>
  );
}
