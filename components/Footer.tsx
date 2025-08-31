import React from 'react';

export const Footer = () => {
  return (
    <footer className="bg-white/80 mt-8 border-t border-slate-200">
      <div className="container mx-auto px-4 py-4 text-center text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} Asistente de Exportación. Potenciado por Gemini AI.</p>
      </div>
    </footer>
  );
};