
export type Incoterm = 'EXW' | 'FOB' | 'CIF';
export type DocumentType = 'commercialInvoice' | 'packingList';

export interface QuotationFormState {
  product: string;
  tariffCode: string;
  destinationCountry: string;
  quantity: number;
  quantityUnit: 'toneladas' | 'kilogramos' | 'unidades';
  productionValue: number;
  incoterms: Incoterm[];
  empresa: string;
  ruc: string;
  direccion: string;
  correo: string;
}

export interface CostBreakdown {
  valorProduccion: number;
  transporteLocal: number;
  gastosAduanaExportacion: number;
  fleteInternacional: number;
  seguro: number;
}

export interface QuotationResult {
  incoterm: Incoterm;
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

export interface FullQuotationResponse {
  quotations: QuotationResult[];
  recommendations: Recommendations;
  scenarioAnalysis: Scenario[];
}

export interface HistoryEntry {
  id: number; // Using timestamp as a unique ID
  formData: QuotationFormState;
  result: FullQuotationResponse;
}

// --- Document Generation Types ---

export interface ImporterDetails {
    companyName: string;
    taxId: string;
    address: string;
}

export interface PackagingDetails {
    packageCount: number;
    packageType: string;
    netWeightKg: number;
    grossWeightKg: number;
    dimensions: string; // e.g., "120x100x110 cm per pallet"
}

export interface DocumentGenerationData {
    exporter: QuotationFormState;
    importer: ImporterDetails;
    shipment: {
        invoiceNumber: string;
        issueDate: string;
        incoterm: Incoterm;
        totalValue: number;
        freightType: 'Marítimo' | 'Aéreo' | 'No Aplica';
    };
    packaging: PackagingDetails;
}
