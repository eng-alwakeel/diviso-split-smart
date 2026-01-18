import { useEffect } from 'react';

interface ArticleMetadata {
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  noIndex?: boolean;
  keywords?: string;
  lang?: 'ar' | 'en';
  article?: ArticleMetadata;
  breadcrumbs?: BreadcrumbItem[];
}

const defaultSEO = {
  title: 'Diviso | قسّم بذكاء، سافر براحة',
  description: 'Diviso - تطبيق تقسيم المصاريف الأول في السعودية. قسّم فواتير السفر والمطاعم بين الأصدقاء والعائلة بذكاء. بديل Splitwise العربي.',
  ogImage: 'https://diviso.app/og-image.png',
  siteUrl: 'https://diviso.app',
  keywords: 'تقسيم مصاريف, إدارة نفقات, مصاريف مشتركة, حساب مصاريف, تطبيق تقسيم الفاتورة, تسوية الديون, إدارة ميزانية, مصاريف السفر, مصاريف الرحلات, تطبيق مصاريف سعودي, تطبيق مالي عربي, تتبع النفقات, مصاريف المجموعات, تقسيم فاتورة المطعم, حساب الديون, expense splitting, split bills, travel expenses, expense tracker, bill splitting app, group expense manager, shared expenses, travel budget app, splitwise alternative, money management, budget tracker, Saudi finance app',
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
  article,
  breadcrumbs,
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
    updateMetaTag('meta[name="twitter:card"]', 'summary_large_image');
    updateMetaTag('meta[name="twitter:site"]', '@diviso_app');
    updateMetaTag('meta[name="twitter:title"]', fullTitle);
    updateMetaTag('meta[name="twitter:description"]', metaDescription);
    updateMetaTag('meta[name="twitter:image"]', metaImage);
    
    // Update theme-color
    updateMetaTag('meta[name="theme-color"]', '#1A1C1E');
    
    // Update og:image:alt
    updateMetaTag('meta[property="og:image:alt"]', fullTitle);

    // Update canonical link - clean URL without unnecessary query params
    const cleanCanonicalUrl = canonicalUrl.split('?')[0];
    updateLinkTag('canonical', cleanCanonicalUrl);

    // Update author meta tag
    updateMetaTag('meta[name="author"]', 'Diviso');

    // Update hreflang tags dynamically based on current path
    const baseUrl = defaultSEO.siteUrl;
    const currentPath = window.location.pathname === '/' ? '' : window.location.pathname;
    updateLinkTag('alternate', `${baseUrl}${currentPath}`, 'ar');
    updateLinkTag('alternate', `${baseUrl}${currentPath}?lang=en`, 'en');
    updateLinkTag('alternate', `${baseUrl}${currentPath}`, 'x-default');

    // Handle article metadata for blog posts
    if (ogType === 'article' && article) {
      if (article.publishedTime) {
        updateMetaTag('meta[property="article:published_time"]', article.publishedTime);
      }
      if (article.modifiedTime) {
        updateMetaTag('meta[property="article:modified_time"]', article.modifiedTime);
      }
      if (article.author) {
        updateMetaTag('meta[property="article:author"]', article.author);
      }
      if (article.section) {
        updateMetaTag('meta[property="article:section"]', article.section);
      }
      if (article.tags) {
        article.tags.forEach((tag, index) => {
          updateMetaTag(`meta[property="article:tag"][data-index="${index}"]`, tag);
        });
      }
    }

    // Add dynamic breadcrumb structured data
    if (breadcrumbs && breadcrumbs.length > 0) {
      const existingBreadcrumbScript = document.querySelector('script[data-seo-breadcrumbs]');
      if (existingBreadcrumbScript) {
        existingBreadcrumbScript.remove();
      }

      const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbs.map((item, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "name": item.name,
          "item": item.url
        }))
      };

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-breadcrumbs', 'true');
      script.textContent = JSON.stringify(breadcrumbSchema);
      document.head.appendChild(script);
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
      // Remove dynamic breadcrumb schema
      const breadcrumbScript = document.querySelector('script[data-seo-breadcrumbs]');
      if (breadcrumbScript) breadcrumbScript.remove();
    };
  }, [title, description, canonical, ogImage, ogType, noIndex, keywords, lang, article, breadcrumbs]);

  return null;
};

export default SEO;
