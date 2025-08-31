import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { TariffCodeAssistant } from './TariffCodeAssistant';

const INCOTERM_OPTIONS = ['EXW', 'FOB', 'CIF'];

const validateTariffCode = (code: string) => {
  const tariffCodeRegex = /^\d{4}\.\d{2}\.\d{2}\.\d{2}$/;
  return tariffCodeRegex.test(code);
};
const validateRUC = (ruc: string) => /^\d{11}$/.test(ruc);
const validateEmail = (email: string) => /^\S+@\S+\.\S+$/.test(email);

// FIX: Define an interface for form errors to provide type safety.
interface FormErrors {
  product?: string;
  tariffCode?: string;
  destinationCountry?: string;
  quantity?: string;
  productionValue?: string;
  empresa?: string;
  ruc?: string;
  direccion?: string;
  correo?: string;
}

export const QuotationForm = ({ onSubmit, initialError }: { onSubmit: (data: any) => void, initialError: string | null }) => {
  const [formData, setFormData] = useState({
    product: 'Palta Hass',
    tariffCode: '0804.40.00.00',
    destinationCountry: 'España',
    quantity: 2,
    quantityUnit: 'toneladas',
    productionValue: 4000,
    incoterms: ['FOB', 'CIF'],
    empresa: '',
    ruc: '',
    direccion: '',
    correo: '',
  });

  // FIX: Type the formErrors state.
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isNumberField = ['quantity', 'productionValue'].includes(name);

    setFormData(prev => ({
      ...prev,
      [name]: isNumberField ? parseFloat(value) || 0 : value,
    }));
    
    const clearError = (fieldName: keyof FormErrors) => {
        setFormErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[fieldName];
            return newErrors;
        });
    };
    
    if (name === 'tariffCode') {
        if (value && !validateTariffCode(value)) {
            setFormErrors(prev => ({ ...prev, tariffCode: 'Formato incorrecto. Debe ser XXXX.XX.XX.XX' }));
        } else { clearError('tariffCode'); }
    } else if (name === 'ruc') {
        if (value && !validateRUC(value)) {
            setFormErrors(prev => ({ ...prev, ruc: 'El RUC debe contener 11 dígitos.' }));
        } else { clearError('ruc'); }
    } else if (name === 'correo') {
        if (value && !validateEmail(value)) {
            setFormErrors(prev => ({ ...prev, correo: 'Formato de correo inválido.' }));
        } else { clearError('correo'); }
    } else if (value.trim()) {
        clearError(name as keyof FormErrors);
    }
  };

  const handleIncotermChange = (incoterm: string) => {
    setFormData(prev => {
        const newIncoterms = prev.incoterms.includes(incoterm)
            ? prev.incoterms.filter(i => i !== incoterm)
            : [...prev.incoterms, incoterm];
        return {...prev, incoterms: newIncoterms };
    });
  }

  const handleTariffCodeFound = (code: string) => {
    setFormData(prev => ({ ...prev, tariffCode: code }));
    setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.tariffCode;
        return newErrors;
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // FIX: Type the errors object.
    const errors: FormErrors = {};
    if (!formData.empresa.trim()) errors.empresa = "El nombre de la empresa es requerido.";
    if (!formData.ruc.trim()) {
        errors.ruc = "El RUC es requerido.";
    } else if (!validateRUC(formData.ruc)) {
        errors.ruc = "El RUC debe contener 11 dígitos.";
    }
    if (!formData.direccion.trim()) errors.direccion = "La dirección es requerida.";
    if (!formData.correo.trim()) {
        errors.correo = "El correo electrónico es requerido.";
    } else if (!validateEmail(formData.correo)) {
        errors.correo = "Formato de correo inválido.";
    }
    if (!validateTariffCode(formData.tariffCode)) {
        errors.tariffCode = 'Formato incorrecto. Debe ser XXXX.XX.XX.XX';
    }

    if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
    }
    
    setFormErrors({});
    onSubmit(formData);
  };

  return (
    <Card>
        <h2 className="text-3xl font-bold text-center text-slate-800 mb-2">Asistente de Cotización IA</h2>
        <p className="text-center text-slate-500 mb-8">Completa los datos para generar una cotización y recibir recomendaciones estratégicas.</p>
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6 border-b border-slate-200 pb-6">
                <h3 className="text-xl font-semibold text-slate-700">Datos del Exportador</h3>
                 <div className="grid md:grid-cols-2 gap-6">
                    <Input label="Empresa" id="empresa" name="empresa" value={formData.empresa} onChange={handleChange} placeholder="Nombre de su empresa" required error={formErrors.empresa} />
                    <Input label="RUC" id="ruc" name="ruc" value={formData.ruc} onChange={handleChange} placeholder="Ej: 20123456789" required error={formErrors.ruc} />
                </div>
                <Input label="Dirección Fiscal" id="direccion" name="direccion" value={formData.direccion} onChange={handleChange} placeholder="Ej: Av. Principal 123, Lima" required error={formErrors.direccion}/>
                <Input label="Correo Electrónico" id="correo" name="correo" type="email" value={formData.correo} onChange={handleChange} placeholder="su.correo@empresa.com" required error={formErrors.correo} />
            </div>

            <div className="space-y-6 pt-2">
                <h3 className="text-xl font-semibold text-slate-700">Detalles del Envío</h3>
                <div className="grid md:grid-cols-2 gap-6">
                    <Input
                        label="Producto a Exportar"
                        id="product"
                        name="product"
                        value={formData.product}
                        onChange={handleChange}
                        placeholder="Ej: Palta Hass, Arándanos"
                        required
                    />
                    <div className="relative">
                       <Input
                            label="Partida Arancelaria"
                            id="tariffCode"
                            name="tariffCode"
                            value={formData.tariffCode}
                            onChange={handleChange}
                            placeholder="Ej: 0804.40.00.00"
                            required
                            error={formErrors.tariffCode}
                        />
                        <div className="absolute top-[38px] right-3 z-10">
                            <TariffCodeAssistant 
                                productName={formData.product}
                                onCodeFound={handleTariffCodeFound}
                            />
                        </div>
                    </div>
                </div>

                <Input
                    label="País de Destino"
                    id="destinationCountry"
                    name="destinationCountry"
                    value={formData.destinationCountry}
                    onChange={handleChange}
                    placeholder="Ej: España, Estados Unidos"
                    required
                />
                
                <div className="grid md:grid-cols-2 gap-6">
                    <Input
                        label="Valor Total de Producción (USD)"
                        id="productionValue"
                        name="productionValue"
                        type="number"
                        value={formData.productionValue.toString()}
                        onChange={handleChange}
                        placeholder="Costo total de la mercancía"
                        required
                        min="0"
                    />
                    <div className="flex items-end gap-2">
                        <div className="flex-grow">
                            <Input
                                label="Cantidad"
                                id="quantity"
                                name="quantity"
                                type="number"
                                value={formData.quantity.toString()}
                                onChange={handleChange}
                                placeholder="Ej: 2"
                                required
                                min="0"
                            />
                        </div>
                        <Select
                            id="quantityUnit"
                            name="quantityUnit"
                            value={formData.quantityUnit}
                            onChange={handleChange}
                            className="w-1/3 h-[50px] mb-1"
                        >
                            <option value="toneladas">Toneladas</option>
                            <option value="kilogramos">Kilogramos</option>
                            <option value="unidades">Unidades</option>
                        </Select>
                    </div>
                </div>
            </div>

            <div>
                <label className="mb-3 text-sm font-medium text-slate-600 block">Incoterms a Cotizar</label>
                <div className="grid grid-cols-3 gap-3">
                    {INCOTERM_OPTIONS.map(incoterm => (
                        <div key={incoterm}>
                            <input
                                type="checkbox"
                                id={`incoterm-${incoterm}`}
                                checked={formData.incoterms.includes(incoterm)}
                                onChange={() => handleIncotermChange(incoterm)}
                                className="hidden peer"
                            />
                            <label
                                htmlFor={`incoterm-${incoterm}`}
                                className="block text-center w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-lg cursor-pointer transition-all duration-200 peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600 hover:bg-slate-200 peer-checked:hover:bg-blue-700"
                            >
                                {incoterm}
                            </label>
                        </div>
                    ))}
                </div>
                {initialError && <p className="text-red-500 text-sm mt-2">{initialError}</p>}
            </div>


            <div className="pt-4">
                <Button type="submit" fullWidth>
                    Generar Cotización Inteligente
                </Button>
            </div>
        </form>
    </Card>
  );
};