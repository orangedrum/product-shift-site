import React from 'react';

interface PdfViewerProps {
  file: string;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ file }) => {
  return (
    <div className="w-full bg-black rounded-2xl shadow-2xl overflow-hidden border-4 border-black relative aspect-[8.5/11] h-[775px]">
      <iframe
        src={`${file}#toolbar=0&navpanes=0`}
        title="PDF Viewer"
        className="w-full h-full border-0"
      />
    </div>
  );
};

export default PdfViewer;