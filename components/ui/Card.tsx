import React from 'react';

export const Card = ({ children, className = '' }) => {
  return (
    <div className={`bg-white p-6 sm:p-8 rounded-2xl shadow-md transition-shadow hover:shadow-lg border border-slate-200/50 ${className}`}>
      {children}
    </div>
  );
};