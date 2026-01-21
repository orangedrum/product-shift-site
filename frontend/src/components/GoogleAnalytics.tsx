import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// TODO: Replace 'G-XXXXXXXXXX' with your actual Measurement ID from Google Analytics
const GA_MEASUREMENT_ID = 'G-4EWRG56796'; 

export const GoogleAnalytics: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // If the ID isn't set, don't try to load GA
    if (GA_MEASUREMENT_ID === 'G-XXXXXXXXXX') {
      console.warn('Google Analytics: Measurement ID is missing. Please update src/components/GoogleAnalytics.tsx');
      return;
    }

    // 1. Initialize window.dataLayer and window.gtag immediately
    // This ensures the function exists even before the script loads or if the script check fails.
    const win = window as any;
    win.dataLayer = win.dataLayer || [];
    if (!win.gtag) {
      win.gtag = function(...args: any[]) {
        win.dataLayer.push(args);
      };
    }

    // 2. Inject the GA script if it doesn't exist
    const scriptId = 'ga-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
      document.head.appendChild(script);

      // 3. Initial Config
      win.gtag('js', new Date());
      win.gtag('config', GA_MEASUREMENT_ID);
      console.log(`[GA] Initialized with ID: ${GA_MEASUREMENT_ID}`);
    }
  }, []);

  // Automatically track page views on route change
  useEffect(() => {
    const win = window as any;
    if (win.gtag && GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
      win.gtag('config', GA_MEASUREMENT_ID, {
        page_path: location.pathname + location.search,
      });
      console.log(`[GA] Page View Sent: ${location.pathname}`);
    }
  }, [location]);

  return null;
};