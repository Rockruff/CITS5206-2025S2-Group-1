import type { Metadata } from "next";

import "@/app/globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "SafeTrack",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-muted color-foreground overflow-x-hidden overflow-y-auto">
        <div>{children}</div>
        <Toaster />
      </body>
    </html>
  );
}
