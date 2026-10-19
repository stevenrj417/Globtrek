import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { AuthProvider } from "./components/AuthProvider";

export const metadata = {
  title: "globtrek - One Tab Travel",
  description:
    "Simple, affordable trip planning. Answer a few quick questions and get one trip that fits your budget.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col"><AuthProvider>{children}</AuthProvider><Analytics /></body>
    </html>
  );
}
