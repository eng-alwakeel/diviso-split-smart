import React from 'react';
import { LandingPageData } from '@/content/landing-pages/landingPagesData';
import LandingHero from './LandingHero';
import LandingProblem from './LandingProblem';
import LandingSolution from './LandingSolution';
import LandingExample from './LandingExample';
import LandingCTA from './LandingCTA';

interface LandingPageTemplateProps {
  data: LandingPageData;
  isRTL: boolean;
}

const LandingPageTemplate: React.FC<LandingPageTemplateProps> = ({ data, isRTL }) => {
  // Get localized content based on language
  const heroTitle = isRTL ? data.heroTitle : data.heroTitleEn;
  const problemTitle = isRTL ? data.problemTitle : data.problemTitleEn;
  const problemDescription = isRTL ? data.problemDescription : data.problemDescriptionEn;
  const solutionTitle = isRTL ? data.solutionTitle : data.solutionTitleEn;
  const solutionPoints = isRTL ? data.solutionPoints : data.solutionPointsEn;
  const exampleBefore = isRTL ? data.exampleBefore : data.exampleBeforeEn;
  const exampleAfter = isRTL ? data.exampleAfter : data.exampleAfterEn;
  const ctaText = isRTL ? data.ctaText : data.ctaTextEn;
  const ctaSubtext = isRTL ? data.ctaSubtext : data.ctaSubtextEn;

  return (
    <div 
      className="min-h-screen bg-background"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <LandingHero 
        title={heroTitle}
        ctaText={ctaText}
        isRTL={isRTL}
      />
      
      <LandingProblem 
        title={problemTitle}
        description={problemDescription}
        isRTL={isRTL}
      />
      
      <LandingSolution 
        title={solutionTitle}
        points={solutionPoints}
        isRTL={isRTL}
      />
      
      <LandingExample 
        before={exampleBefore}
        after={exampleAfter}
        isRTL={isRTL}
      />
      
      <LandingCTA 
        ctaText={ctaText}
        subtext={ctaSubtext}
        isRTL={isRTL}
      />
    </div>
  );
};

export default LandingPageTemplate;
