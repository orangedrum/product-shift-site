import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// TODO: Replace 'G-XXXXXXXXXX' with your actual Measurement ID from Google Analytics
const GA_MEASUREMENT_ID = 'G-4EWRG56796'; 

export const GoogleAnalytics: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    if (GA_MEASUREMENT_ID === 'G-XXXXXXXXXX') {
      return;
    }

    const scriptId = 'ga-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
      document.head.appendChild(script);

      // Standard Google Analytics Initialization (The "Old School" Way)
      // We use the exact pattern Google recommends to ensure compatibility.
      const win = window as any;
      win.dataLayer = win.dataLayer || [];
      
      // Define gtag if it doesn't exist
      if (!win.gtag) {
        win.gtag = function() {
          win.dataLayer.push(arguments);
        };
      }

      win.gtag('js', new Date());
      
      // Enable debug_mode to force data into GA DebugView (helps with testing)
      win.gtag('config', GA_MEASUREMENT_ID, {
        debug_mode: true
      });
    }
  }, []);

  // Automatically track page views on route change
  useEffect(() => {
    if ((window as any).gtag && GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
      (window as any).gtag('event', 'page_view', {
        page_path: location.pathname + location.search,
        page_title: document.title
      });
    }
  }, [location]);

  return null;
};