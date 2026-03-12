import type { Metadata } from "next";
import { Sora, JetBrains_Mono } from "next/font/google";
import AppToaster from "@/src/components/AppToaster";
import "./globals.css";

const sora = Sora({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Online Treasure Hunt Dashboard",
  description: "Admin console for real-time treasure hunt operations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${sora.variable} ${jetbrainsMono.variable} app-shell antialiased`}
      >
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
