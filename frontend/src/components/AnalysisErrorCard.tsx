import React from 'react';
import { AlertCircle, ShieldAlert, WifiOff, Ban, Clock, RefreshCw } from 'lucide-react';

export type AnalysisError = {
  error: string;
  details?: string;
  usageCounted?: boolean;
};

export const SslWarning = () => (
  <div className="p-6 mb-8 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded-lg prose max-w-none">
    <h2 className="text-xl font-bold text-yellow-900 !my-0 !mb-2 flex items-center gap-2">
      <AlertCircle />
      Security Alert: Insecure Connection Detected
    </h2>
    <p className="!my-1">
      Our AI agent detected a security issue with your site's SSL/TLS certificate (<code>net::ERR_SSL_VERSION_OR_CIPHER_MISMATCH</code>). While we proceeded with the analysis, this is a critical issue you should address.
    </p>
    <p className="!my-1">
      An insecure connection erodes user trust and can harm your site's reputation. Helping create a safer internet is a shared responsibility.
    </p>
    <h4 className="font-bold !mt-4 !mb-1">Recommended Actions:</h4>
    <ul className="!my-0 !pl-5">
      <li>Check your SSL/TLS Certificate is valid and correctly installed.</li>
      <li>Update your server to use modern TLS versions (TLS 1.2 or 1.3).</li>
      <li>Use a free online checker like <a href="https://www.ssllabs.com/ssltest/" target="_blank" rel="noopener noreferrer" className="underline font-medium">SSL Labs</a> to diagnose the problem.</li>
    </ul>
  </div>
);

export const AnalysisErrorCard: React.FC<{ error: AnalysisError, onReset: () => void, theme?: 'light' | 'dark' }> = ({ error, onReset, theme = 'light' }) => {
  // Determine Icon and Color based on error type
  let Icon = AlertCircle;
  let iconColor = "text-red-500";
  let borderColor = "border-red-300";
  let subHeader = "Analysis Failed";

  if (error.error === 'Site Security Error') {
    Icon = ShieldAlert;
    iconColor = "text-yellow-500";
    borderColor = "border-yellow-400";
    subHeader = "Security Alert";
  } else if (error.error === 'Target Site Error') {
    Icon = AlertCircle;
    iconColor = "text-orange-500";
    borderColor = "border-orange-400";
    subHeader = "Site Error";
  } else if (error.error === 'Site Not Found' || error.error === 'Connection Refused') {
    Icon = WifiOff;
    iconColor = "text-gray-500";
    borderColor = "border-gray-400";
    subHeader = "Connection Error";
  } else if (error.error === 'Connection Timed Out') {
    Icon = Clock;
    iconColor = "text-orange-500";
    borderColor = "border-orange-400";
    subHeader = "Timeout Error";
  } else if (error.error === 'Restricted URL' || error.error === 'Access Denied') {
    Icon = Ban;
    iconColor = "text-red-600";
    borderColor = "border-red-600";
    subHeader = "Access Restricted";
  }

  const isDark = theme === 'dark';
  const cardBg = isDark ? 'bg-gray-900' : 'bg-white';
  const textColor = isDark ? 'text-gray-100' : 'text-gray-900';
  const subTextColor = isDark ? 'text-gray-400' : 'text-gray-600';
  const resetTextColor = isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900';

  return (
    <div className="max-w-3xl mx-auto mt-12 text-center animate-fade-in">
      <div className={`p-8 ${cardBg} border-2 ${borderColor} rounded-xl shadow-xl text-center ${textColor}`}>
        <div className="flex justify-center mb-4">
          <Icon className={`w-12 h-12 ${iconColor}`} />
        </div>
        <h3 className={`text-2xl font-bold ${textColor} mb-2`}>We were unable to test your site</h3>
        {error.usageCounted === false && (
          <p className={`text-sm font-semibold uppercase tracking-wide mb-4 ${iconColor.replace('text-', 'text-opacity-80 text-')}`}>
            {subHeader} — This test not counted toward your limit
          </p>
        )}
        <p className={`${subTextColor} mb-4`}>{error.details || error.error}</p>
        {error.error === 'Site Security Error' && (
          <p className={subTextColor}>We recommend using a free tool like SSL Labs to diagnose and fix it. <a href="https://www.ssllabs.com/ssltest/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 underline font-medium">You can learn more here.</a></p>
        )}
      </div>
      <button onClick={onReset} className={`mt-8 inline-flex items-center gap-2 ${resetTextColor} underline transition-colors`}>
        <RefreshCw size={16} />
        Run Another Test
      </button>
    </div>
  );
};