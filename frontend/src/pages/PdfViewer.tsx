import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

// Set up worker to avoid issues with create-react-app and others
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  file: string;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ file }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  function changePage(offset: number) {
    setPageNumber(prevPageNumber => prevPageNumber + offset);
  }

  return (
    <div className="w-full bg-black rounded-2xl shadow-2xl overflow-hidden border-4 border-black relative">
      <Document
        file={file}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={<div className="flex justify-center items-center h-[775px] text-white"><Loader2 className="animate-spin mr-2" /> Loading PDF...</div>}
        error={<div className="flex justify-center items-center h-96 text-red-500">Failed to load PDF file.</div>}
      >
        <Page pageNumber={pageNumber} width={600} />
      </Document>
      {numPages && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full flex items-center gap-4 backdrop-blur-sm">
          <button onClick={() => changePage(-1)} disabled={pageNumber <= 1} className="disabled:opacity-50"><ChevronLeft size={20} /></button>
          <p className="text-sm font-bold">Page {pageNumber} of {numPages}</p>
          <button onClick={() => changePage(1)} disabled={pageNumber >= numPages} className="disabled:opacity-50"><ChevronRight size={20} /></button>
        </div>
      )}
    </div>
  );
};

export default PdfViewer;