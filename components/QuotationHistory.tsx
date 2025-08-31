import React from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

export const QuotationHistory = ({ history, onView, onClear }) => {
  if (history.length === 0) {
    return null;
  }
  
  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h3 className="text-2xl font-bold text-slate-800">Historial de Cotizaciones</h3>
        {history.length > 0 && (
            <Button onClick={onClear} variant="secondary" size="small">
              Limpiar Historial
            </Button>
        )}
      </div>
      <div className="space-y-3">
        {history.map(entry => (
          <div key={entry.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 transition-colors hover:bg-slate-100">
            <div className="flex-grow">
              <p className="font-semibold text-slate-800">
                {entry.formData.product} &rarr; {entry.formData.destinationCountry}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {entry.formData.quantity} {entry.formData.quantityUnit} &middot; {new Date(entry.id).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="flex-shrink-0">
              <Button onClick={() => onView(entry)} variant="secondary" size="small">
                Ver Detalles
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};