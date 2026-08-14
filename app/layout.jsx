import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { AuthProvider } from "./components/AuthProvider";

export const metadata = {
  title: "globtrek - One Tab Travel",
  description:
    "A premium travel discovery and planning experience for one trip in one place.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col"><AuthProvider>{children}</AuthProvider><Analytics /></body>
    </html>
  );
}
