import { GoogleGenAI, Type } from "@google/genai";
import type { Handler } from "@netlify/functions";

// Initialize the Gemini AI client on the server.
// The API_KEY is securely accessed from Netlify's environment variables.
const ai = process.env.API_KEY ? new GoogleGenAI({ apiKey: process.env.API_KEY }) : null;

// --- Schema Definition (copied from original service) ---
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


// --- Prompt Generators (copied and adapted from original service) ---
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

// --- Main Handler for the Netlify Function ---
const handler: Handler = async (event) => {
    if (!ai) {
        console.error("Gemini AI client not initialized. API_KEY missing on server.");
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "La configuración del servidor está incompleta. El servicio de IA no está disponible." }),
        };
    }
    
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const { action, payload } = JSON.parse(event.body || '{}');
        let result;

        switch (action) {
            case 'generateQuotation': {
                const prompt = getQuotationPrompt(payload.formData);
                const response = await ai.models.generateContent({
                  model: "gemini-2.5-flash",
                  contents: prompt,
                  config: { responseMimeType: "application/json", responseSchema: responseSchema }
                });

                const parsedResponse = JSON.parse(response.text.trim());
                
                const incotermOrder = { 'EXW': 1, 'FOB': 2, 'CIF': 3 };
                const fleteOrder = { 'Marítimo': 1, 'Aéreo': 2, 'No Aplica': 0 };
                parsedResponse.quotations.sort((a, b) => {
                    const incotermDiff = incotermOrder[a.incoterm] - incotermOrder[b.incoterm];
                    if (incotermDiff !== 0) return incotermDiff;
                    return fleteOrder[a.flete] - fleteOrder[b.flete];
                });
                if (parsedResponse.scenarioAnalysis) {
                    parsedResponse.scenarioAnalysis.sort((a, b) => a.rank - b.rank);
                }
                result = parsedResponse;
                break;
            }
            case 'getTariffCodeForProduct': {
                const prompt = getTariffCodePrompt(payload.productDescription);
                const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
                const code = response.text.trim();
                if (!/^\d{4}\.\d{2}\.\d{2}\.\d{2}$/.test(code)) {
                    throw new Error(`Formato de partida arancelaria inválido recibido de la IA.`);
                }
                result = code;
                break;
            }
            case 'generateDocumentHtml': {
                const { documentType, data } = payload;
                const prompt = getDocumentPrompt(documentType, data);
                const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
                result = response.text.trim();
                break;
            }
            default:
                return { statusCode: 400, body: JSON.stringify({ error: "Acción no válida" }) };
        }

        return {
            statusCode: 200,
            body: JSON.stringify(result),
            headers: { 'Content-Type': 'application/json' }
        };

    } catch (error) {
        console.error("Error executing Gemini API call in Netlify function:", error);
        let errorMessage = 'Ocurrió un error interno en el servidor.';
        if (error instanceof Error) {
            if (error.message.includes('400') || error.message.toLowerCase().includes('api key not valid')) {
                errorMessage = 'La API Key configurada en el servidor no es válida o está mal configurada.';
            } else if (error.message.includes('429')) {
                errorMessage = 'Se ha excedido la cuota de uso de la API (límite de peticiones por minuto). Por favor, inténtalo más tarde.';
            } else {
                 errorMessage = error.message;
            }
        }
        return { statusCode: 500, body: JSON.stringify({ error: errorMessage }) };
    }
};

export { handler };
