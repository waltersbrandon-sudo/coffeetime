import { BottomNav } from "@/components/layout/BottomNav";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen pb-16">
        {children}
        <BottomNav />
      </div>
    </AuthGuard>
  );
}
