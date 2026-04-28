import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mind-Fuse | Management Surface",
  description: "Management surface for canvas-native technical investigations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
