import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";

const NotFound = () => {
  const location = useLocation();
  const { t } = useTranslation('common');
  const { trackEvent } = useGoogleAnalytics();

  useEffect(() => {
    // Track 404 error in GA4
    trackEvent('page_not_found', { 
      attempted_path: location.pathname,
      referrer: document.referrer 
    });
    
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname, trackEvent]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <SEO title={t('not_found.title')} noIndex={true} />
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">{t('not_found.title')}</h1>
        <p className="text-xl text-muted-foreground mb-4">{t('not_found.message')}</p>
        <Link to="/" className="text-primary hover:text-primary/80 underline">
          {t('not_found.return_home')}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
