
import { GoogleGenAI, Type } from "@google/genai";
import type { QuotationFormState, FullQuotationResponse, DocumentGenerationData, DocumentType } from '../../types';

// --- Esquema de respuesta detallado para la IA ---
const responseSchema = {
    type: Type.OBJECT,
    properties: {
        quotations: {
            type: Type.ARRAY,
            description: "Array de las cotizaciones generadas para los Incoterms solicitados.",
            items: {
                type: Type.OBJECT,
                properties: {
                    incoterm: {
                        type: Type.STRING,
                        enum: ["EXW", "FOB", "CIF"],
                        description: "El Incoterm de la cotización."
                    },
                    flete: {
                        type: Type.STRING,
                        enum: ["Marítimo", "Aéreo", "No Aplica"],
                        description: "El tipo de flete. 'No Aplica' para EXW."
                    },
                    costoTotal: {
                        type: Type.NUMBER,
                        description: "El costo total de la exportación en USD para esta opción."
                    },
                    tiempoTransito: {
                        type: Type.STRING,
                        description: "El tiempo estimado de tránsito, ej. '15-20 días'."
                    },
                    desgloseCostos: {
                        type: Type.OBJECT,
                        properties: {
                            valorProduccion: { type: Type.NUMBER, description: "Costo de producción de los bienes." },
                            transporteLocal: { type: Type.NUMBER, description: "Costo del transporte desde el almacén al puerto/aeropuerto en Perú." },
                            gastosAduanaExportacion: { type: Type.NUMBER, description: "Costos de aduanas y documentación para la exportación." },
                            fleteInternacional: { type: Type.NUMBER, description: "Costo del flete principal (marítimo o aéreo)." },
                            seguro: { type: Type.NUMBER, description: "Costo del seguro de la mercancía (0 si no aplica)." },
                        },
                        required: ["valorProduccion", "transporteLocal", "gastosAduanaExportacion", "fleteInternacional", "seguro"]
                    }
                },
                required: ["incoterm", "flete", "costoTotal", "tiempoTransito", "desgloseCostos"]
            }
        },
        recommendations: {
            type: Type.OBJECT,
            description: "Recomendaciones estratégicas para la exportación.",
            properties: {
                seasonal: {
                    type: Type.STRING,
                    description: "Consejos sobre las mejores fechas para enviar el producto para optimizar costos."
                },
                container: {
                    type: Type.STRING,
                    description: "Recomendaciones sobre la optimización de contenedores y si conviene aumentar el volumen."
                },
                strategy: {
                    type: Type.STRING,
                    description: "Otras estrategias clave para mejorar la eficiencia del envío y la cotización."
                }
            },
            required: ["seasonal", "container", "strategy"]
        },
        scenarioAnalysis: {
            type: Type.ARRAY,
            description: "Análisis comparativo de los escenarios de envío (Marítimo, Aéreo, Courier), clasificados por viabilidad y recomendación para la cantidad y destino especificados.",
            items: {
                type: Type.OBJECT,
                properties: {
                    option: { type: Type.STRING, enum: ["Marítimo", "Aéreo", "Courier"], description: "El método de envío." },
                    rank: { type: Type.NUMBER, description: "El ranking de preferencia (1 es el más recomendado)." },
                    isRecommended: { type: Type.BOOLEAN, description: "True si esta es la opción más recomendada." },
                    costoEstimado: { type: Type.STRING, description: "Rango de costo estimado en USD, ej. '$500 - $700'." },
                    tiempoEstimado: { type: Type.STRING, description: "Tiempo de tránsito estimado, ej. '5-7 días'." },
                    analisisCualitativo: { type: Type.STRING, description: "Un análisis cualitativo de por qué esta opción es o no es adecuada." },
                    pros: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Lista de ventajas (2-3 puntos)." },
                    contras: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Lista de desventajas (2-3 puntos)." },
                },
                required: ["option", "rank", "isRecommended", "costoEstimado", "tiempoEstimado", "analisisCualitativo", "pros", "contras"]
            }
        }
    },
    required: ["quotations", "recommendations", "scenarioAnalysis"]
};


// --- Funciones para construir los prompts mejorados ---

function buildQuotationPrompt(formData: QuotationFormState): string {
  const { 
    product, tariffCode, destinationCountry, quantity, quantityUnit, productionValue, incoterms,
    empresa, ruc, direccion, correo
  } = formData;
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

    1.  **Quotations**:
        -   Genera un desglose detallado de costos para cada uno de los Incoterms solicitados: ${incotermsString}.
        -   Para FOB y CIF, calcula los costos tanto para flete marítimo como para flete aéreo.
        -   Si se solicita EXW, el flete internacional y el seguro deben ser 0, y el tipo de flete debe ser "No Aplica".
        -   No incluyas cotizaciones para Incoterms que no fueron solicitados.
        -   Usa estimaciones realistas y actualizadas para los costos adicionales en USD (Transporte Local, Aduanas, Flete Internacional, Seguro).
        -   Proporciona un tiempo de tránsito estimado para cada opción de flete.

    2.  **Recommendations**:
        -   **seasonal**: Ofrece consejos sobre las mejores fechas o temporadas para enviar ${product} a ${destinationCountry} para encontrar fletes más económicos. Sé específico.
        -   **container**: Analiza la cantidad de ${quantity} ${quantityUnit} de ${product}. Recomienda si aumentar la cantidad para llenar un contenedor estándar (20' o 40') sería más rentable. Estima el ahorro potencial en el costo por unidad.
        -   **strategy**: Proporciona otras 2-3 estrategias clave para que el exportador mejore la eficiencia, como la consolidación de carga, elección de navieras, negociación con proveedores logísticos o documentación importante.

    3.  **Scenario Analysis**:
        -   Analiza de forma cuantitativa y cualitativa los posibles escenarios de envío para la cantidad especificada (${quantity} ${quantityUnit}).
        -   Considera las opciones: Flete Marítimo, Flete Aéreo y Courier.
        -   Para cada opción, evalúa su viabilidad. Por ejemplo, para una cantidad muy pequeña como 10 kg, el flete marítimo no es viable y debes indicarlo en el análisis. Para cantidades grandes, courier no es rentable.
        -   Discierne entre las variables (costo, tiempo, complejidad, tamaño del envío) para determinar la opción más tentativa.
        -   Crea un ranking de las opciones (propiedad 'rank'), donde 1 es la más recomendada.
        -   Marca explícitamente la opción más recomendada con la propiedad 'isRecommended' como true. Solo una puede ser true.
        -   Proporciona un rango de costo y tiempo estimado para cada escenario viable. Si no es viable, indícalo.
        -   Para cada escenario, escribe un breve análisis cualitativo y lista 2-3 pros y contras clave.

    Devuelve tu respuesta únicamente como un objeto JSON válido que se ajuste estrictamente al esquema proporcionado, sin ningún texto, explicación o markdown adicional.
  `;
}

function buildDocumentPrompt(documentType: DocumentType, data: DocumentGenerationData): string {
    const documentTitle = documentType === 'commercialInvoice' ? 'Factura Comercial' : 'Packing List';
    return `
        Actúa como un experto en documentación de comercio internacional. Tu tarea es generar un documento HTML completo y profesional para una '${documentTitle}'.
        El HTML debe ser auto-contenido. Utiliza la CDN de Tailwind CSS para el estilo. Asegúrate de que el diseño sea limpio, moderno y fácil de leer.
        El documento debe estar optimizado para impresión (formato A4). Incluye estilos @media print para ocultar botones y mejorar la apariencia de impresión.

        Usa los siguientes datos para poblar el documento:
        - **Datos del Exportador (Vendedor):**
          - Empresa: ${data.exporter.empresa}
          - RUC: ${data.exporter.ruc}
          - Dirección: ${data.exporter.direccion}
          - Correo: ${data.exporter.correo}

        - **Datos del Importador (Comprador):**
          - Empresa: ${data.importer.companyName}
          - ID Fiscal: ${data.importer.taxId}
          - Dirección: ${data.importer.address}

        - **Detalles del Envío:**
          - Número de Factura/Documento: ${data.shipment.invoiceNumber}
          - Fecha de Emisión: ${data.shipment.issueDate}
          - Incoterm: ${data.shipment.incoterm} (${data.shipment.freightType})
          - Destino Final: ${data.exporter.destinationCountry}

        - **Detalles del Producto:**
          - Descripción: ${data.exporter.product}
          - Partida Arancelaria (HS Code): ${data.exporter.tariffCode}
          - Cantidad: ${data.exporter.quantity} ${data.exporter.quantityUnit}
          - Valor Total (${data.shipment.incoterm}): ${data.shipment.totalValue} USD

        - **Detalles del Empaque:**
          - Número de Bultos: ${data.packaging.packageCount}
          - Tipo de Empaque: ${data.packaging.packageType}
          - Peso Neto Total: ${data.packaging.netWeightKg} kg
          - Peso Bruto Total: ${data.packaging.grossWeightKg} kg
          - Dimensiones: ${data.packaging.dimensions}

        **Instrucciones Específicas para el Documento:**
        - **Para la Factura Comercial:**
          - El título principal debe ser "COMMERCIAL INVOICE / FACTURA COMERCIAL".
          - Crea una tabla detallada para el producto que incluya: Descripción, HS Code, Cantidad, Precio Unitario (calculado), y Precio Total. El precio total debe coincidir con ${data.shipment.totalValue}.
          - Muestra claramente el monto total en letras y números.
          - Incluye un pie de página con espacio para firma y sello.

        - **Para el Packing List:**
          - El título principal debe ser "PACKING LIST / LISTA DE EMPAQUE".
          - No debe contener precios.
          - Crea una tabla que detalle el contenido del envío. Incluye: Descripción del Producto, Cantidad de Bultos, Tipo de Empaque, Peso Neto, Peso Bruto, y Dimensiones.
          - Asegúrate de que los totales de bultos, peso neto y peso bruto estén claramente visibles.
          - Incluye un pie de página con espacio para firma y sello.

        **Estructura del HTML de Salida:**
        - Incluye \`<!DOCTYPE html>\`, \`<html>\`, \`head\`, y \`body\`.
        - En el \`<head>\`, enlaza a la CDN de Tailwind: \`<script src="https://cdn.tailwindcss.com"></script>\`.
        - Agrega un botón de "Imprimir" en la esquina superior derecha que se oculte al imprimir. El botón debe ejecutar \`window.print()\` al hacer clic.
        - Devuelve únicamente el código HTML completo. No incluyas markdown, explicaciones ni ningún otro texto fuera de la estructura HTML.
    `;
}

// --- Lógica para cada acción ---

const handleGenerateQuotation = async (ai: GoogleGenAI, formData: QuotationFormState): Promise<FullQuotationResponse> => {
    const prompt = buildQuotationPrompt(formData);

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
            temperature: 0.3, // Mantener para respuestas más consistentes y rápidas
        }
    });
    
    const jsonText = response.text.trim();

    if (!jsonText) {
        console.error("La respuesta de la IA estaba vacía.");
        throw new Error("La IA devolvió una respuesta vacía.");
    }
    
    try {
        return JSON.parse(jsonText) as FullQuotationResponse;
    } catch (error) {
        console.error("Error al parsear el JSON de la respuesta de la IA:", error);
        console.error("JSON recibido:", jsonText);
        throw new Error("Se recibió una respuesta malformada de la IA.");
    }
};

const handleGetTariffCode = async (ai: GoogleGenAI, productDescription: string): Promise<string> => {
    const prompt = `
    Actúa como un experto en aduanas de Perú. 
    Basado en la siguiente descripción de producto, proporciona únicamente la partida arancelaria peruana más probable en el formato XXXX.XX.XX.XX.
    No incluyas ninguna explicación, texto adicional, ni markdown. Solo el código.

    Descripción del producto: "${productDescription}"
  `;
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
    });
    
    const code = response.text.trim();
    const tariffCodeRegex = /^\d{4}\.\d{2}\.\d{2}\.\d{2}$/;
    if (!tariffCodeRegex.test(code)) {
        console.error(`Formato de partida arancelaria inválido desde la IA: ${code}`);
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
