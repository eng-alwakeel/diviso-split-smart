import { NavLink, useLocation } from "react-router-dom";
import { Home, Receipt, Users, Share2, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";

export const BottomNav = () => {
  const location = useLocation();
  const { t } = useTranslation('common');
  
  const items = [
    { to: "/dashboard", label: t('nav.home'), icon: Home },
    { to: "/my-expenses", label: t('nav.expenses'), icon: Receipt },
    { to: "/my-groups", label: t('nav.groups'), icon: Users },
    { to: "/referral", label: t('nav.referral'), icon: Share2 },
    { to: "/settings", label: t('nav.settings'), icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;
  const linkCls = (active: boolean) =>
    `flex flex-col items-center justify-center gap-1 flex-1 py-2 text-xs transition-colors ${
      active ? "text-primary" : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <nav className="fixed bottom-4 inset-x-0 z-50">
      <div className="mx-auto max-w-2xl lg:max-w-6xl px-4 pb-[env(safe-area-inset-bottom)]">
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
