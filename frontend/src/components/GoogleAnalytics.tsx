import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// TODO: Replace 'G-XXXXXXXXXX' with your actual Measurement ID from Google Analytics
const GA_MEASUREMENT_ID = 'G-4EWRG56796'; 

export const GoogleAnalytics: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // If the ID isn't set, don't try to load GA
    if (GA_MEASUREMENT_ID === 'G-4EWRG56796') {
      console.warn('Google Analytics: Measurement ID is missing. Please update src/components/GoogleAnalytics.tsx');
      return;
    }

    // Inject the GA script if it doesn't exist
    const scriptId = 'ga-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
      document.head.appendChild(script);

      // Initialize window.dataLayer
      const win = window as any;
      win.dataLayer = win.dataLayer || [];
      win.gtag = function(...args: any[]) {
        win.dataLayer.push(args);
      };
      
      win.gtag('js', new Date());
      win.gtag('config', GA_MEASUREMENT_ID);
    }
  }, []);

  // Automatically track page views on route change
  useEffect(() => {
    const win = window as any;
    if (win.gtag && GA_MEASUREMENT_ID !== 'G-4EWRG56796') {
      win.gtag('config', GA_MEASUREMENT_ID, {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);

  return null;
};