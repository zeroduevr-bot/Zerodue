import React, { ReactNode, ReactElement } from 'react';

interface SectionProps {
  title: string;
  // Fix: Specify that the icon's props can include a className to satisfy React.cloneElement.
  icon?: ReactElement<{ className?: string }>;
  children: ReactNode;
}

export const Section: React.FC<SectionProps> = ({ title, icon, children }) => {
  return (
    <section className="bg-dark-card rounded-xl shadow-lg overflow-hidden border border-dark-border">
      <div className="p-6">
        <div className="flex items-center mb-4">
          {icon && <div className="mr-3 text-brand-green">{React.cloneElement(icon, { className: 'w-7 h-7' })}</div>}
          <h2 className="text-2xl font-bold text-dark-text tracking-wide">{title}</h2>
        </div>
        <div className="prose prose-invert max-w-none text-dark-subtext">
          {children}
        </div>
      </div>
    </section>
  );
};
