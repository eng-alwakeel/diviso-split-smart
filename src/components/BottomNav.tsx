import { NavLink, useLocation } from "react-router-dom";
import { Home, Receipt, BarChart3, Share2, Settings } from "lucide-react";

export const BottomNav = () => {
  const location = useLocation();
  const items = [
    { to: "/dashboard", label: "الرئيسية", icon: Home },
    { to: "/my-expenses", label: "مصاريفي", icon: Receipt },
    { to: "/financial-plan", label: "الخطة", icon: BarChart3 },
    { to: "/referral", label: "الإحالة", icon: Share2 },
    { to: "/settings", label: "الإعدادات", icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;
  const linkCls = (active: boolean) =>
    `flex flex-col items-center justify-center gap-1 flex-1 py-2 text-xs transition-colors ${
      active ? "text-primary" : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <nav className="fixed bottom-4 inset-x-0 z-50 lg:hidden">
      <div className="mx-auto max-w-md px-4 pb-[env(safe-area-inset-bottom)]">
        <div className="rounded-2xl border border-border/60 bg-background/70 backdrop-blur shadow-elevated supports-[backdrop-filter]:bg-background/60">
          <ul className="flex items-stretch justify-between">
            {items.map(({ to, label, icon: Icon }) => (
              <li key={to} className="flex-1">
                <NavLink to={to} aria-label={label} className={link => linkCls(isActive(to))} end>
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                  {isActive(to) && <span className="mt-1 h-1 w-6 rounded-full bg-primary" aria-hidden />}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
};
