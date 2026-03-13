import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { getSEOPageByRoute } from '@/content/seo-pages/seoLandingPagesData';
import SEOLandingPage from '@/components/seo/SEOLandingPage';

const SEOLandingPageRoute: React.FC = () => {
  const { pathname } = useLocation();
  const pageData = getSEOPageByRoute(pathname);

  if (!pageData) {
    return <Navigate to="/" replace />;
  }

  return <SEOLandingPage data={pageData} />;
};

export default SEOLandingPageRoute;
