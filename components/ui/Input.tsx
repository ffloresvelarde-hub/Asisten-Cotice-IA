import React from 'react';

// FIX: Added a default value to the error prop to make it optional.
export const Input = ({ label, id, error = null, ...props }) => {
  const errorClasses = error
    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
    : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500';

  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="mb-2 text-sm font-medium text-slate-600">
        {label}
      </label>
      <input
        id={id}
        {...props}
        className={`px-4 py-3 bg-slate-100 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${errorClasses}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && <p id={`${id}-error`} className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};