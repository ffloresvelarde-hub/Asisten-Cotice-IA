import React, { useState, useEffect } from 'react';
import { getTariffCodeForProduct } from '../services/geminiService';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';

interface TariffCodeAssistantProps {
  productName: string;
  onCodeFound: (code: string) => void;
}

export const TariffCodeAssistant: React.FC<TariffCodeAssistantProps> = ({ productName, onCodeFound }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [productDescription, setProductDescription] = useState(productName);

    useEffect(() => {
        if (!isModalOpen) {
            setProductDescription(productName);
            setError(null);
        }
    }, [isModalOpen, productName]);

    const handleSearch = async () => {
        if (!productDescription.trim()) {
            setError("Por favor, ingresa una descripción del producto.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const code = await getTariffCodeForProduct(productDescription);
            onCodeFound(code);
            setIsModalOpen(false);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Ocurrió un error inesperado.');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <>
            <button 
                type="button" 
                onClick={() => setIsModalOpen(true)}
                className="h-[50px] w-[50px] flex items-center justify-center bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors"
                title="Buscar Partida Arancelaria con IA"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
            </button>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Asistente de Partida Arancelaria">
                <div className="space-y-4">
                    <p className="text-slate-600">Describe tu producto y la IA encontrará la partida arancelaria más probable para la aduana peruana.</p>
                    <Input 
                        label="Descripción del Producto"
                        id="product-description"
                        value={productDescription}
                        onChange={(e) => setProductDescription(e.target.value)}
                        placeholder="Ej: Palta Hass fresca de alta calidad"
                    />
                    {error && <p className="text-red-600 text-sm">{error}</p>}

                    <div className="pt-2">
                        <Button onClick={handleSearch} disabled={isLoading} fullWidth>
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <Spinner /> Buscando...
                                </div>
                            ) : "Buscar con IA"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};