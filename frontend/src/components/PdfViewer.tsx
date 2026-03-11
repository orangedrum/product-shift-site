import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

// CTO Fix: Reverting to a stable CDN for the PDF worker to resolve all build-time issues and respect the
// "no local node_modules" constraint. This is the most robust method. The version is dynamically
// pinned to match the `pdfjs-dist` dependency of our `react-pdf` installation.
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
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
    <div className="w-full bg-black rounded-2xl shadow-2xl overflow-hidden border-4 border-black relative min-h-[500px] flex flex-col">
      <div className="flex-grow bg-gray-100 flex items-center justify-center p-4">
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={console.error} // Diagnostic Test: Log any PDF loading errors to the console.
          loading={<div className="flex justify-center items-center h-96 text-black font-bold"><Loader2 className="animate-spin mr-2" /> Loading PDF...</div>}
          error={<div className="flex justify-center items-center h-96 text-red-600 font-bold">Unable to load PDF.</div>}
        >
          <Page pageNumber={pageNumber} renderTextLayer={false} renderAnnotationLayer={false} className="shadow-lg" width={500} />
        </Document>
      </div>
      {numPages && (
        <div className="bg-black text-white p-4 flex items-center justify-center gap-6">
          <button onClick={() => changePage(-1)} disabled={pageNumber <= 1} className="p-2 hover:bg-gray-800 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronLeft size={24} /></button>
          <span className="text-sm font-bold tracking-widest uppercase">Page {pageNumber} of {numPages}</span>
          <button onClick={() => changePage(1)} disabled={pageNumber >= numPages} className="p-2 hover:bg-gray-800 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronRight size={24} /></button>
        </div>
      )}
    </div>
  );
};

export default PdfViewer;