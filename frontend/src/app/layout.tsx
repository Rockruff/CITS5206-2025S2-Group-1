import type { Metadata } from "next";

import "@/app/globals.css";

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
      <body className="overflow-x-hidden overflow-y-auto">{children}</body>
    </html>
  );
}
