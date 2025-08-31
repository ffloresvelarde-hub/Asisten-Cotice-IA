import type { QuotationFormState, FullQuotationResponse, QuotationResult, Incoterm, Scenario, DocumentGenerationData, DocumentType } from '../types';

/**
 * Llama al proxy seguro de Netlify para interactuar con la API de Gemini.
 * @param action La acción a realizar (e.g., 'generateQuotation').
 * @param payload Los datos necesarios para la acción.
 * @returns La respuesta de la API.
 */
async function callGeminiProxy(action: string, payload: unknown): Promise<any> {
  try {
    const response = await fetch('/.netlify/functions/geminiProxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, payload }),
    });

    if (!response.ok) {
      let errorMessage = `Error en el servidor: ${response.status} ${response.statusText}`;
      try {
        const errorBody = await response.json();
        errorMessage = errorBody.error || errorMessage;
      } catch (e) {
        // El cuerpo no era JSON, lo que puede ocurrir con timeouts (504) o errores de gateway (502).
        // El mensaje de estado es suficiente para el usuario en este caso.
        console.error("La respuesta de error del servidor no era JSON. Status:", response.status);
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error al llamar a la función proxy de Netlify para la acción '${action}':`, error);
    throw error;
  }
}


export const generateQuotation = async (formData: QuotationFormState): Promise<FullQuotationResponse> => {
  try {
    const parsedResponse = await callGeminiProxy('generateQuotation', { formData }) as FullQuotationResponse;

    // Sort to ensure a consistent order: EXW, FOB, CIF and then by freight type
    const incotermOrder: Record<Incoterm, number> = { 'EXW': 1, 'FOB': 2, 'CIF': 3 };
    const fleteOrder = { 'Marítimo': 1, 'Aéreo': 2, 'No Aplica': 0 };

    parsedResponse.quotations.sort((a: QuotationResult, b: QuotationResult) => {
        const incotermDiff = incotermOrder[a.incoterm] - incotermOrder[b.incoterm];
        if (incotermDiff !== 0) return incotermDiff;
        return fleteOrder[a.flete] - fleteOrder[b.flete];
    });

    if (parsedResponse.scenarioAnalysis) {
        parsedResponse.scenarioAnalysis.sort((a: Scenario, b: Scenario) => a.rank - b.rank);
    }

    return parsedResponse;

  } catch (error) {
    console.error("Error en generateQuotation:", error);
    throw new Error("No se pudo generar la cotización desde el servicio de IA.");
  }
};

export const getTariffCodeForProduct = async (productDescription: string): Promise<string> => {
   try {
    const { code } = await callGeminiProxy('getTariffCode', { productDescription });
    return code;
  } catch (error) {
    console.error("Error en getTariffCodeForProduct:", error);
    throw new Error("No se pudo obtener la partida arancelaria.");
  }
};


export const generateDocumentHtml = async (
    documentType: DocumentType,
    data: DocumentGenerationData
): Promise<string> => {
    const documentTitle = documentType === 'commercialInvoice' ? 'Factura Comercial' : 'Packing List';
    try {
        const { html } = await callGeminiProxy('generateDocument', { documentType, data });
        return html;
    } catch (error) {
        console.error("Error en generateDocumentHtml:", error);
        throw new Error(`No se pudo generar el documento: ${documentTitle}.`);
    }
};