import { NavLink, useLocation } from "react-router-dom";
import { Home, Receipt, BarChart3, Share2, Settings } from "lucide-react";

export const BottomNav = () => {
  const location = useLocation();
  const items = [
    { to: "/dashboard", label: "الرئيسية", icon: Home },
    { to: "/add-expense", label: "مصروف", icon: Receipt },
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
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 md:hidden">
      <div className="mx-auto max-w-lg px-2">
        <ul className="flex items-stretch justify-between">
          {items.map(({ to, label, icon: Icon }) => (
            <li key={to} className="flex-1">
              <NavLink to={to} aria-label={label} className={link => linkCls(isActive(to))} end>
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};
