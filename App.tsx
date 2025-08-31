import React, { useState, useCallback, useEffect } from 'react';
import { QuotationForm } from './components/QuotationForm';
import { QuotationResults } from './components/QuotationResults';
import { Spinner } from './components/ui/Spinner';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { generateQuotation } from './services/geminiService';
import { QuotationHistory } from './components/QuotationHistory';
import { getHistory, addHistoryEntry, clearHistory } from './services/localStorageService';
// FIX: Import types for state to ensure type safety.
import type { QuotationFormState, FullQuotationResponse } from './types';

const loadingMessages = [
    'Analizando datos del producto...',
    'Calculando costos de flete internacional...',
    'Consultando regulaciones aduaneras...',
    'Formulando recomendaciones estratégicas...'
];

const App = () => {
  // FIX: Typed state to avoid 'any' type and allow for better type inference downstream.
  const [quotationData, setQuotationData] = useState<FullQuotationResponse | null>(null);
  const [currentFormData, setCurrentFormData] = useState<QuotationFormState | null>(null);
  const [history, setHistory] = useState(() => getHistory());
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(loadingMessages[0]);

  useEffect(() => {
    let messageIndex = 0;
    let interval = null;
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

  const handleFormSubmit = useCallback(async (formData) => {
    if (formData.incoterms.length === 0) {
        setValidationError("Por favor, selecciona al menos un Incoterm para cotizar.");
        return;
    }
    setIsLoading(true);
    setApiError(null);
    setValidationError(null);
    setQuotationData(null);
    setCurrentFormData(null);

    try {
      const results = await generateQuotation(formData);
      setQuotationData(results);
      setCurrentFormData(formData);
      
      const newEntry = { id: Date.now(), formData, result: results };
      const updatedHistory = addHistoryEntry(newEntry);
      setHistory(updatedHistory);

    } catch (e) {
      console.error(e);
      if (e instanceof Error) {
        setApiError(e.message);
      } else {
        setApiError('Ocurrió un error inesperado. Revisa la consola del navegador para más detalles.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    setQuotationData(null);
    setCurrentFormData(null);
    setApiError(null);
    setValidationError(null);
  }, []);

  const handleViewHistory = useCallback((entry) => {
    setQuotationData(entry.result);
    setCurrentFormData(entry.formData);
    setApiError(null);
    setValidationError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleClearHistory = useCallback(() => {
    clearHistory();
    setHistory([]);
  }, []);


  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          {!quotationData && !isLoading && (
            <div className="space-y-8">
                <QuotationForm onSubmit={handleFormSubmit} initialError={validationError} />
                {apiError && !isLoading && (
                     <div className="text-center p-8 bg-red-50 border border-red-200 rounded-xl shadow-md">
                      <p className="text-red-600 font-semibold">{apiError}</p>
                      <button
                        onClick={() => setApiError(null)}
                        className="mt-4 px-6 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75"
                      >
                        Entendido
                      </button>
                    </div>
                  )}
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