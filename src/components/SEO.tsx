import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  noIndex?: boolean;
}

const defaultSEO = {
  title: 'Diviso | قسّم بذكاء، سافر براحة',
  description: 'قسّم بذكاء، سافر براحة. إدارة المصاريف المشتركة بذكاء الاصطناعي. قسّم المصاريف بين الأصدقاء والعائلة بطريقة عادلة وذكية.',
  ogImage: 'https://diviso.app/favicon.png',
  siteUrl: 'https://diviso.app',
};

export const SEO = ({
  title,
  description,
  canonical,
  ogImage,
  ogType = 'website',
  noIndex = false,
}: SEOProps) => {
  useEffect(() => {
    // Update document title
    const fullTitle = title ? `${title} | Diviso` : defaultSEO.title;
    document.title = fullTitle;

    // Update meta tags
    const metaDescription = description || defaultSEO.description;
    const metaImage = ogImage || defaultSEO.ogImage;
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

    // Update standard meta tags
    updateMetaTag('meta[name="description"]', metaDescription);

    // Update Open Graph tags
    updateMetaTag('meta[property="og:title"]', fullTitle);
    updateMetaTag('meta[property="og:description"]', metaDescription);
    updateMetaTag('meta[property="og:image"]', metaImage);
    updateMetaTag('meta[property="og:type"]', ogType);
    updateMetaTag('meta[property="og:url"]', canonicalUrl);

    // Update Twitter tags
    updateMetaTag('meta[name="twitter:title"]', fullTitle);
    updateMetaTag('meta[name="twitter:description"]', metaDescription);
    updateMetaTag('meta[name="twitter:image"]', metaImage);

    // Update canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (canonicalLink) {
      canonicalLink.href = canonicalUrl;
    } else {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      canonicalLink.href = canonicalUrl;
      document.head.appendChild(canonicalLink);
    }

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
  }, [title, description, canonical, ogImage, ogType, noIndex]);

  return null;
};

export default SEO;
