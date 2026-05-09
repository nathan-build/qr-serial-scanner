import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QR Serial Scanner",
  description: "Scan QR codes and collect serial numbers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
