import React from 'react';

export const Header = () => {
  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2.5 rounded-xl shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">
            Asistente de Exportación IA
          </h1>
        </div>
        <span className="text-sm font-medium text-blue-600 hidden sm:block">Perú Agroindustrial</span>
      </div>
    </header>
  );
};