import React, { ReactNode } from 'react';

interface PrintableComponentProps {
  children: ReactNode;
}

const PrintableComponent: React.FC<PrintableComponentProps> = ({ children }) => {
  return (
    <div className="printable">
      {children}
      <style jsx global>{`
        @media print {
          @page { 
            margin: 1.5cm; 
            size: auto; 
          }
          
          /* Hide everything by default */
          body * { 
            visibility: hidden; 
          }
          
          /* Make only the printable area and its children visible */
          .printable, .printable * {
            visibility: visible; 
            opacity: 1 !important; /* CTO FIX: Ensure full opacity */
            filter: none !important; /* CTO FIX: Remove any blur/translucency */
          }
          
          /* Position the printable area to take up the whole page */
          .printable { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            background: white;
          }

          /* General Print Styles */
          .no-print { display: none !important; }
          .screen-only { display: none !important; }
          .print-only { display: block !important; }
          body { font-size: 10pt; line-height: 1.4; color: #000; background: white !important; }
          h1 { font-size: 28pt; }
          h2 { font-size: 18pt; margin-top: 1cm; margin-bottom: 0.5cm; page-break-after: avoid; border-bottom: 2px solid #000; padding-bottom: 8px; }
          h2.no-border { border-bottom: none !important; }
          h3 { font-size: 12pt; margin-top: 0.5cm; page-break-after: avoid; }
          .page-break-before { page-break-before: always !important; }

          /* CTO FIX: Shrink performance report to fit on one page */
          #performance-report-wrapper {
            transform: scale(0.95);
            transform-origin: top;
            page-break-after: always;
          }

          /* CTO FIX: Condense spacing between persona sessions */
          .user-session-print-item {
            margin-bottom: 0.5cm !important;
            padding-bottom: 0.5cm !important;
            border-bottom: 1px solid #eee !important;
            page-break-inside: avoid;
          }
          .user-session-print-item:last-child {
            border-bottom: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PrintableComponent;