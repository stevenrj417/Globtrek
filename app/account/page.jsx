import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import { AccountClient } from "./AccountClient";

export const metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return <main className="min-h-screen bg-bg text-ink">
    <SiteHeader />
    <AccountClient />
    <SiteFooter />
  </main>;
}
