// Real-world analytics and marketing integrations
// This file demonstrates how to integrate actual third-party services with cookie consent

import { CookieManager } from '../hooks/useCookieConsent';

/**
 * Google Analytics 4 Integration
 */
export const GoogleAnalytics = {
  measurementId: 'GA_MEASUREMENT_ID', // Replace with your actual measurement ID
  
  init: () => {
    const settings = localStorage.getItem('cookie-settings');
    const cookieSettings = settings ? JSON.parse(settings) : null;
    
    if (!cookieSettings?.analytics) {
      console.log('📊 Google Analytics disabled by user preference');
      return;
    }

    // Load Google Analytics script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GoogleAnalytics.measurementId}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer.push(args);
    }
    
    gtag('js', new Date());
    gtag('config', GoogleAnalytics.measurementId, {
      anonymize_ip: true,
      cookie_expires: 7776000, // 90 days
      cookie_update: true,
      cookie_flags: 'SameSite=Strict;Secure'
    });

    console.log('📊 Google Analytics initialized');
  },

  trackEvent: (eventName: string, parameters?: Record<string, any>) => {
    const settings = localStorage.getItem('cookie-settings');
    const cookieSettings = settings ? JSON.parse(settings) : null;
    
    if (!cookieSettings?.analytics) {
      console.log('📊 Event not tracked (analytics disabled):', eventName);
      return;
    }

    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, parameters);
      console.log('📊 Event tracked:', eventName, parameters);
    }
  },

  trackPageView: (pagePath: string) => {
    const settings = localStorage.getItem('cookie-settings');
    const cookieSettings = settings ? JSON.parse(settings) : null;
    
    if (!cookieSettings?.analytics) {
      return;
    }

    if (typeof window.gtag === 'function') {
      window.gtag('config', GoogleAnalytics.measurementId, {
        page_path: pagePath
      });
      console.log('📊 Page view tracked:', pagePath);
    }
  }
};

/**
 * Facebook Pixel Integration
 */
export const FacebookPixel = {
  pixelId: 'YOUR_PIXEL_ID', // Replace with your actual pixel ID
  
  init: () => {
    const settings = localStorage.getItem('cookie-settings');
    const cookieSettings = settings ? JSON.parse(settings) : null;
    
    if (!cookieSettings?.marketing) {
      console.log('📢 Facebook Pixel disabled by user preference');
      return;
    }

    // Load Facebook Pixel script
    const fbScript = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${FacebookPixel.pixelId}');
      fbq('track', 'PageView');
    `;

    const script = document.createElement('script');
    script.innerHTML = fbScript;
    document.head.appendChild(script);

    console.log('📢 Facebook Pixel initialized');
  },

  trackEvent: (eventName: string, parameters?: Record<string, any>) => {
    const settings = localStorage.getItem('cookie-settings');
    const cookieSettings = settings ? JSON.parse(settings) : null;
    
    if (!cookieSettings?.marketing) {
      console.log('📢 Event not tracked (marketing disabled):', eventName);
      return;
    }

    if (typeof window.fbq === 'function') {
      window.fbq('track', eventName, parameters);
      console.log('📢 FB Event tracked:', eventName, parameters);
    }
  }
};

/**
 * Hotjar Integration
 */
export const Hotjar = {
  siteId: 'YOUR_HOTJAR_ID', // Replace with your actual Hotjar site ID
  
  init: () => {
    const settings = localStorage.getItem('cookie-settings');
    const cookieSettings = settings ? JSON.parse(settings) : null;
    
    if (!cookieSettings?.analytics) {
      console.log('📊 Hotjar disabled by user preference');
      return;
    }

    const hjScript = `
      (function(h,o,t,j,a,r){
        h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
        h._hjSettings={hjid:${Hotjar.siteId},hjsv:6};
        a=o.getElementsByTagName('head')[0];
        r=o.createElement('script');r.async=1;
        r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
        a.appendChild(r);
      })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
    `;

    const script = document.createElement('script');
    script.innerHTML = hjScript;
    document.head.appendChild(script);

    console.log('📊 Hotjar initialized');
  }
};

/**
 * Cookie Consent Manager - Integration with third-party services
 */
export const ThirdPartyIntegrations = {
  initialize: () => {
    // Initialize all services based on user consent
    GoogleAnalytics.init();
    FacebookPixel.init();
    Hotjar.init();
  },

  updateConsent: (newSettings: any) => {
    // Called when user changes cookie preferences
    console.log('🔄 Updating third-party integrations based on new consent:', newSettings);
    
    // Clear existing integrations if disabled
    if (!newSettings.analytics) {
      ThirdPartyIntegrations.clearAnalyticsCookies();
    }
    
    if (!newSettings.marketing) {
      ThirdPartyIntegrations.clearMarketingCookies();
    }
    
    // Reinitialize with new settings
    ThirdPartyIntegrations.initialize();
  },

  clearAnalyticsCookies: () => {
    // Clear Google Analytics cookies
    const gaCookies = ['_ga', '_ga_', '_gid', '_gat'];
    gaCookies.forEach(cookie => {
      CookieManager.deleteCookie(cookie);
      // Also clear domain variants
      CookieManager.deleteCookie(`${cookie}_${GoogleAnalytics.measurementId}`);
    });
    
    // Clear Hotjar cookies
    const hjCookies = ['_hjid', '_hjFirstSeen', '_hjUserAttributesHash', '_hjCachedUserAttributes'];
    hjCookies.forEach(cookie => {
      CookieManager.deleteCookie(cookie);
    });
    
    console.log('🧹 Analytics cookies cleared');
  },

  clearMarketingCookies: () => {
    // Clear Facebook Pixel cookies
    const fbCookies = ['_fbp', '_fbc', 'fr'];
    fbCookies.forEach(cookie => {
      CookieManager.deleteCookie(cookie);
    });
    
    console.log('🧹 Marketing cookies cleared');
  }
};

// Global declarations for TypeScript
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
    fbq: (...args: any[]) => void;
    hj: (...args: any[]) => void;
  }
}

export default ThirdPartyIntegrations;
