import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EdGame — Game-Based Learning Analytics",
  description: "Behavioral assessment platform for K-12 classrooms",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
