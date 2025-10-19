import React, { useState } from 'react';

interface CodeBlockProps {
  code: string;
  language: 'python' | 'bash' | 'json' | 'javascript';
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const getLanguageLabel = () => {
    switch (language) {
      case 'python': return 'Python';
      case 'bash': return 'Bash';
      case 'json': return 'JSON';
      case 'javascript': return 'JavaScript';
      default: return 'Code';
    }
  };

  return (
    <div className="bg-dark-bg rounded-lg my-4 overflow-hidden border border-dark-border">
      <div className="flex justify-between items-center px-4 py-2 bg-gray-900/50">
        <span className="text-xs font-semibold text-gray-400 uppercase">{getLanguageLabel()}</span>
        <button
          onClick={handleCopy}
          className="text-xs text-gray-400 hover:text-white transition-colors focus:outline-none"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 text-sm overflow-x-auto">
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  );
};