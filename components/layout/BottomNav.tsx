"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Clock, BarChart3, Settings, Users, Package, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/following", label: "Social", icon: Users },
  { href: "/coffees", label: "Coffees", icon: Coffee },
  { href: "/equipment", label: "Equipment", icon: Package },
  { href: "/history", label: "History", icon: Clock },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border/50 bg-card/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around px-1">
        {navItems.map((item) => {
          const isActive = item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 transition-all duration-200",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <span className="absolute inset-0 rounded-xl bg-primary/10" />
              )}
              <Icon
                className={cn(
                  "relative h-5 w-5 transition-transform duration-200",
                  isActive ? "scale-110" : "group-hover:scale-105"
                )}
              />
              <span
                className={cn(
                  "relative text-[10px] font-medium tracking-wide",
                  isActive && "font-semibold"
                )}
              >
                {item.label}
              </span>
              {isActive && (
                <span className="absolute -top-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
