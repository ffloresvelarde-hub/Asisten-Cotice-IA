
import React, { useState, useCallback, useEffect } from 'react';
import { QuotationForm } from './components/QuotationForm';
import { QuotationResults } from './components/QuotationResults';
import { Spinner } from './components/ui/Spinner';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import type { QuotationFormState, FullQuotationResponse, HistoryEntry } from './types';
import { generateQuotation } from './services/geminiService';
import { QuotationHistory } from './components/QuotationHistory';
import { getHistory, addHistoryEntry, clearHistory } from './services/localStorageService';

declare const gtag: (...args: any[]) => void;

const loadingMessages = [
    'Analizando datos del producto...',
    'Calculando costos de flete internacional...',
    'Consultando regulaciones aduaneras...',
    'Formulando recomendaciones estratégicas...'
];

const App: React.FC = () => {
  const [quotationData, setQuotationData] = useState<FullQuotationResponse | null>(null);
  const [currentFormData, setCurrentFormData] = useState<QuotationFormState | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(() => getHistory());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(loadingMessages[0]);

  useEffect(() => {
    let messageIndex = 0;
    // FIX: Replaced NodeJS.Timeout with ReturnType<typeof setInterval> for browser compatibility.
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isLoading) {
        setCurrentLoadingMessage(loadingMessages[0]);
        interval = setInterval(() => {
            messageIndex = (messageIndex + 1) % loadingMessages.length;
            setCurrentLoadingMessage(loadingMessages[messageIndex]);
        }, 2500);
    }
    
    return () => {
        if (interval) {
            clearInterval(interval);
        }
    };
  }, [isLoading]);

  const handleFormSubmit = useCallback(async (formData: QuotationFormState) => {
    if (formData.incoterms.length === 0) {
        setError("Por favor, selecciona al menos un Incoterm para cotizar.");
        return;
    }
    setIsLoading(true);
    setError(null);
    setQuotationData(null);
    setCurrentFormData(null);

    try {
      const results = await generateQuotation(formData);
      setQuotationData(results);
      setCurrentFormData(formData);
      
      const newEntry: HistoryEntry = { id: Date.now(), formData, result: results };
      const updatedHistory = addHistoryEntry(newEntry);
      setHistory(updatedHistory);

      if (typeof gtag === 'function') {
        gtag('event', 'generate_quotation', {
          'event_category': 'engagement',
          'event_label': formData.product,
          'value': formData.productionValue
        });
      }

    } catch (e) {
      console.error(e);
      setError('Hubo un error al generar la cotización. Por favor, revisa la consola para más detalles y asegúrate que la clave de API está configurada.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    setQuotationData(null);
    setCurrentFormData(null);
    setError(null);
  }, []);

  const handleViewHistory = useCallback((entry: HistoryEntry) => {
    setQuotationData(entry.result);
    setCurrentFormData(entry.formData);
    setError(null);
    if (typeof gtag === 'function') {
      gtag('event', 'view_history', {
        'event_category': 'engagement',
        'event_label': entry.formData.product
      });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleClearHistory = useCallback(() => {
    clearHistory();
    setHistory([]);
    if (typeof gtag === 'function') {
        gtag('event', 'clear_history', {
          'event_category': 'engagement'
        });
    }
  }, []);


  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          {!quotationData && !isLoading && (
            <div className="space-y-8">
                <QuotationForm onSubmit={handleFormSubmit} initialError={error} />
                <QuotationHistory 
                    history={history}
                    onView={handleViewHistory}
                    onClear={handleClearHistory}
                />
            </div>
          )}
          
          {isLoading && (
            <div className="flex flex-col items-center justify-center text-center p-8 bg-white rounded-2xl shadow-lg">
              <Spinner />
              <p className="mt-6 text-xl font-medium text-slate-700">Generando cotización inteligente...</p>
              <p className="text-slate-500 mt-2 h-6 transition-opacity duration-500">{currentLoadingMessage}</p>
            </div>
          )}

          {error && !isLoading && !quotationData && (
             <div className="text-center p-8 bg-red-50 border border-red-200 rounded-xl shadow-md">
              <p className="text-red-600 font-semibold">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-4 px-6 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75"
              >
                Entendido
              </button>
            </div>
          )}

          {quotationData && !isLoading && currentFormData && (
            <div className="fade-in">
              <QuotationResults 
                results={quotationData} 
                formData={currentFormData}
                onReset={handleReset} 
              />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default App;