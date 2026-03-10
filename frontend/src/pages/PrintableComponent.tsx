import React, { ReactNode } from 'react';

interface PrintableComponentProps {
  children: ReactNode;
}

const PrintableComponent: React.FC<PrintableComponentProps> = ({ children }) => {
  return (
    <div className="printable">
      {children}
      <style jsx>{`
        @media print {
          .printable * {
            visibility: visible;
          }
          .no-print {
            display: none !important;
          }
          body {
            font-size: 12pt;
            line-height: 1.5;
          }
        }
      `}</style>
    </div>
  );
};

export default PrintableComponent;