import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLandingPageBySlug } from '@/content/landing-pages/landingPagesData';
import LandingPageTemplate from '@/components/landing/LandingPageTemplate';

const LandingPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { isRTL } = useLanguage();

  // Get landing page data by slug
  const pageData = slug ? getLandingPageBySlug(slug) : undefined;

  // If no data found, redirect to home
  if (!pageData) {
    return <Navigate to="/" replace />;
  }

  return <LandingPageTemplate data={pageData} isRTL={isRTL} />;
};

export default LandingPage;
