import { useTranslation } from "react-i18next";

export const RamadanHeroBanner = () => {
  const { t, i18n } = useTranslation('landing');
  const isRTL = i18n.language === 'ar';

  return (
    <section
      dir={isRTL ? 'rtl' : 'ltr'}
      className="relative overflow-hidden bg-gradient-to-b from-[hsl(var(--background))] via-[hsl(220,20%,8%)] to-[hsl(var(--background))]"
    >
      {/* Primary glow orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-primary/20 blur-3xl pointer-events-none" />

      {/* Subtle crescent accent */}
      <svg
        className="absolute top-4 end-8 opacity-20 pointer-events-none"
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M36 24c0 8.837-7.163 16-16 16a15.93 15.93 0 0 1-8-2.146C16.28 40.514 21.98 42 28 42c9.941 0 18-8.059 18-18S37.941 6 28 6c-6.02 0-11.72 1.486-16 4.146A15.93 15.93 0 0 1 20 8c8.837 0 16 7.163 16 16Z"
          fill="hsl(var(--primary))"
        />
      </svg>

      <div className="relative z-10 page-container py-8 md:py-10 text-center">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white leading-relaxed">
          {isRTL ? (
            <>رمضان يجمعنا… و <span className="text-primary">Diviso</span> يرتّبها بينكم</>
          ) : (
            <>{t('ramadan.headline_pre')}<span className="text-primary">Diviso</span>{t('ramadan.headline_post')}</>
          )}
        </h2>
        <p className="mt-3 text-sm md:text-base text-white/70 max-w-xl mx-auto">
          {t('ramadan.subtext')}
        </p>
      </div>
    </section>
  );
};
