import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// TODO: Replace 'G-XXXXXXXXXX' with your actual Measurement ID from Google Analytics
const GA_MEASUREMENT_ID = 'G-4EWRG56796'; 

export const GoogleAnalytics: React.FC = () => {
  const location = useLocation();

  // DEBUG: Log immediately on render to confirm component is active
  console.log('[GA] Component Rendered');

  useEffect(() => {
    // If the ID isn't set, don't try to load GA
    if (GA_MEASUREMENT_ID === 'G-XXXXXXXXXX') {
      console.warn('[GA] Measurement ID is missing.');
      return;
    }

    const win = window as any;
    win.dataLayer = win.dataLayer || [];
    
    // Standard Google Analytics initialization function
    if (!win.gtag) {
      console.log('[GA] Initializing gtag shim');
      win.gtag = function(...args: any[]) {
        // Log every event pushed to dataLayer for debugging
        console.log('[GA] Pushing to dataLayer:', args);
        win.dataLayer.push(args);
      };
    }

    // Inject the GA script if it doesn't exist
    const scriptId = 'ga-script';
    if (!document.getElementById(scriptId)) {
      console.log('[GA] Injecting script tag...');
      const script = document.createElement('script');
      script.id = scriptId;
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
      
      // Add error handling to help debug
      script.onload = () => console.log('[GA] Script loaded successfully from Google');
      script.onerror = () => {
        console.error(`[GA] Script failed to load. Check your ad blocker or network settings.`);
      };

      document.head.appendChild(script);

      // Initial Config - Disable auto page view to prevent double counting on hydration
      win.gtag('js', new Date());
      win.gtag('config', GA_MEASUREMENT_ID, {
        send_page_view: false
      });
      
      console.log(`[GA] Config command sent for ID: ${GA_MEASUREMENT_ID}`);
    } else {
      console.log('[GA] Script tag already exists. Skipping injection.');
    }
  }, []);

  // Automatically track page views on route change
  useEffect(() => {
    const win = window as any;
    if (win.gtag && GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
      console.log(`[GA] Sending page_view for: ${location.pathname}`);
      // Use the 'event' command for page_view in GA4 (Best practice for SPAs)
      win.gtag('event', 'page_view', {
        page_path: location.pathname + location.search,
        page_location: window.location.href,
        page_title: document.title
      });
    }
  }, [location]);

  return null;
};