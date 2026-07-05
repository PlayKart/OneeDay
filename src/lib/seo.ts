import { useEffect } from "react";

export interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  ogType?: string;
  ogImage?: string;
}

export function updateSEO({
  title,
  description,
  keywords = "habit tracker, ai habit tracker, streak app, discipline app, productivity app, self improvement, habit gamification, consistency, routines, health, education",
  canonical = "https://onee-day.vercel.app/",
  ogType = "website",
  ogImage = "https://onee-day.vercel.app/og-image.png"
}: SEOProps) {
  // Update browser document title
  document.title = title;

  // Helper to find or create a meta tag
  const updateMeta = (nameOrProperty: string, content: string, isProperty = false) => {
    const selector = isProperty 
      ? `meta[property="${nameOrProperty}"]` 
      : `meta[name="${nameOrProperty}"]`;
    
    let element = document.querySelector(selector);
    if (!element) {
      element = document.createElement("meta");
      if (isProperty) {
        element.setAttribute("property", nameOrProperty);
      } else {
        element.setAttribute("name", nameOrProperty);
      }
      document.head.appendChild(element);
    }
    element.setAttribute("content", content);
  };

  // Primary Meta Tags
  updateMeta("title", title);
  updateMeta("description", description);
  updateMeta("keywords", keywords);
  updateMeta("robots", "index, follow");

  // Open Graph / Facebook
  updateMeta("og:title", title, true);
  updateMeta("og:description", description, true);
  updateMeta("og:url", canonical, true);
  updateMeta("og:type", ogType, true);
  updateMeta("og:image", ogImage, true);

  // Twitter Cards
  updateMeta("twitter:card", "summary_large_image", true);
  updateMeta("twitter:title", title, true);
  updateMeta("twitter:description", description, true);
  updateMeta("twitter:url", canonical, true);
  updateMeta("twitter:image", ogImage, true);

  // Canonical Link
  let canonicalLink = document.querySelector('link[rel="canonical"]');
  if (!canonicalLink) {
    canonicalLink = document.createElement("link");
    canonicalLink.setAttribute("rel", "canonical");
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.setAttribute("href", canonical);
}

export function useSEO(props: SEOProps) {
  useEffect(() => {
    updateSEO(props);
  }, [props.title, props.description, props.keywords, props.canonical, props.ogType, props.ogImage]);
}
