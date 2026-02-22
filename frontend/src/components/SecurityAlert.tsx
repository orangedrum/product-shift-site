import React from 'react';
import { ShieldAlert, CheckCircle, ExternalLink } from 'lucide-react';

interface SecurityAlertProps {
  isBlocking?: boolean;
  onReset?: () => void;
}

export const SecurityAlert: React.FC<SecurityAlertProps> = ({ isBlocking = false, onReset }) => (
  <div className="max-w-2xl mx-auto mt-8 bg-white border border-gray-200 rounded-xl shadow-lg p-8 animate-fade-in">
    <div className="flex flex-col items-center text-center gap-6">
      <div className="p-4 bg-orange-50 rounded-full">
        <ShieldAlert className="text-orange-500" size={48} />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-gray-900">Security Connection Issue</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Our AI agent detected a potential issue with this site's SSL/TLS certificate (net::ERR_SSL_VERSION_OR_CIPHER_MISMATCH).
        </p>
      </div>

      <div className="w-full bg-gray-50 rounded-lg border border-gray-100 p-5 text-left">
        <h4 className="font-semibold text-gray-900 text-sm mb-3 uppercase tracking-wider">How to fix this</h4>
        <ul className="space-y-3 text-sm text-gray-600">
          <li className="flex gap-3">
            <CheckCircle className="text-green-500 shrink-0" size={18} />
            <span>Check if your SSL certificate is valid and not expired.</span>
          </li>
          <li className="flex gap-3">
            <CheckCircle className="text-green-500 shrink-0" size={18} />
            <span>Ensure your server supports TLS 1.2 or higher.</span>
          </li>
          <li className="flex gap-3">
            <ExternalLink className="text-indigo-500 shrink-0" size={18} />
            <span>
              Diagnose with 
              <a href="https://www.ssllabs.com/ssltest/" target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-800 font-medium ml-1 underline">
                SSL Labs Server Test
              </a>
            </span>
          </li>
        </ul>
      </div>

      {isBlocking && onReset && (
        <button 
          onClick={onReset}
          className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          Try Another URL
        </button>
      )}
    </div>
  </div>
);