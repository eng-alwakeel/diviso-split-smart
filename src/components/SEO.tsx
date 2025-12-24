import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  noIndex?: boolean;
  keywords?: string;
  lang?: 'ar' | 'en';
}

const defaultSEO = {
  title: 'Diviso | قسّم بذكاء، سافر براحة',
  description: 'Diviso - تطبيق تقسيم المصاريف الأول في السعودية. قسّم فواتير السفر والمطاعم بين الأصدقاء والعائلة بذكاء. بديل Splitwise العربي.',
  ogImage: 'https://diviso.app/favicon.png',
  siteUrl: 'https://diviso.app',
  keywords: 'تقسيم مصاريف, إدارة نفقات, مصاريف مشتركة, expense splitting, split bills, travel expenses',
};

export const SEO = ({
  title,
  description,
  canonical,
  ogImage,
  ogType = 'website',
  noIndex = false,
  keywords,
  lang = 'ar',
}: SEOProps) => {
  useEffect(() => {
    // Update document title
    const fullTitle = title ? `${title} | Diviso` : defaultSEO.title;
    document.title = fullTitle;

    // Update meta tags
    const metaDescription = description || defaultSEO.description;
    const metaImage = ogImage || defaultSEO.ogImage;
    const metaKeywords = keywords || defaultSEO.keywords;
    const canonicalUrl = canonical || window.location.href;

    // Helper function to update or create meta tags
    const updateMetaTag = (selector: string, content: string, attribute = 'content') => {
      let element = document.querySelector(selector) as HTMLMetaElement | null;
      if (element) {
        element.setAttribute(attribute, content);
      } else {
        element = document.createElement('meta');
        const [attr, value] = selector.replace(/[\[\]"']/g, '').split('=');
        if (attr === 'name' || attr === 'property') {
          element.setAttribute(attr, value);
        }
        element.setAttribute(attribute, content);
        document.head.appendChild(element);
      }
    };

    // Helper function to update or create link tags
    const updateLinkTag = (rel: string, href: string, hreflang?: string) => {
      const selector = hreflang 
        ? `link[rel="${rel}"][hreflang="${hreflang}"]`
        : `link[rel="${rel}"]`;
      let element = document.querySelector(selector) as HTMLLinkElement | null;
      if (element) {
        element.href = href;
      } else {
        element = document.createElement('link');
        element.rel = rel;
        element.href = href;
        if (hreflang) element.hreflang = hreflang;
        document.head.appendChild(element);
      }
    };

    // Update standard meta tags
    updateMetaTag('meta[name="description"]', metaDescription);
    updateMetaTag('meta[name="keywords"]', metaKeywords);

    // Update Open Graph tags
    updateMetaTag('meta[property="og:title"]', fullTitle);
    updateMetaTag('meta[property="og:description"]', metaDescription);
    updateMetaTag('meta[property="og:image"]', metaImage);
    updateMetaTag('meta[property="og:type"]', ogType);
    updateMetaTag('meta[property="og:url"]', canonicalUrl);
    updateMetaTag('meta[property="og:locale"]', lang === 'ar' ? 'ar_SA' : 'en_US');

    // Update Twitter tags
    updateMetaTag('meta[name="twitter:title"]', fullTitle);
    updateMetaTag('meta[name="twitter:description"]', metaDescription);
    updateMetaTag('meta[name="twitter:image"]', metaImage);

    // Update canonical link
    updateLinkTag('canonical', canonicalUrl);

    // Update hreflang tags
    const baseUrl = defaultSEO.siteUrl;
    updateLinkTag('alternate', baseUrl, 'ar');
    updateLinkTag('alternate', `${baseUrl}?lang=en`, 'en');
    updateLinkTag('alternate', baseUrl, 'x-default');

    // Handle noIndex
    let robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (noIndex) {
      if (!robotsMeta) {
        robotsMeta = document.createElement('meta');
        robotsMeta.name = 'robots';
        document.head.appendChild(robotsMeta);
      }
      robotsMeta.content = 'noindex, nofollow';
    } else if (robotsMeta) {
      robotsMeta.remove();
    }

    // Cleanup function
    return () => {
      // Reset to defaults when component unmounts
      document.title = defaultSEO.title;
    };
  }, [title, description, canonical, ogImage, ogType, noIndex, keywords, lang]);

  return null;
};

export default SEO;
