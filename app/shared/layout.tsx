import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shared Brew | CoffeeTime",
  description: "View a shared coffee brew",
};

export default function SharedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // No AuthGuard, no BottomNav - public pages
  return <>{children}</>;
}
