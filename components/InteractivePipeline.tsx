import React, { useState, useRef } from 'react';
import { FilePdfIcon } from './IconComponents';
import { CodeBlock } from './CodeBlock';

// Tell TypeScript that pdfjsLib is available on the global scope
declare const pdfjsLib: any;

interface PreprocessingOptionsState {
  deskew: boolean;
  denoise: 'fast' | 'median' | null;
  contrast: 'clahe' | null;
  sharpen: boolean;
  threshold: 'adaptive' | null;
}

const ControlWrapper: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="flex items-center justify-between py-3 border-b border-dark-border last:border-b-0">
      <label className="text-dark-subtext text-sm font-medium">{label}</label>
      {children}
    </div>
);

export const InteractivePipeline: React.FC = () => {
  const [pageImage, setPageImage] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfDoc = useRef<any>(null);

  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageInput, setPageInput] = useState<string>('1');
  
  const [options, setOptions] = useState<PreprocessingOptionsState>({
    deskew: true,
    denoise: 'fast',
    contrast: 'clahe',
    sharpen: true,
    threshold: 'adaptive',
  });

  const generateOptionsCode = (opts: PreprocessingOptionsState) => {
    return `# This Python dictionary is generated based on your selections.
# It can be passed directly to the preprocess_image function.
custom_options = {
    'deskew': ${opts.deskew},
    'denoise': ${opts.denoise ? `'${opts.denoise}'` : 'None'},
    'contrast': ${opts.contrast ? `'${opts.contrast}'` : 'None'},
    'sharpen': ${opts.sharpen},
    'threshold': ${opts.threshold ? `'${opts.threshold}'` : 'None'},
}`;
  };

  const renderPage = async (pageNum: number) => {
    if (!pdfDoc.current || pageNum < 1 || pageNum > pdfDoc.current.numPages) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const page = await pdfDoc.current.getPage(pageNum);
      
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not get canvas context');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport: viewport }).promise;

      setPageImage(canvas.toDataURL());
      setCurrentPage(pageNum);
      setPageInput(String(pageNum));

      setOcrText(`// This is a simulation of the OCR output for page ${pageNum}.
// In the full Python pipeline, PaddleOCR would process the image 
// on the left (after applying your configured steps)
// to extract structured text and generate a CSV file.

[
  {
    "line": 1,
    "text": "Example Content from Page ${pageNum}",
    "confidence": 99.8
  },
  {
    "line": 2,
    "text": "Invoice #12345",
    "confidence": 98.5
  },
  {
    "line": 3,
    "text": "Date: 2024-07-29",
    "confidence": 99.1
  }
]`);
    } catch (e) {
      console.error(e);
      setError(`Failed to render page ${pageNum}. The PDF might be corrupted.`);
      setPageImage(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a valid PDF file.');
      setFileName(null);
      setPageImage(null);
      setOcrText(null);
      setNumPages(0);
      pdfDoc.current = null;
      return;
    }

    setIsLoading(true);
    setError(null);
    setPageImage(null);
    setOcrText(null);
    setFileName(file.name);
    setNumPages(0);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      pdfDoc.current = pdf;
      setNumPages(pdf.numPages);
      await renderPage(1);
    } catch (e) {
      console.error(e);
      setError('Failed to process the PDF. It might be corrupted or protected.');
      pdfDoc.current = null;
      setIsLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };
  
  const handlePageInputConfirm = () => {
    const newPageNum = Number(pageInput);
    if (newPageNum >= 1 && newPageNum <= numPages) {
      if (newPageNum !== currentPage) {
        renderPage(newPageNum);
      }
    } else {
      setPageInput(String(currentPage));
    }
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handlePageInputConfirm();
      e.currentTarget.blur();
    }
  };
  
  const goToPage = (pageNum: number) => {
    if (pageNum >= 1 && pageNum <= numPages) {
        renderPage(pageNum);
    }
  };

  return (
    <div className="border border-dark-border rounded-lg p-6 bg-dark-bg space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-dark-text mb-2 flex items-center"><span className="bg-brand-blue text-white rounded-full w-6 h-6 text-sm flex items-center justify-center mr-3">1</span>Configure Preprocessing Options</h3>
        <p className="text-dark-subtext text-sm mb-4">Select the image processing steps. The Python code below will update automatically.</p>
        <div className="bg-dark-card border border-dark-border rounded-lg p-4">
            <ControlWrapper label="Deskew Image">
                 <input type="checkbox" className="toggle-checkbox" checked={options.deskew} onChange={e => setOptions({...options, deskew: e.target.checked})} />
            </ControlWrapper>
            <ControlWrapper label="Denoise Method">
                <select value={options.denoise || 'none'} onChange={e => setOptions({...options, denoise: e.target.value === 'none' ? null : e.target.value as 'fast' | 'median'})} className="bg-dark-bg border border-dark-border rounded-md px-2 py-1 text-sm">
                    <option value="fast">Fast NL Means</option>
                    <option value="median">Median Blur</option>
                    <option value="none">None</option>
                </select>
            </ControlWrapper>
            <ControlWrapper label="Contrast Adjustment">
                <select value={options.contrast || 'none'} onChange={e => setOptions({...options, contrast: e.target.value === 'none' ? null : 'clahe'})} className="bg-dark-bg border border-dark-border rounded-md px-2 py-1 text-sm">
                    <option value="clahe">CLAHE</option>
                    <option value="none">None</option>
                </select>
            </ControlWrapper>
             <ControlWrapper label="Sharpen Image">
                 <input type="checkbox" className="toggle-checkbox" checked={options.sharpen} onChange={e => setOptions({...options, sharpen: e.target.checked})} />
            </ControlWrapper>
             <ControlWrapper label="Thresholding">
                <select value={options.threshold || 'none'} onChange={e => setOptions({...options, threshold: e.target.value === 'none' ? null : 'adaptive'})} className="bg-dark-bg border border-dark-border rounded-md px-2 py-1 text-sm">
                    <option value="adaptive">Adaptive</option>
                    <option value="none">None</option>
                </select>
            </ControlWrapper>
        </div>
        <div className="mt-4">
            <CodeBlock code={generateOptionsCode(options)} language="python" />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-dark-text mb-2 flex items-center"><span className="bg-brand-blue text-white rounded-full w-6 h-6 text-sm flex items-center justify-center mr-3">2</span>Upload a PDF to Process</h3>
        <input
            type="file"
            accept="application/pdf"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            aria-hidden="true"
        />
        <button
            onClick={handleUploadClick}
            disabled={isLoading && !pageImage}
            className="w-full bg-brand-green hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition duration-300 flex items-center justify-center disabled:bg-gray-500 disabled:cursor-not-allowed"
            aria-label="Upload a PDF for processing"
        >
            <FilePdfIcon className="w-5 h-5 mr-2" />
            {isLoading && !pageImage ? 'Processing...' : (fileName ? `Upload Different PDF` : 'Upload a PDF')}
        </button>
        {fileName && !isLoading && (
            <p className="text-center text-sm text-dark-subtext mt-2">
                File: <span className="font-medium text-dark-text">{fileName}</span>
            </p>
        )}
      </div>

      {error && <p role="alert" className="text-red-400 text-center mt-4">{error}</p>}

      {isLoading && !pageImage && (
        <div className="flex justify-center items-center h-40" aria-label="Loading content">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
        </div>
      )}

      {pageImage && (
        <div>
            <h3 className="text-lg font-semibold text-dark-text mb-4 flex items-center"><span className="bg-brand-blue text-white rounded-full w-6 h-6 text-sm flex items-center justify-center mr-3">3</span>View Results</h3>
            
            {numPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mb-4 p-2 bg-dark-card rounded-md border border-dark-border">
                    <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1 || isLoading} className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm">Prev</button>
                    <span className="text-sm text-dark-subtext">
                        Page
                        <input 
                            type="number"
                            value={pageInput}
                            onChange={handlePageInputChange}
                            onKeyDown={handlePageInputKeyDown}
                            onBlur={handlePageInputConfirm}
                            className="w-16 text-center bg-dark-bg border border-dark-border rounded-md mx-2"
                            min="1"
                            max={numPages}
                            disabled={isLoading}
                        />
                         of {numPages}
                    </span>
                    <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= numPages || isLoading} className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm">Next</button>
                </div>
            )}

            <div className={`mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 ${isLoading ? 'opacity-50' : ''}`}>
                <div>
                    <h4 className="text-md font-semibold text-dark-text mb-2 text-center">Page {currentPage} Image Preview</h4>
                    <div className="border border-dark-border rounded-lg p-2 bg-gray-900/50 relative">
                        <img src={pageImage} alt={`Page ${currentPage} of uploaded PDF`} className="rounded-md w-full h-auto object-contain max-h-[500px]" />
                        {isLoading && <div className="absolute inset-0 flex items-center justify-center bg-black/50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div></div>}
                    </div>
                </div>
                <div>
                    <h4 className="text-md font-semibold text-dark-text mb-2 text-center">Simulated OCR Output (Page {currentPage})</h4>
                    <div className="h-full">
                        {ocrText ? <CodeBlock code={ocrText} language="json" /> : <div className="h-full bg-dark-bg rounded-lg border border-dark-border flex items-center justify-center text-dark-subtext">No output to display.</div>}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};