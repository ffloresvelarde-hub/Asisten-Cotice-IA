import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { DonutChart } from './ui/DonutChart';
import { DocumentGeneratorModal } from './DocumentGeneratorModal';
// FIX: Import types for props to ensure type safety.
import { QuotationResultsData, QuotationFormData, Quotation } from '../types';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
};

const IncotermIcon = ({ incoterm }: { incoterm: string }) => {
    const baseClasses = "w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg";
    const colors: { [key: string]: string } = {
        'EXW': 'bg-amber-500',
        'FOB': 'bg-sky-600',
        'CIF': 'bg-emerald-500',
    };
    return <div className={`${baseClasses} ${colors[incoterm]}`}>{incoterm}</div>;
};

const CourierIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M20 12H4m16 0-4 4m4-4-4-4M4 12l4 4m-4-4 4-4" /><path d="M5 8h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" /></svg>;

const FreightIcon = ({ type }: { type: string }) => {
    if (type === 'Marítimo') {
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
    }
     if (type === 'Aéreo') {
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
    }
    if (type === 'Courier') {
        return <CourierIcon />;
    }
    return null;
}

const RecommendationCard = ({ title, content, icon }: { title: string, content: string, icon: React.ReactNode }) => (
    <Card className="bg-slate-100/70 border border-slate-200 !shadow-md">
        <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                {icon}
            </div>
            <div>
                <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
                <p className="text-slate-600 mt-1">{content}</p>
            </div>
        </div>
    </Card>
);

const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
const CrossIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;

const ScenarioCard = ({ scenario }: { scenario: any }) => {
    const { option, rank, isRecommended, costoEstimado, tiempoEstimado, analisisCualitativo, pros, contras } = scenario;

    return (
        <Card className={`relative !shadow-lg transition-all duration-300 ${isRecommended ? 'border-2 border-green-500 bg-green-50/50' : 'border'}`}>
            {isRecommended && (
                <div className="absolute top-0 right-4 -translate-y-1/2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                    RECOMENDADO
                </div>
            )}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-2xl shadow-inner ${
                        isRecommended ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                        {rank}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <FreightIcon type={option} />
                            <h4 className="text-xl font-bold text-slate-800">{option}</h4>
                        </div>
                    </div>
                </div>
                <div className="text-left md:text-right mt-2 md:mt-0 flex-shrink-0">
                    <p className="text-xl font-bold text-blue-600">{costoEstimado}</p>
                    <p className="text-sm text-slate-500">{tiempoEstimado}</p>
                </div>
            </div>

            <p className="my-4 text-slate-600 md:pl-16">{analisisCualitativo}</p>

            <div className="grid md:grid-cols-2 gap-x-6 gap-y-4 md:pl-16">
                <div>
                    <h5 className="font-semibold text-slate-700 mb-2">Ventajas</h5>
                    <ul className="space-y-1">
                        {pros.map((pro: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-slate-600 text-sm">
                                <CheckIcon />
                                <span>{pro}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h5 className="font-semibold text-slate-700 mb-2">Desventajas</h5>
                    <ul className="space-y-1">
                        {contras.map((contra: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-slate-600 text-sm">
                                <CrossIcon />
                                <span>{contra}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </Card>
    );
};

const COST_COLORS: { [key: string]: string } = {
    valorProduccion: '#0ea5e9',
    transporteLocal: '#f97316',
    gastosAduanaExportacion: '#8b5cf6',
    fleteInternacional: '#ec4899',
    seguro: '#10b981',
};

const COST_LABELS: { [key: string]: string } = {
    valorProduccion: 'Producción',
    transporteLocal: 'T. Local',
    gastosAduanaExportacion: 'Aduanas',
    fleteInternacional: 'Flete Intl.',
    seguro: 'Seguro'
};

// FIX: Add types for the component props.
export const QuotationResults = ({ results, formData, onReset }: { results: QuotationResultsData, formData: QuotationFormData, onReset: () => void }) => {
  const { quotations, recommendations, scenarioAnalysis } = results;

  const [modalState, setModalState] = useState<{ isOpen: boolean, type: 'packingList' | 'commercialInvoice' | null, quotation: Quotation | null }>({
      isOpen: false,
      type: null,
      quotation: null,
  });

  const handleOpenModal = (type: 'packingList' | 'commercialInvoice', quotation: Quotation) => {
      setModalState({ isOpen: true, type, quotation });
  };

  const handleCloseModal = () => {
      setModalState({ isOpen: false, type: null, quotation: null });
  };

  return (
    <div className="space-y-10">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-slate-800">Resultados de la Cotización</h2>
        <p className="mt-2 text-lg text-slate-600">Opciones calculadas y recomendaciones estratégicas para tu exportación.</p>
      </div>
      
      <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
        {quotations.map((result, index) => {
           // FIX: With typed props, `value` is now correctly inferred as a number, allowing comparison.
           const chartData = Object.entries(result.desgloseCostos)
                .filter(([, value]) => value > 0)
                .map(([key, value]) => ({
                    label: COST_LABELS[key],
                    value: value,
                    color: COST_COLORS[key]
                }));
          
          return (
          <Card key={index} className="flex flex-col !shadow-lg hover:!shadow-xl">
            <div className="flex items-start justify-between mb-4">
                <IncotermIcon incoterm={result.incoterm} />
                <div className="text-right">
                    <p className="text-sm text-slate-500">Costo Total</p>
                    <p className="text-3xl font-bold text-blue-600">{formatCurrency(result.costoTotal)}</p>
                </div>
            </div>

            <div className="flex items-center justify-between my-4 py-3 border-t border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <FreightIcon type={result.flete}/>
                    <span className="font-medium text-slate-700">{result.flete}</span>
                </div>
                <div className="text-right">
                     <p className="font-medium text-slate-700">{result.tiempoTransito}</p>
                     <p className="text-sm text-slate-500">Tránsito estimado</p>
                </div>
            </div>

            <div className="flex-grow">
                <h4 className="font-semibold text-slate-700 mb-3">Desglose de Costos:</h4>
                <div className="grid grid-cols-2 gap-4 items-center">
                    <div className="flex justify-center items-center">
                        <DonutChart data={chartData} />
                    </div>
                    <ul className="space-y-1.5 text-sm text-slate-600">
                      {chartData.map(item => (
                        <li key={item.label} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                            <span>{item.label}:</span>
                          </div>
                          <span className="font-medium text-slate-800">{formatCurrency(item.value)}</span>
                        </li>
                      ))}
                    </ul>
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200">
                <h4 className="font-semibold text-center text-slate-700 mb-3">Generar Documentos</h4>
                 <div className="flex gap-3 justify-center">
                     <Button size="small" variant="secondary" onClick={() => handleOpenModal('packingList', result)}>
                        Packing List
                     </Button>
                     <Button size="small" variant="secondary" onClick={() => handleOpenModal('commercialInvoice', result)}>
                        Factura Comercial
                     </Button>
                </div>
            </div>
          </Card>
        )})}
      </div>

      {scenarioAnalysis && scenarioAnalysis.length > 0 && (
        <div className="space-y-6 pt-6 border-t border-slate-200">
            <h3 className="text-3xl font-bold text-center text-slate-800">Análisis de Escenarios de Envío</h3>
            <p className="text-center text-slate-500 max-w-3xl mx-auto">Comparación de las opciones de flete más viables para tu envío, clasificadas de la más a la menos recomendada por nuestra IA.</p>
            <div className="space-y-5 mt-4">
                {scenarioAnalysis.map((scenario) => (
                    <ScenarioCard key={scenario.rank} scenario={scenario} />
                ))}
            </div>
        </div>
      )}

      <div className="space-y-6 pt-6 border-t border-slate-200">
          <h3 className="text-2xl font-bold text-center text-slate-800">Recomendaciones Estratégicas</h3>
          <div className="grid md:grid-cols-1 gap-5">
              <RecommendationCard 
                title="Optimización por Temporada"
                content={recommendations.seasonal}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
              />
              <RecommendationCard 
                title="Optimización de Contenedor"
                content={recommendations.container}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2z"></path><path d="M22 6l-10 7L2 6"></path></svg>}
              />
               <RecommendationCard 
                title="Estrategias Adicionales"
                content={recommendations.strategy}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
              />
          </div>
      </div>

      <div className="text-center mt-8">
        <Button onClick={onReset} variant="secondary">
          Crear Nueva Cotización
        </Button>
      </div>

      {modalState.isOpen && modalState.type && modalState.quotation && (
          <DocumentGeneratorModal 
              isOpen={modalState.isOpen}
              onClose={handleCloseModal}
              documentType={modalState.type}
              quotationData={modalState.quotation}
              formData={formData}
          />
      )}
    </div>
  );
};