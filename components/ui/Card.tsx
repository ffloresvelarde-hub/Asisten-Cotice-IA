import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white p-6 sm:p-8 rounded-2xl shadow-md transition-shadow hover:shadow-lg border border-slate-200/50 ${className}`}>
      {children}
    </div>
  );
};
