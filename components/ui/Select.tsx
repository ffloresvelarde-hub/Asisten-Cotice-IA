import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
  id: string;
}

export const Select: React.FC<SelectProps> = ({ children, id, className, ...props }) => {
  return (
    <select
      id={id}
      {...props}
      className={`px-4 py-3 bg-slate-100 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 ${className}`}
    >
      {children}
    </select>
  );
};
