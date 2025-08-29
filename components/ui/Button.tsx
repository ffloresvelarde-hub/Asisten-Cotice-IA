import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
  size?: 'normal' | 'small';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  fullWidth = false,
  size = 'normal',
  ...props
}) => {
  const baseClasses = "rounded-full font-semibold shadow-md transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-opacity-50 inline-flex items-center justify-center";
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-300',
    secondary: 'bg-slate-200 hover:bg-slate-300 text-slate-700 focus:ring-slate-300'
  };

  const sizeClasses = {
      normal: 'px-8 py-3.5 text-base',
      small: 'px-4 py-2 text-sm'
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      {...props}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass}`}
    >
      {children}
    </button>
  );
};
