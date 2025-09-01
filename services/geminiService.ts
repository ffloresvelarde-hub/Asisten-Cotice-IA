import { GoogleGenAI, Type } from "@google/genai";
import { QuotationFormData, QuotationResultsData } from '../types';

// --- Detección de Entorno y Configuración ---
// Comprueba si la API_KEY está disponible en el objeto window, que es como AI Studio la provee.
const API_KEY = (window as any).process?.env?.API_KEY;
const IS_DEV_ENVIRONMENT = !!API_KEY;

// Inicializa el cliente de IA solo si estamos en el entorno de desarrollo (AI Studio).
let ai: GoogleGenAI | null = null;
if (IS_DEV_ENVIRONMENT) {
    if (API_KEY) {
        ai = new GoogleGenAI({ apiKey: API_KEY });
    } else {
        // Esto sirve como una advertencia si el entorno de desarrollo no está configurado correctamente.
        console.error("API_KEY no encontrada en el entorno de AI Studio (window.process.env.API_KEY).");
    }
}

// --- Esquemas y Prompts (para ejecución en el cliente) ---
// Se duplican de la función de Netlify para permitir la ejecución en el cliente en AI Studio.
const responseSchema = {
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

const getQuotationPrompt = (formData) => {
    const { product, tariffCode, destinationCountry, quantity, quantityUnit, productionValue, incoterms, empresa, ruc, direccion, correo } = formData;
    const incotermsString = incoterms.join(', ');
    return `
    Actúa como un experto consultor en logística de exportación para el sector agroindustrial de Perú.

    Datos del Exportador (para referencia en documentos, no para análisis de costos):
    - Empresa: ${empresa}
    - RUC: ${ruc}
    - Dirección: ${direccion}
    - Correo: ${correo}

    El usuario desea cotizar la exportación del siguiente producto:
    - Producto: ${product}
    - Partida Arancelaria: ${tariffCode}
    - País de Destino: ${destinationCountry}
    - Cantidad: ${quantity} ${quantityUnit}
    - Valor de Producción (EXW): ${productionValue} USD
    - Incoterms solicitados: ${incotermsString}

    Tu tarea es generar una respuesta JSON estructurada que contenga tres partes principales: 'quotations', 'recommendations' y 'scenarioAnalysis'.

    1.  **Quotations**: Genera un desglose detallado de costos para cada uno de los Incoterms solicitados: ${incotermsString}. Para FOB y CIF, calcula los costos tanto para flete marítimo como para flete aéreo. Si se solicita EXW, el flete internacional y el seguro deben ser 0. No incluyas cotizaciones para Incoterms que no fueron solicitados. Usa estimaciones realistas y actualizadas.
    2.  **Recommendations**: Ofrece consejos sobre las mejores fechas para enviar, optimización de contenedores y otras estrategias clave.
    3.  **Scenario Analysis**: Analiza y clasifica los escenarios de envío (Marítimo, Aéreo, Courier) para la cantidad especificada, evaluando viabilidad, costo, tiempo y complejidad, marcando la opción más recomendada.

    Devuelve tu respuesta únicamente como un objeto JSON válido que se ajuste estrictamente al esquema proporcionado, sin ningún texto, explicación o markdown adicional.`;
};

const getTariffCodePrompt = (productDescription) => `
    Actúa como un experto en aduanas de Perú. 
    Basado en la siguiente descripción de producto, proporciona únicamente la partida arancelaria peruana más probable en el formato XXXX.XX.XX.XX.
    No incluyas ninguna explicación, texto adicional, ni markdown. Solo el código.
    Descripción del producto: "${productDescription}"`;

const getDocumentPrompt = (documentType, data) => {
    const documentTitle = documentType === 'commercialInvoice' ? 'Factura Comercial' : 'Packing List';
    return `
        Actúa como un experto en documentación de comercio internacional. Tu tarea es generar un documento HTML completo y profesional para una '${documentTitle}'.
        El HTML debe ser auto-contenido y usar Tailwind CSS desde CDN. Debe estar optimizado para impresión A4.
        
        Usa los siguientes datos:
        - Exportador: ${JSON.stringify(data.exporter)}
        - Importador: ${JSON.stringify(data.importer)}
        - Envío: ${JSON.stringify(data.shipment)}
        - Producto: ${JSON.stringify(data.exporter)}
        - Empaque: ${JSON.stringify(data.packaging)}

        Instrucciones Específicas:
        - Para la Factura Comercial: Título "COMMERCIAL INVOICE / FACTURA COMERCIAL", tabla detallada con precios, monto total en letras y números, y pie para firma.
        - Para el Packing List: Título "PACKING LIST / LISTA DE EMPAQUE", sin precios, tabla con detalles de empaque (bultos, pesos, dimensiones), y pie para firma.

        Estructura: HTML completo con un botón de "Imprimir" que se oculte al imprimir. Devuelve únicamente el código HTML.`;
};


// --- Implementación para Netlify (Producción) ---
const callApiProxy = async (action: string, payload: object) => {
    try {
        const response = await fetch('/.netlify/functions/gemini-api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, payload }),
        });

        // --- FIX: Robust Response Handling ---
        // If the response is not OK, handle the error gracefully.
        if (!response.ok) {
            // Netlify functions can time out (10s limit) and return an HTML error page or empty response.
            // Try to get text first to see what the server actually sent.
            const errorText = await response.text();
            try {
                // Check if the server sent a JSON error object.
                const errorJson = JSON.parse(errorText);
                throw new Error(errorJson.error || `El servidor respondió con un error: ${response.status}`);
            } catch (e) {
                // If parsing fails, the server sent a non-JSON error (like a timeout page).
                if (response.status === 504) { // Gateway Timeout
                    throw new Error('El servidor tardó demasiado en responder (Timeout). Por favor, intenta de nuevo.');
                }
                throw new Error(`El servidor respondió con un error inesperado (código ${response.status}).`);
            }
        }

        // The response might be successful but empty.
        const responseText = await response.text();
        if (!responseText) {
            throw new Error('El servidor devolvió una respuesta vacía, lo que puede indicar un timeout.');
        }

        // Now, safely try to parse the JSON.
        try {
            return JSON.parse(responseText);
        } catch (e) {
            // This catches "Unexpected end of JSON input" if the body is malformed but not empty.
            console.error("Error al parsear JSON:", responseText);
            throw new Error('La respuesta del servidor no es un formato JSON válido.');
        }

    } catch (error) {
        console.error(`Error al llamar a la acción de la API "${action}":`, error);
        if (error instanceof Error) {
            if (error.message.includes('Failed to fetch')) {
                throw new Error('No se pudo conectar con el servidor. Por favor, revisa tu conexión a internet.');
            }
            throw error;
        }
        throw new Error('Ocurrió un error inesperado al comunicarse con el servidor.');
    }
};

// --- Helper para ordenar resultados (usado en ambos entornos) ---
const sortResults = (parsedResponse: QuotationResultsData) => {
    const incotermOrder = { 'EXW': 1, 'FOB': 2, 'CIF': 3 };
    const fleteOrder = { 'Marítimo': 1, 'Aéreo': 2, 'No Aplica': 0 };
    if (parsedResponse.quotations) {
      parsedResponse.quotations.sort((a, b) => {
          const incotermDiff = incotermOrder[a.incoterm] - incotermOrder[b.incoterm];
          if (incotermDiff !== 0) return incotermDiff;
          return fleteOrder[a.flete] - fleteOrder[b.flete];
      });
    }
    if (parsedResponse.scenarioAnalysis) {
        parsedResponse.scenarioAnalysis.sort((a, b) => a.rank - b.rank);
    }
    return parsedResponse;
};


// --- Funciones Unificadas Exportadas ---

export const generateQuotation = async (formData: QuotationFormData): Promise<QuotationResultsData> => {
    if (IS_DEV_ENVIRONMENT) {
        if (!ai) throw new Error("La API Key no está configurada en el entorno de despliegue (Netlify). Por favor, ve a 'Site configuration' > 'Build & deploy' > 'Environment' y asegúrate de que la variable de entorno 'API_KEY' esté creada y con el valor correcto. Después de agregarla, debes hacer un nuevo 'deploy' para que los cambios se apliquen.");
        const prompt = getQuotationPrompt(formData);
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: responseSchema }
        });
        return sortResults(JSON.parse(response.text.trim()));
    } else {
        const results = await callApiProxy('generateQuotation', { formData });
        return sortResults(results);
    }
};

export const getTariffCodeForProduct = async (productDescription: string): Promise<string> => {
    if (IS_DEV_ENVIRONMENT) {
        if (!ai) throw new Error("La API Key no está configurada para el entorno de desarrollo (AI Studio).");
        const prompt = getTariffCodePrompt(productDescription);
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
        const code = response.text.trim();
        if (!/^\d{4}\.\d{2}\.\d{2}\.\d{2}$/.test(code)) {
            throw new Error(`Formato de partida arancelaria inválido recibido de la IA: "${code}"`);
        }
        return code;
    } else {
        const result = await callApiProxy('getTariffCodeForProduct', { productDescription });
        // Since the server function returns a primitive string, it might not be wrapped in JSON.
        // We'll trust the server function's validation.
        return result as string;
    }
};

export const generateDocumentHtml = async (
    documentType: 'commercialInvoice' | 'packingList',
    data: any
): Promise<string> => {
    if (IS_DEV_ENVIRONMENT) {
        if (!ai) throw new Error("La API Key no está configurada para el entorno de desarrollo (AI Studio).");
        const prompt = getDocumentPrompt(documentType, data);
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
        return response.text.trim();
    } else {
        const result = await callApiProxy('generateDocumentHtml', { documentType, data });
        return result as string;
    }
};