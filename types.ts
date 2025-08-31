export interface CostBreakdown {
  valorProduccion: number;
  transporteLocal: number;
  gastosAduanaExportacion: number;
  fleteInternacional: number;
  seguro: number;
}

export type Incoterm = 'EXW' | 'FOB' | 'CIF';
export type FreightType = 'Marítimo' | 'Aéreo' | 'No Aplica';
export type ScenarioOption = 'Marítimo' | 'Aéreo' | 'Courier';

export interface Quotation {
  incoterm: Incoterm;
  flete: FreightType;
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
  option: ScenarioOption;
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

export interface FormData {
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
