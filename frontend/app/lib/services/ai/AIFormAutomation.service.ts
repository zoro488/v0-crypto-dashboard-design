/**
 * AIFormAutomationService - Automatización Inteligente de Formularios
 * Capacidades:
 * - Auto-llenado predictivo basado en patrones
 * - Validación en tiempo real
 * - Aprendizaje continuo de usuarios
 * - Sugerencias contextuales
 */

import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc,
  doc,
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '@/frontend/app/lib/firebase/config';

// Tipos
export interface FormTemplate {
  id: string;
  type: FormType;
  fields: FormField[];
  validations: Record<string, FieldValidation>;
  defaultValues?: Record<string, unknown>;
}

export type FormType = 
  | 'venta' 
  | 'compra' 
  | 'cliente' 
  | 'producto' 
  | 'gasto'
  | 'orden_compra'
  | 'transferencia';

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'phone' | 'select' | 'date' | 'textarea';
  required: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface FieldValidation {
  type: 'email' | 'phone' | 'rfc' | 'number' | 'date' | 'enum' | 'custom';
  pattern?: string;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  enum?: string[];
  customValidator?: (value: unknown) => boolean;
  errorMessage: string;
}

export interface FormSuggestion {
  field: string;
  value: unknown;
  confidence: number;
  reason: string;
}

export interface FormAnalysis {
  suggestions: FormSuggestion[];
  autoFillable: boolean;
  template: FormTemplate;
  confidence: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  suggestions?: string[];
}

export interface UserFormPattern {
  userId: string;
  formType: FormType;
  patterns: Record<string, PatternData>;
  submissions: number;
  lastSubmission: Date;
}

export interface PatternData {
  mostCommon: unknown;
  frequency: number;
  values: unknown[];
}

// Templates de formularios predefinidos
const FORM_TEMPLATES: Record<FormType, Omit<FormTemplate, 'id'>> = {
  venta: {
    type: 'venta',
    fields: [
      { name: 'cliente', label: 'Cliente', type: 'select', required: true },
      { name: 'productos', label: 'Productos', type: 'select', required: true },
      { name: 'cantidad', label: 'Cantidad', type: 'number', required: true },
      { name: 'precioUnitario', label: 'Precio Unitario', type: 'number', required: true },
      { name: 'descuento', label: 'Descuento %', type: 'number', required: false },
      { name: 'metodoPago', label: 'Método de Pago', type: 'select', required: true, options: [
        { value: 'efectivo', label: 'Efectivo' },
        { value: 'transferencia', label: 'Transferencia' },
        { value: 'tarjeta', label: 'Tarjeta' },
        { value: 'credito', label: 'Crédito' }
      ]},
      { name: 'notas', label: 'Notas', type: 'textarea', required: false }
    ],
    validations: {
      cantidad: { type: 'number', min: 1, errorMessage: 'La cantidad debe ser al menos 1' },
      precioUnitario: { type: 'number', min: 0, errorMessage: 'El precio debe ser positivo' },
      descuento: { type: 'number', min: 0, max: 100, errorMessage: 'El descuento debe estar entre 0 y 100%' }
    }
  },
  compra: {
    type: 'compra',
    fields: [
      { name: 'proveedor', label: 'Proveedor', type: 'select', required: true },
      { name: 'productos', label: 'Productos', type: 'select', required: true },
      { name: 'cantidad', label: 'Cantidad', type: 'number', required: true },
      { name: 'costoUnitario', label: 'Costo Unitario', type: 'number', required: true },
      { name: 'metodoPago', label: 'Método de Pago', type: 'select', required: true },
      { name: 'fechaEntrega', label: 'Fecha de Entrega', type: 'date', required: false }
    ],
    validations: {
      cantidad: { type: 'number', min: 1, errorMessage: 'La cantidad debe ser al menos 1' },
      costoUnitario: { type: 'number', min: 0, errorMessage: 'El costo debe ser positivo' }
    }
  },
  cliente: {
    type: 'cliente',
    fields: [
      { name: 'nombre', label: 'Nombre', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: false },
      { name: 'telefono', label: 'Teléfono', type: 'phone', required: true },
      { name: 'rfc', label: 'RFC', type: 'text', required: false },
      { name: 'direccion', label: 'Dirección', type: 'textarea', required: false },
      { name: 'limiteCredito', label: 'Límite de Crédito', type: 'number', required: false }
    ],
    validations: {
      nombre: { type: 'custom', minLength: 2, errorMessage: 'El nombre debe tener al menos 2 caracteres' },
      email: { type: 'email', errorMessage: 'Email inválido' },
      telefono: { type: 'phone', errorMessage: 'Teléfono inválido (10 dígitos)' },
      rfc: { type: 'rfc', errorMessage: 'RFC inválido' }
    }
  },
  producto: {
    type: 'producto',
    fields: [
      { name: 'nombre', label: 'Nombre', type: 'text', required: true },
      { name: 'sku', label: 'SKU', type: 'text', required: true },
      { name: 'categoria', label: 'Categoría', type: 'select', required: true },
      { name: 'costo', label: 'Costo', type: 'number', required: true },
      { name: 'precioVenta', label: 'Precio de Venta', type: 'number', required: true },
      { name: 'stockActual', label: 'Stock Actual', type: 'number', required: true },
      { name: 'stockMinimo', label: 'Stock Mínimo', type: 'number', required: true },
      { name: 'descripcion', label: 'Descripción', type: 'textarea', required: false }
    ],
    validations: {
      nombre: { type: 'custom', minLength: 2, errorMessage: 'El nombre debe tener al menos 2 caracteres' },
      costo: { type: 'number', min: 0, errorMessage: 'El costo debe ser positivo' },
      precioVenta: { type: 'number', min: 0, errorMessage: 'El precio debe ser positivo' },
      stockActual: { type: 'number', min: 0, errorMessage: 'El stock no puede ser negativo' }
    }
  },
  gasto: {
    type: 'gasto',
    fields: [
      { name: 'concepto', label: 'Concepto', type: 'text', required: true },
      { name: 'monto', label: 'Monto', type: 'number', required: true },
      { name: 'categoria', label: 'Categoría', type: 'select', required: true, options: [
        { value: 'operativo', label: 'Operativo' },
        { value: 'nomina', label: 'Nómina' },
        { value: 'servicios', label: 'Servicios' },
        { value: 'otros', label: 'Otros' }
      ]},
      { name: 'banco', label: 'Banco', type: 'select', required: true },
      { name: 'fecha', label: 'Fecha', type: 'date', required: true },
      { name: 'descripcion', label: 'Descripción', type: 'textarea', required: false }
    ],
    validations: {
      concepto: { type: 'custom', minLength: 3, errorMessage: 'El concepto debe tener al menos 3 caracteres' },
      monto: { type: 'number', min: 0.01, errorMessage: 'El monto debe ser mayor a 0' }
    }
  },
  orden_compra: {
    type: 'orden_compra',
    fields: [
      { name: 'proveedor', label: 'Proveedor', type: 'select', required: true },
      { name: 'productos', label: 'Productos', type: 'select', required: true },
      { name: 'fechaEntrega', label: 'Fecha de Entrega', type: 'date', required: true },
      { name: 'notas', label: 'Notas', type: 'textarea', required: false }
    ],
    validations: {}
  },
  transferencia: {
    type: 'transferencia',
    fields: [
      { name: 'bancoOrigen', label: 'Banco Origen', type: 'select', required: true },
      { name: 'bancoDestino', label: 'Banco Destino', type: 'select', required: true },
      { name: 'monto', label: 'Monto', type: 'number', required: true },
      { name: 'concepto', label: 'Concepto', type: 'text', required: true },
      { name: 'referencia', label: 'Referencia', type: 'text', required: false }
    ],
    validations: {
      monto: { type: 'number', min: 0.01, errorMessage: 'El monto debe ser mayor a 0' }
    }
  }
};

export class AIFormAutomationService {
  private readonly patternsCollection = 'form_patterns';
  private readonly submissionsCollection = 'form_submissions';

  /**
   * Analiza un formulario y genera sugerencias de auto-llenado
   */
  async analyzeAndSuggest(
    userId: string, 
    formType: FormType | string, 
    currentData: Record<string, unknown>
  ): Promise<FormAnalysis> {
    // Obtener template del formulario
    const template = this.getFormTemplate(formType as FormType);
    
    // Obtener patrones del usuario
    const userPatterns = await this.getUserPatterns(userId, formType as FormType);
    
    // Generar sugerencias
    const suggestions: FormSuggestion[] = [];
    let totalConfidence = 0;

    if (userPatterns) {
      for (const [field, pattern] of Object.entries(userPatterns.patterns)) {
        // Solo sugerir si no hay valor actual y tenemos datos suficientes
        if (!currentData[field] && pattern.frequency >= 3) {
          const confidence = Math.min(pattern.frequency / 10, 0.95);
          suggestions.push({
            field,
            value: pattern.mostCommon,
            confidence,
            reason: `Valor usado ${pattern.frequency} veces anteriormente`
          });
          totalConfidence += confidence;
        }
      }
    }

    // Detectar relaciones (ej: cliente → método de pago preferido)
    if (currentData.cliente) {
      const clienteSuggestions = await this.getClienteRelatedSuggestions(
        currentData.cliente as string
      );
      suggestions.push(...clienteSuggestions);
    }

    const avgConfidence = suggestions.length > 0 
      ? totalConfidence / suggestions.length 
      : 0;

    return {
      suggestions,
      autoFillable: avgConfidence >= 0.8,
      template,
      confidence: avgConfidence
    };
  }

  /**
   * Obtiene el template de un formulario
   */
  getFormTemplate(formType: FormType): FormTemplate {
    const template = FORM_TEMPLATES[formType];
    if (!template) {
      throw new Error(`Template no encontrado para tipo: ${formType}`);
    }
    return {
      id: formType,
      ...template
    };
  }

  /**
   * Valida un campo individual
   */
  async validateField(
    formType: FormType | string, 
    fieldName: string, 
    value: unknown
  ): Promise<ValidationResult> {
    const template = FORM_TEMPLATES[formType as FormType];
    if (!template) {
      return { valid: true };
    }

    const validation = template.validations[fieldName];
    if (!validation) {
      return { valid: true };
    }

    return this.runValidation(validation, value);
  }

  /**
   * Ejecuta una validación específica
   */
  private runValidation(validation: FieldValidation, value: unknown): ValidationResult {
    if (value === null || value === undefined || value === '') {
      return { valid: true }; // Los campos vacíos se validan como required aparte
    }

    switch (validation.type) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(value))) {
          return { valid: false, error: validation.errorMessage };
        }
        break;

      case 'phone':
        const phoneRegex = /^\d{10}$/;
        const cleanPhone = String(value).replace(/\D/g, '');
        if (!phoneRegex.test(cleanPhone)) {
          return { 
            valid: false, 
            error: validation.errorMessage,
            suggestions: ['Formato: 10 dígitos sin espacios ni guiones']
          };
        }
        break;

      case 'rfc':
        const rfcRegex = /^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/;
        if (!rfcRegex.test(String(value).toUpperCase())) {
          return { 
            valid: false, 
            error: validation.errorMessage,
            suggestions: ['Formato: 3-4 letras + 6 dígitos + 3 caracteres']
          };
        }
        break;

      case 'number':
        const numValue = Number(value);
        if (isNaN(numValue)) {
          return { valid: false, error: 'Debe ser un número válido' };
        }
        if (validation.min !== undefined && numValue < validation.min) {
          return { valid: false, error: validation.errorMessage };
        }
        if (validation.max !== undefined && numValue > validation.max) {
          return { valid: false, error: validation.errorMessage };
        }
        break;

      case 'enum':
        if (validation.enum && !validation.enum.includes(String(value))) {
          return { 
            valid: false, 
            error: validation.errorMessage,
            suggestions: validation.enum
          };
        }
        break;

      case 'custom':
        if (validation.minLength && String(value).length < validation.minLength) {
          return { valid: false, error: validation.errorMessage };
        }
        if (validation.maxLength && String(value).length > validation.maxLength) {
          return { valid: false, error: validation.errorMessage };
        }
        if (validation.customValidator && !validation.customValidator(value)) {
          return { valid: false, error: validation.errorMessage };
        }
        break;
    }

    return { valid: true };
  }

  /**
   * Auto-completa un formulario basado en patrones
   */
  async autoCompleteForm(
    userId: string,
    formType: FormType | string,
    partialData: Record<string, unknown>
  ): Promise<{ success: boolean; completed: Record<string, unknown>; applied: number }> {
    const analysis = await this.analyzeAndSuggest(userId, formType, partialData);
    
    const completed = { ...partialData };
    let applied = 0;

    for (const suggestion of analysis.suggestions) {
      if (suggestion.confidence >= 0.8 && !completed[suggestion.field]) {
        completed[suggestion.field] = suggestion.value;
        applied++;
      }
    }

    return {
      success: applied > 0,
      completed,
      applied
    };
  }

  /**
   * Aprende de un formulario enviado
   */
  async learnFromSubmission(
    userId: string,
    formType: FormType | string,
    formData: Record<string, unknown>
  ): Promise<void> {
    // Guardar el envío
    const submissionsRef = collection(db, this.submissionsCollection);
    await addDoc(submissionsRef, {
      userId,
      formType,
      data: formData,
      submittedAt: Timestamp.now()
    });

    // Actualizar patrones
    const patternsRef = collection(db, this.patternsCollection);
    const q = query(
      patternsRef,
      where('userId', '==', userId),
      where('formType', '==', formType)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // Crear nuevo patrón
      const patterns: Record<string, PatternData> = {};
      for (const [field, value] of Object.entries(formData)) {
        if (value !== null && value !== undefined && value !== '') {
          patterns[field] = {
            mostCommon: value,
            frequency: 1,
            values: [value]
          };
        }
      }

      await addDoc(patternsRef, {
        userId,
        formType,
        patterns,
        submissions: 1,
        lastSubmission: Timestamp.now()
      });
    } else {
      // Actualizar patrón existente
      const patternDoc = snapshot.docs[0];
      const existingPattern = patternDoc.data() as UserFormPattern;
      
      const updatedPatterns = { ...existingPattern.patterns };

      for (const [field, value] of Object.entries(formData)) {
        if (value !== null && value !== undefined && value !== '') {
          if (updatedPatterns[field]) {
            const pattern = updatedPatterns[field];
            const newValues = [...pattern.values, value].slice(-50); // Mantener últimos 50
            
            // Calcular valor más común
            const valueCount: Record<string, number> = {};
            newValues.forEach(v => {
              const key = JSON.stringify(v);
              valueCount[key] = (valueCount[key] || 0) + 1;
            });
            
            let mostCommon = pattern.mostCommon;
            let maxCount = 0;
            for (const [key, count] of Object.entries(valueCount)) {
              if (count > maxCount) {
                maxCount = count;
                mostCommon = JSON.parse(key);
              }
            }

            updatedPatterns[field] = {
              mostCommon,
              frequency: pattern.frequency + 1,
              values: newValues
            };
          } else {
            updatedPatterns[field] = {
              mostCommon: value,
              frequency: 1,
              values: [value]
            };
          }
        }
      }

      await updateDoc(patternDoc.ref, {
        patterns: updatedPatterns,
        submissions: existingPattern.submissions + 1,
        lastSubmission: Timestamp.now()
      });
    }
  }

  /**
   * Obtiene estadísticas de uso de formularios
   */
  async getFormStats(userId: string, formType?: FormType): Promise<{
    submissions: number;
    topFields: { field: string; frequency: number }[];
    lastSubmission?: Date;
  }> {
    const patternsRef = collection(db, this.patternsCollection);
    let q = query(patternsRef, where('userId', '==', userId));
    
    if (formType) {
      q = query(q, where('formType', '==', formType));
    }

    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { submissions: 0, topFields: [] };
    }

    let totalSubmissions = 0;
    const fieldFrequencies: Record<string, number> = {};
    let lastSubmission: Date | undefined;

    snapshot.docs.forEach(doc => {
      const data = doc.data() as UserFormPattern;
      totalSubmissions += data.submissions;
      
      for (const [field, pattern] of Object.entries(data.patterns)) {
        fieldFrequencies[field] = (fieldFrequencies[field] || 0) + pattern.frequency;
      }

      const docLastSubmission = data.lastSubmission instanceof Timestamp 
        ? data.lastSubmission.toDate() 
        : data.lastSubmission;
      
      if (!lastSubmission || docLastSubmission > lastSubmission) {
        lastSubmission = docLastSubmission;
      }
    });

    const topFields = Object.entries(fieldFrequencies)
      .map(([field, frequency]) => ({ field, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    return {
      submissions: totalSubmissions,
      topFields,
      lastSubmission
    };
  }

  /**
   * Obtiene patrones de usuario para un tipo de formulario
   */
  private async getUserPatterns(userId: string, formType: FormType): Promise<UserFormPattern | null> {
    const patternsRef = collection(db, this.patternsCollection);
    const q = query(
      patternsRef,
      where('userId', '==', userId),
      where('formType', '==', formType)
    );

    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data() as UserFormPattern;
  }

  /**
   * Obtiene sugerencias basadas en relaciones con cliente
   */
  private async getClienteRelatedSuggestions(clienteId: string): Promise<FormSuggestion[]> {
    const suggestions: FormSuggestion[] = [];

    try {
      // Buscar ventas anteriores al cliente
      const ventasRef = collection(db, 'ventas');
      const q = query(
        ventasRef,
        where('clienteId', '==', clienteId),
        orderBy('fecha', 'desc'),
        limit(10)
      );

      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        // Analizar métodos de pago más usados
        const metodoPagoCounts: Record<string, number> = {};
        snapshot.docs.forEach(doc => {
          const metodoPago = doc.data().metodoPago;
          if (metodoPago) {
            metodoPagoCounts[metodoPago] = (metodoPagoCounts[metodoPago] || 0) + 1;
          }
        });

        const topMetodoPago = Object.entries(metodoPagoCounts)
          .sort((a, b) => b[1] - a[1])[0];

        if (topMetodoPago && topMetodoPago[1] >= 3) {
          suggestions.push({
            field: 'metodoPago',
            value: topMetodoPago[0],
            confidence: Math.min(topMetodoPago[1] / 10, 0.9),
            reason: `Método de pago preferido del cliente (${topMetodoPago[1]} veces)`
          });
        }
      }
    } catch (error) {
      // Ignorar errores de consulta
      console.warn('Error obteniendo sugerencias de cliente:', error);
    }

    return suggestions;
  }

  /**
   * Valida un formulario completo
   */
  async validateForm(
    formType: FormType,
    formData: Record<string, unknown>
  ): Promise<{ valid: boolean; errors: Record<string, string> }> {
    const template = FORM_TEMPLATES[formType];
    if (!template) {
      return { valid: true, errors: {} };
    }

    const errors: Record<string, string> = {};

    // Validar campos requeridos
    for (const field of template.fields) {
      const value = formData[field.name];
      
      if (field.required && (value === null || value === undefined || value === '')) {
        errors[field.name] = `${field.label} es requerido`;
        continue;
      }

      // Validar formato si hay validación configurada
      const validation = template.validations[field.name];
      if (validation && value) {
        const result = this.runValidation(validation, value);
        if (!result.valid && result.error) {
          errors[field.name] = result.error;
        }
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }
}
