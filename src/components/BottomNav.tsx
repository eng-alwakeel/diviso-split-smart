import { NavLink, useLocation } from "react-router-dom";
import { Home, Receipt, Users, Share2, Settings, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCurrentUserRoles } from "@/hooks/useCurrentUserRoles";

export const BottomNav = () => {
  const location = useLocation();
  const { t } = useTranslation('common');
  const { hasAnyAdminRole, getMainDashboard } = useCurrentUserRoles();
  
  const baseItems = [
    { to: "/dashboard", label: t('nav.home'), icon: Home },
    { to: "/my-expenses", label: t('nav.expenses'), icon: Receipt },
    { to: "/my-groups", label: t('nav.groups'), icon: Users },
    { to: "/referral", label: t('nav.referral'), icon: Share2 },
  ];

  // Add admin dashboard link if user has any admin role
  const items = hasAnyAdminRole
    ? [
        ...baseItems,
        { 
          to: getMainDashboard().path, 
          label: t('nav.admin', 'إدارة'), 
          icon: Shield 
        },
      ]
    : [
        ...baseItems,
        { to: "/settings", label: t('nav.settings'), icon: Settings },
      ];

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path.split('?')[0]);
  const linkCls = (active: boolean) =>
    `flex flex-col items-center justify-center gap-1 flex-1 py-2 text-xs transition-colors ${
      active ? "text-primary" : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50">
      <div className="mx-auto max-w-2xl lg:max-w-6xl px-4 pb-[env(safe-area-inset-bottom)]">
        <div className="rounded-t-2xl border-t border-x border-border/60 bg-background/95 backdrop-blur shadow-elevated supports-[backdrop-filter]:bg-background/80">
          <ul className="flex items-stretch justify-between">
            {items.map(({ to, label, icon: Icon }) => (
              <li key={to} className="flex-1">
                <NavLink to={to} aria-label={label} className={link => linkCls(isActive(to))} end={to === "/dashboard"}>
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
