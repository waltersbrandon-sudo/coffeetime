import { BottomNav } from "@/components/layout/BottomNav";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen pb-16 bg-background">
        {/* Centered container for desktop with max-width */}
        <div className="mx-auto max-w-2xl lg:max-w-3xl">
          {children}
        </div>
        <BottomNav />
      </div>
    </AuthGuard>
  );
}
