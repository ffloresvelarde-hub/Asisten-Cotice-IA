import React from 'react';

export const Modal = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex justify-center overflow-y-auto p-4 sm:py-8 transition-opacity duration-300" 
      onClick={onClose} 
      role="dialog" 
      aria-modal="true"
    >
      <div 
        className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-md w-full my-auto transform transition-all duration-300 scale-95 opacity-0 animate-scale-in"
        onClick={e => e.stopPropagation()}
        style={{ animationName: 'scale-in', animationDuration: '0.2s', animationFillMode: 'forwards' }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-800 transition-colors rounded-full p-1" aria-label="Cerrar modal">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div>
          {children}
        </div>
      </div>
      <style>{`
        @keyframes scale-in {
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};