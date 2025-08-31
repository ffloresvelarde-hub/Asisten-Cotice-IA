import React, { useState, useMemo } from 'react';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';
import type { QuotationFormState, QuotationResult, DocumentType, DocumentGenerationData } from '../types';
import { generateDocumentHtml } from '../services/geminiService';

declare const gtag: (...args: any[]) => void;

interface DocumentGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    documentType: DocumentType;
    quotationData: QuotationResult;
    formData: QuotationFormState;
}

export const DocumentGeneratorModal: React.FC<DocumentGeneratorModalProps> = ({
    isOpen,
    onClose,
    documentType,
    quotationData,
    formData,
}) => {
    const [importer, setImporter] = useState({ companyName: '', taxId: '', address: '' });
    const [packaging, setPackaging] = useState({
        packageCount: 1,
        packageType: 'Pallets',
        netWeightKg: 0,
        grossWeightKg: 0,
        dimensions: '120x100x110 cm'
    });
    const [shipment, setShipment] = useState({
        invoiceNumber: `INV-${Date.now()}`,
        issueDate: new Date().toISOString().split('T')[0],
    });
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const title = useMemo(() =>
        documentType === 'commercialInvoice' ? 'Generar Factura Comercial' : 'Generar Packing List',
        [documentType]
    );
    const documentTypeName = useMemo(() =>
        documentType === 'commercialInvoice' ? 'Factura Comercial' : 'Packing List',
        [documentType]
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, category: 'importer' | 'packaging' | 'shipment') => {
        const { name, value } = e.target;
        const isNumber = ['packageCount', 'netWeightKg', 'grossWeightKg'].includes(name);

        switch(category) {
            case 'importer':
                setImporter(prev => ({ ...prev, [name]: value }));
                break;
            case 'packaging':
                setPackaging(prev => ({ ...prev, [name]: isNumber ? parseFloat(value) || 0 : value }));
                break;
            case 'shipment':
                setShipment(prev => ({ ...prev, [name]: value }));
                break;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        // 1. Open the new tab immediately to avoid pop-up blockers.
        const newTab = window.open('', '_blank');
        if (!newTab) {
            setError("No se pudo abrir una nueva pestaña. Por favor, deshabilita el bloqueador de pop-ups.");
            setIsLoading(false);
            return;
        }
        newTab.document.write('<html><body style="font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;"><h1>Generando documento, por favor espera...</h1></body></html>');

        const fullData: DocumentGenerationData = {
            exporter: formData,
            importer,
            shipment: {
                ...shipment,
                incoterm: quotationData.incoterm,
                totalValue: quotationData.costoTotal,
                freightType: quotationData.flete,
            },
            packaging,
        };
        
        try {
            // 2. Generate the content.
            const htmlContent = await generateDocumentHtml(documentType, fullData);

            if (typeof gtag === 'function') {
                gtag('event', 'generate_document', {
                    'event_category': 'engagement',
                    'event_label': documentType,
                    'value': quotationData.costoTotal
                });
            }

            // 3. Write the final content to the already opened tab.
            newTab.document.open();
            newTab.document.write(htmlContent);
            newTab.document.close();
            
            onClose();
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : `Error generando el documento.`;
            setError(errorMessage);
            // Update the new tab with an error message as well.
            newTab.document.open();
            newTab.document.write(`<html><body style="font-family: sans-serif; padding: 2rem;"><h2>Error al generar documento</h2><p>${errorMessage}</p><p>Por favor, intenta de nuevo. Puedes cerrar esta pestaña.</p></body></html>`);
            newTab.document.close();
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };
    

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <p className="text-sm text-slate-600 -mt-2">Completa los datos adicionales para generar el documento para la cotización {quotationData.incoterm} ({quotationData.flete}).</p>
                
                <div className="space-y-4 border-t border-slate-200 pt-4">
                     <h3 className="text-lg font-semibold text-slate-700">Datos del Importador</h3>
                     <Input label="Empresa Importadora" id="importer-company" name="companyName" value={importer.companyName} onChange={e => handleInputChange(e, 'importer')} required />
                     <Input label="ID Fiscal (Tax ID)" id="importer-taxid" name="taxId" value={importer.taxId} onChange={e => handleInputChange(e, 'importer')} required />
                     <Textarea label="Dirección del Importador" id="importer-address" name="address" value={importer.address} onChange={e => handleInputChange(e, 'importer')} required />
                </div>

                <div className="space-y-4 border-t border-slate-200 pt-4">
                     <h3 className="text-lg font-semibold text-slate-700">Detalles del Empaque</h3>
                     <div className="grid grid-cols-2 gap-4">
                        <Input label="Nº de Bultos" type="number" id="packageCount" name="packageCount" value={packaging.packageCount.toString()} onChange={e => handleInputChange(e, 'packaging')} min="1" required />
                        <Input label="Tipo de Empaque" id="packageType" name="packageType" value={packaging.packageType} onChange={e => handleInputChange(e, 'packaging')} placeholder="Ej: Pallets, Cajas" required />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <Input label="Peso Neto Total (kg)" type="number" id="netWeight" name="netWeightKg" value={packaging.netWeightKg.toString()} onChange={e => handleInputChange(e, 'packaging')} min="0" required />
                        <Input label="Peso Bruto Total (kg)" type="number" id="grossWeight" name="grossWeightKg" value={packaging.grossWeightKg.toString()} onChange={e => handleInputChange(e, 'packaging')} min="0" required />
                     </div>
                     <Input label="Dimensiones" id="dimensions" name="dimensions" value={packaging.dimensions} onChange={e => handleInputChange(e, 'packaging')} placeholder="Ej: 120x100x110 cm por pallet" />
                </div>
                
                 <div className="space-y-4 border-t border-slate-200 pt-4">
                     <h3 className="text-lg font-semibold text-slate-700">Detalles del Documento</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <Input label="Nº de Factura/Documento" id="invoiceNumber" name="invoiceNumber" value={shipment.invoiceNumber} onChange={e => handleInputChange(e, 'shipment')} required />
                        <Input label="Fecha de Emisión" type="date" id="issueDate" name="issueDate" value={shipment.issueDate} onChange={e => handleInputChange(e, 'shipment')} required />
                      </div>
                 </div>

                {error && <p className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">{error}</p>}

                <div className="pt-4 flex justify-end gap-3">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" disabled={isLoading}>
                         {isLoading ? (
                            <div className="flex items-center gap-2">
                                <Spinner /> Generando...
                            </div>
                        ) : `Generar ${documentTypeName}`}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};