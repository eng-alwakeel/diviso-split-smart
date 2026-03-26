import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Home, Users, Plus, Receipt, UserPlus, CalendarPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const items = [
    { to: "/dashboard", label: t('nav.home'), icon: Home },
    { to: "/my-groups", label: t('nav.groups'), icon: Users },
  ];

  const fabActions = [
    { label: t('fab.add_expense'), icon: Receipt, path: "/add-expense" },
    { label: t('fab.create_group'), icon: UserPlus, path: "/create-group" },
    { label: t('fab.create_plan'), icon: CalendarPlus, path: "/create-plan" },
  ];

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path.split('?')[0]);
  const linkCls = (active: boolean) =>
    `flex flex-col items-center justify-center gap-1 flex-1 py-2 text-xs transition-colors ${
      active ? "text-primary" : "text-muted-foreground hover:text-foreground"
    }`;

  const handleAction = (path: string) => {
    setDrawerOpen(false);
    navigate(path);
  };

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50">
      <div className="mx-auto max-w-2xl lg:max-w-6xl px-4 pb-[env(safe-area-inset-bottom)]">
        <div className="relative rounded-t-2xl border-t border-x border-border/60 bg-background/95 backdrop-blur shadow-elevated supports-[backdrop-filter]:bg-background/80">
          {/* FAB Button */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-6 z-10">
            <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
              <DrawerTrigger asChild>
                <button
                  className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity active:scale-95"
                  aria-label={t('add')}
                >
                  <Plus className="h-7 w-7" strokeWidth={2.5} />
                </button>
              </DrawerTrigger>
              <DrawerContent className="pb-8">
                <div className="mx-auto w-full max-w-sm px-4 pt-4">
                  <div className="flex flex-col gap-2">
                    {fabActions.map(({ label, icon: Icon, path }) => (
                      <button
                        key={path}
                        onClick={() => handleAction(path)}
                        className="flex items-center gap-4 rounded-xl px-4 py-4 text-foreground hover:bg-accent transition-colors"
                      >
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-base font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          </div>

          {/* Tab Bar */}
          <ul className="flex items-stretch justify-between">
            {items.map(({ to, label, icon: Icon }, index) => (
              <li key={to} className={`flex-1 ${index === 0 ? 'pe-8' : 'ps-8'}`}>
                <NavLink to={to} aria-label={label} className={() => linkCls(isActive(to))} end={to === "/dashboard"}>
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
