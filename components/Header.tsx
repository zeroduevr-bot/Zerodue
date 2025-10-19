
import React from 'react';
import { PythonIcon } from './IconComponents';

export const Header: React.FC = () => {
  return (
    <header className="bg-dark-card border-b-2 border-brand-blue shadow-lg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-4xl">
        <div className="flex items-center space-x-4">
          <PythonIcon className="w-12 h-12 text-brand-blue" />
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-dark-text tracking-tight">
              Offline PDF-to-CSV OCR Pipeline
            </h1>
            <p className="mt-1 text-lg text-dark-subtext">
              A Senior Engineer's Guide to Building a High-Accuracy, Local-First Solution.
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
