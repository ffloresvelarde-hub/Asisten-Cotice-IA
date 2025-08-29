import { GoogleGenAI, Type } from "@google/genai";
import type { QuotationFormState, FullQuotationResponse, DocumentGenerationData, DocumentType } from '../../types';

// FIX: Moved helper functions before their usage to resolve "Cannot find name" errors.

// --- Funciones para construir los prompts ---

function buildQuotationPrompt(formData: QuotationFormState): string {
    const { product, tariffCode, destinationCountry, quantity, quantityUnit, productionValue, incoterms, empresa, ruc, direccion, correo } = formData;
    const incotermsString = incoterms.join(', ');
    return `
    Actúa como un experto consultor en logística de exportación para el sector agroindustrial de Perú.
    Datos del Exportador: Empresa: ${empresa}, RUC: ${ruc}, Dirección: ${direccion}, Correo: ${correo}
    El usuario desea cotizar:
    - Producto: ${product}
    - Partida Arancelaria: ${tariffCode}
    - País de Destino: ${destinationCountry}
    - Cantidad: ${quantity} ${quantityUnit}
    - Valor de Producción (EXW): ${productionValue} USD
    - Incoterms solicitados: ${incotermsString}
    Tu tarea es generar una respuesta JSON que contenga 'quotations', 'recommendations' y 'scenarioAnalysis' según el schema.
    1. Quotations: Genera desglose de costos para ${incotermsString}. Usa estimaciones realistas.
    2. Recommendations: Ofrece consejos sobre temporada (seasonal), optimización de contenedor (container) y otras estrategias (strategy).
    3. Scenario Analysis: Analiza y rankea los escenarios (Marítimo, Aéreo, Courier), evaluando viabilidad, costo, tiempo, pros y contras. Marca solo uno como 'isRecommended: true'.
    Devuelve únicamente el objeto JSON válido.`;
}

function buildDocumentPrompt(documentType: DocumentType, data: DocumentGenerationData): string {
    const documentTitle = documentType === 'commercialInvoice' ? 'Factura Comercial' : 'Packing List';
    return `
        Actúa como un experto en documentación de comercio internacional. Genera un documento HTML completo y profesional para una '${documentTitle}' usando Tailwind CSS desde CDN.
        El diseño debe ser limpio, moderno y optimizado para impresión A4 (usa @media print).
        Pobla el documento con estos datos:
        - Exportador: ${data.exporter.empresa} (RUC: ${data.exporter.ruc}), ${data.exporter.direccion}.
        - Importador: ${data.importer.companyName} (ID: ${data.importer.taxId}), ${data.importer.address}.
        - Envío: Factura #${data.shipment.invoiceNumber} (${data.shipment.issueDate}), Incoterm ${data.shipment.incoterm} (${data.shipment.freightType}), Destino ${data.exporter.destinationCountry}.
        - Producto: ${data.exporter.product} (HS Code: ${data.exporter.tariffCode}), Cantidad: ${data.exporter.quantity} ${data.exporter.quantityUnit}, Valor Total (${data.shipment.incoterm}): ${data.shipment.totalValue} USD.
        - Empaque: ${data.packaging.packageCount} ${data.packaging.packageType}, Peso Neto: ${data.packaging.netWeightKg} kg, Peso Bruto: ${data.packaging.grossWeightKg} kg, Dimensiones: ${data.packaging.dimensions}.
        Instrucciones Específicas:
        - Para Factura Comercial: Título "COMMERCIAL INVOICE", tabla detallada de producto con precio unitario y total. Monto total en letras y números. Espacio para firma.
        - Para Packing List: Título "PACKING LIST", sin precios. Tabla con detalles de empaque, pesos y dimensiones. Totales claros. Espacio para firma.
        Incluye un botón de "Imprimir" que se oculte al imprimir (onclick="window.print()").
        Devuelve únicamente el código HTML completo.`;
}

function getResponseSchema() {
    return {
    type: Type.OBJECT,
    properties: {
        quotations: {
            type: Type.ARRAY,
            description: "Array de las cotizaciones generadas para los Incoterms solicitados.",
            items: {
                type: Type.OBJECT,
                properties: {
                    incoterm: { type: Type.STRING, enum: ["EXW", "FOB", "CIF"] },
                    flete: { type: Type.STRING, enum: ["Marítimo", "Aéreo", "No Aplica"] },
                    costoTotal: { type: Type.NUMBER },
                    tiempoTransito: { type: Type.STRING },
                    desgloseCostos: {
                        type: Type.OBJECT,
                        properties: {
                            valorProduccion: { type: Type.NUMBER },
                            transporteLocal: { type: Type.NUMBER },
                            gastosAduanaExportacion: { type: Type.NUMBER },
                            fleteInternacional: { type: Type.NUMBER },
                            seguro: { type: Type.NUMBER },
                        },
                        required: ["valorProduccion", "transporteLocal", "gastosAduanaExportacion", "fleteInternacional", "seguro"]
                    }
                },
                required: ["incoterm", "flete", "costoTotal", "tiempoTransito", "desgloseCostos"]
            }
        },
        recommendations: {
            type: Type.OBJECT,
            properties: {
                seasonal: { type: Type.STRING },
                container: { type: Type.STRING },
                strategy: { type: Type.STRING }
            },
            required: ["seasonal", "container", "strategy"]
        },
        scenarioAnalysis: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    option: { type: Type.STRING, enum: ["Marítimo", "Aéreo", "Courier"] },
                    rank: { type: Type.NUMBER },
                    isRecommended: { type: Type.BOOLEAN },
                    costoEstimado: { type: Type.STRING },
                    tiempoEstimado: { type: Type.STRING },
                    analisisCualitativo: { type: Type.STRING },
                    pros: { type: Type.ARRAY, items: { type: Type.STRING } },
                    contras: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["option", "rank", "isRecommended", "costoEstimado", "tiempoEstimado", "analisisCualitativo", "pros", "contras"]
            }
        }
    },
    required: ["quotations", "recommendations", "scenarioAnalysis"]
};
}

// --- Lógica para cada acción ---

const handleGenerateQuotation = async (ai: GoogleGenAI, formData: QuotationFormState): Promise<FullQuotationResponse> => {
    const prompt = buildQuotationPrompt(formData);

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: getResponseSchema() // Usamos una función para mantener el código limpio
        }
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as FullQuotationResponse;
};

const handleGetTariffCode = async (ai: GoogleGenAI, productDescription: string): Promise<string> => {
    const prompt = `Actúa como un experto en aduanas de Perú. Basado en la siguiente descripción de producto, proporciona únicamente la partida arancelaria peruana más probable en el formato XXXX.XX.XX.XX. No incluyas ninguna explicación. Producto: "${productDescription}"`;
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
    });
    
    const code = response.text.trim();
    const tariffCodeRegex = /^\d{4}\.\d{2}\.\d{2}\.\d{2}$/;
    if (!tariffCodeRegex.test(code)) {
        throw new Error(`Formato de partida arancelaria inválido recibido de la IA.`);
    }
    return code;
};

const handleGenerateDocument = async (ai: GoogleGenAI, documentType: DocumentType, data: DocumentGenerationData): Promise<string> => {
    const prompt = buildDocumentPrompt(documentType, data);
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
    });
    return response.text.trim();
};

// El handler principal que Netlify ejecutará
export const handler = async (event: { body: string | null; httpMethod: string; }) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    if (!event.body) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Request body is missing' }) };
    }

    if (!process.env.API_KEY) {
        console.error("Missing API_KEY environment variable");
        return { statusCode: 500, body: JSON.stringify({ error: "La configuración del servidor es incorrecta." }) };
    }
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const { action, payload } = JSON.parse(event.body);

        switch (action) {
            case 'generateQuotation':
                const quotation = await handleGenerateQuotation(ai, payload.formData);
                return { statusCode: 200, body: JSON.stringify(quotation) };
            
            case 'getTariffCode':
                const code = await handleGetTariffCode(ai, payload.productDescription);
                return { statusCode: 200, body: JSON.stringify({ code }) };

            case 'generateDocument':
                const html = await handleGenerateDocument(ai, payload.documentType, payload.data);
                return { statusCode: 200, body: JSON.stringify({ html }) };

            default:
                return { statusCode: 400, body: JSON.stringify({ error: `Acción desconocida: ${action}` }) };
        }
    } catch (error) {
        console.error("Error en la función de Netlify:", error);
        const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor.';
        return { statusCode: 500, body: JSON.stringify({ error: errorMessage }) };
    }
};
