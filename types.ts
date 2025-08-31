export interface CostBreakdown {
    valorProduccion: number;
    transporteLocal: number;
    gastosAduanaExportacion: number;
    fleteInternacional: number;
    seguro: number;
}

export interface Quotation {
    incoterm: 'EXW' | 'FOB' | 'CIF';
    flete: 'Marítimo' | 'Aéreo' | 'No Aplica';
    costoTotal: number;
    tiempoTransito: string;
    desgloseCostos: CostBreakdown;
}

export interface Recommendations {
    seasonal: string;
    container: string;
    strategy: string;
}

export interface Scenario {
    option: 'Marítimo' | 'Aéreo' | 'Courier';
    rank: number;
    isRecommended: boolean;
    costoEstimado: string;
    tiempoEstimado: string;
    analisisCualitativo: string;
    pros: string[];
    contras: string[];
}

export interface QuotationResultsData {
    quotations: Quotation[];
    recommendations: Recommendations;
    scenarioAnalysis: Scenario[];
}

export interface QuotationFormData {
    product: string;
    tariffCode: string;
    destinationCountry: string;
    quantity: number;
    quantityUnit: string;
    productionValue: number;
    incoterms: string[];
    empresa: string;
    ruc: string;
    direccion: string;
    correo: string;
}

export interface HistoryEntry {
    id: number;
    formData: QuotationFormData;
    result: QuotationResultsData;
}
