/**
 * Formatters - Utilidades de formateo para Chronos
 * Formatos de moneda, fechas, números y textos
 */

// ============================================
// FORMATEO DE MONEDA
// ============================================

/**
 * Formatear cantidad como moneda mexicana (MXN)
 */
export function formatCurrency(
  amount: number,
  options?: {
    currency?: 'MXN' | 'USD';
    decimals?: number;
    compact?: boolean;
  }
): string {
  const { currency = 'MXN', decimals = 2, compact = false } = options || {};

  if (compact && Math.abs(amount) >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }

  if (compact && Math.abs(amount) >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }

  const formatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return formatter.format(amount);
}

/**
 * Formatear como pesos mexicanos
 */
export function formatMXN(amount: number): string {
  return formatCurrency(amount, { currency: 'MXN' });
}

/**
 * Formatear como dólares americanos
 */
export function formatUSD(amount: number): string {
  return formatCurrency(amount, { currency: 'USD' });
}

/**
 * Formatear cantidad compacta (1K, 1M, etc.)
 */
export function formatCompact(amount: number): string {
  return formatCurrency(amount, { compact: true });
}

/**
 * Parsear string de moneda a número
 */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[$,\s]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// ============================================
// FORMATEO DE NÚMEROS
// ============================================

/**
 * Formatear número con separadores de miles
 */
export function formatNumber(
  value: number,
  options?: {
    decimals?: number;
    locale?: string;
  }
): string {
  const { decimals = 0, locale = 'es-MX' } = options || {};
  
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Formatear porcentaje
 */
export function formatPercent(
  value: number,
  options?: {
    decimals?: number;
    showSign?: boolean;
  }
): string {
  const { decimals = 1, showSign = false } = options || {};
  
  const formatted = new Intl.NumberFormat('es-MX', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);

  if (showSign && value > 0) {
    return `+${formatted}`;
  }

  return formatted;
}

/**
 * Formatear cambio/variación con color
 */
export function formatChange(value: number): {
  text: string;
  color: string;
  icon: '↑' | '↓' | '→';
} {
  if (value > 0) {
    return {
      text: `+${formatPercent(value)}`,
      color: 'text-green-500',
      icon: '↑',
    };
  } else if (value < 0) {
    return {
      text: formatPercent(value),
      color: 'text-red-500',
      icon: '↓',
    };
  }
  return {
    text: '0%',
    color: 'text-gray-500',
    icon: '→',
  };
}

/**
 * Formatear cantidad con unidades
 */
export function formatQuantity(
  value: number,
  unit: string,
  options?: { plural?: string }
): string {
  const { plural = `${unit}s` } = options || {};
  const formattedValue = formatNumber(value);
  return `${formattedValue} ${value === 1 ? unit : plural}`;
}

// ============================================
// FORMATEO DE FECHAS
// ============================================

/**
 * Formatear fecha completa
 */
export function formatDate(
  date: Date | string | number,
  options?: {
    format?: 'short' | 'medium' | 'long' | 'full';
    includeTime?: boolean;
  }
): string {
  const { format = 'medium', includeTime = false } = options || {};
  const d = new Date(date);

  if (isNaN(d.getTime())) {
    return 'Fecha inválida';
  }

  const dateOptions: Intl.DateTimeFormatOptions = {
    short: { day: '2-digit', month: '2-digit', year: '2-digit' },
    medium: { day: 'numeric', month: 'short', year: 'numeric' },
    long: { day: 'numeric', month: 'long', year: 'numeric' },
    full: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
  }[format];

  if (includeTime) {
    dateOptions.hour = '2-digit';
    dateOptions.minute = '2-digit';
  }

  return new Intl.DateTimeFormat('es-MX', dateOptions).format(d);
}

/**
 * Formatear solo hora
 */
export function formatTime(
  date: Date | string | number,
  options?: { seconds?: boolean }
): string {
  const { seconds = false } = options || {};
  const d = new Date(date);

  if (isNaN(d.getTime())) {
    return '--:--';
  }

  return new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: seconds ? '2-digit' : undefined,
  }).format(d);
}

/**
 * Formatear fecha relativa (hace 2 horas, mañana, etc.)
 */
export function formatRelativeTime(date: Date | string | number): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  const rtf = new Intl.RelativeTimeFormat('es-MX', { numeric: 'auto' });

  if (Math.abs(diffSecs) < 60) {
    return rtf.format(Math.floor(diffSecs), 'second');
  } else if (Math.abs(diffMins) < 60) {
    return rtf.format(diffMins, 'minute');
  } else if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, 'hour');
  } else if (Math.abs(diffDays) < 7) {
    return rtf.format(diffDays, 'day');
  } else if (Math.abs(diffDays) < 30) {
    return rtf.format(Math.floor(diffDays / 7), 'week');
  } else if (Math.abs(diffDays) < 365) {
    return rtf.format(Math.floor(diffDays / 30), 'month');
  } else {
    return rtf.format(Math.floor(diffDays / 365), 'year');
  }
}

/**
 * Formatear duración en formato legible
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
}

/**
 * Formatear rango de fechas
 */
export function formatDateRange(start: Date, end: Date): string {
  const sameDay = start.toDateString() === end.toDateString();
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const sameYear = start.getFullYear() === end.getFullYear();

  if (sameDay) {
    return `${formatDate(start)} ${formatTime(start)} - ${formatTime(end)}`;
  } else if (sameMonth) {
    return `${start.getDate()} - ${formatDate(end)}`;
  } else if (sameYear) {
    return `${formatDate(start, { format: 'short' })} - ${formatDate(end, { format: 'short' })}`;
  } else {
    return `${formatDate(start, { format: 'short' })} - ${formatDate(end, { format: 'short' })}`;
  }
}

// ============================================
// FORMATEO DE TEXTO
// ============================================

/**
 * Capitalizar primera letra
 */
export function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Capitalizar cada palabra
 */
export function titleCase(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Truncar texto con ellipsis
 */
export function truncate(
  text: string,
  maxLength: number,
  options?: { ellipsis?: string; wordBoundary?: boolean }
): string {
  const { ellipsis = '...', wordBoundary = true } = options || {};
  
  if (!text || text.length <= maxLength) {
    return text;
  }

  let truncated = text.slice(0, maxLength - ellipsis.length);
  
  if (wordBoundary) {
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 0) {
      truncated = truncated.slice(0, lastSpace);
    }
  }

  return truncated + ellipsis;
}

/**
 * Formatear nombre de persona
 */
export function formatName(
  firstName?: string,
  lastName?: string,
  options?: { format?: 'full' | 'initials' | 'short' }
): string {
  const { format = 'full' } = options || {};
  
  const first = firstName?.trim() || '';
  const last = lastName?.trim() || '';

  switch (format) {
    case 'initials':
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
    case 'short':
      return `${first} ${last.charAt(0)}.`;
    default:
      return `${first} ${last}`.trim();
  }
}

/**
 * Formatear número de teléfono mexicano
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 12 && cleaned.startsWith('52')) {
    return `+52 (${cleaned.slice(2, 5)}) ${cleaned.slice(5, 8)}-${cleaned.slice(8)}`;
  }
  
  return phone;
}

/**
 * Formatear estado/badge
 */
export function formatStatus(status: string): {
  label: string;
  color: string;
  bgColor: string;
} {
  const statuses: Record<string, { label: string; color: string; bgColor: string }> = {
    pendiente: { label: 'Pendiente', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
    activo: { label: 'Activo', color: 'text-green-500', bgColor: 'bg-green-500/10' },
    pagado: { label: 'Pagado', color: 'text-green-500', bgColor: 'bg-green-500/10' },
    pagada: { label: 'Pagada', color: 'text-green-500', bgColor: 'bg-green-500/10' },
    cancelado: { label: 'Cancelado', color: 'text-red-500', bgColor: 'bg-red-500/10' },
    cancelada: { label: 'Cancelada', color: 'text-red-500', bgColor: 'bg-red-500/10' },
    completado: { label: 'Completado', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    completada: { label: 'Completada', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    procesando: { label: 'Procesando', color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
    enviado: { label: 'Enviado', color: 'text-cyan-500', bgColor: 'bg-cyan-500/10' },
    entregado: { label: 'Entregado', color: 'text-green-500', bgColor: 'bg-green-500/10' },
    vencido: { label: 'Vencido', color: 'text-red-500', bgColor: 'bg-red-500/10' },
  };

  const normalized = status.toLowerCase();
  return statuses[normalized] || {
    label: capitalize(status),
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10',
  };
}

// ============================================
// FORMATEO DE ARCHIVOS Y BYTES
// ============================================

/**
 * Formatear tamaño de archivo
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let unitIndex = 0;
  let size = bytes;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

// ============================================
// UTILIDADES DE LISTA
// ============================================

/**
 * Formatear lista con conjunción
 */
export function formatList(
  items: string[],
  options?: { conjunction?: string; limit?: number }
): string {
  const { conjunction = 'y', limit } = options || {};
  
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  
  let displayItems = items;
  let overflow = 0;

  if (limit && items.length > limit) {
    displayItems = items.slice(0, limit);
    overflow = items.length - limit;
  }

  if (displayItems.length === 2) {
    return `${displayItems[0]} ${conjunction} ${displayItems[1]}${overflow ? ` (+${overflow} más)` : ''}`;
  }

  const last = displayItems.pop();
  return `${displayItems.join(', ')} ${conjunction} ${last}${overflow ? ` (+${overflow} más)` : ''}`;
}

// ============================================
// EXPORTACIONES AGRUPADAS
// ============================================

export const currency = {
  format: formatCurrency,
  mxn: formatMXN,
  usd: formatUSD,
  compact: formatCompact,
  parse: parseCurrency,
};

export const number = {
  format: formatNumber,
  percent: formatPercent,
  change: formatChange,
  quantity: formatQuantity,
};

export const date = {
  format: formatDate,
  time: formatTime,
  relative: formatRelativeTime,
  duration: formatDuration,
  range: formatDateRange,
};

export const text = {
  capitalize,
  titleCase,
  truncate,
  name: formatName,
  phone: formatPhone,
  status: formatStatus,
  list: formatList,
};

export const file = {
  size: formatFileSize,
};

export default {
  currency,
  number,
  date,
  text,
  file,
};
