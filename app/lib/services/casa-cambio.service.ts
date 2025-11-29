/**
 * Servicio de APIs de Casa de Cambio
 * Integra Banxico API para tipos de cambio USD/MXN
 */

import axios from 'axios';

// Configuración Banxico
const BANXICO_API_URL = 'https://www.banxico.org.mx/SieAPIRest/service/v1';
const BANXICO_SERIES = {
  USD_MXN_FIX: 'SF43718', // Tipo de cambio FIX
  USD_MXN_SPOT: 'SF46410', // Tipo de cambio Spot
};

interface ExchangeRate {
  date: string;
  value: number;
}

interface BanxicoResponse {
  bmx: {
    series: Array<{
      idSerie: string;
      titulo: string;
      datos: Array<{
        fecha: string;
        dato: string;
      }>;
    }>;
  };
}

interface TechnicalIndicators {
  rsi: number;
  macd: {
    value: number;
    signal: number;
    histogram: number;
  };
  bollinger: {
    upper: number;
    middle: number;
    lower: number;
  };
}

class CasaCambioService {
  private banxicoToken: string | null = null;

  /**
   * Configurar token de Banxico
   */
  setToken(token: string) {
    this.banxicoToken = token;
  }

  /**
   * Obtener tipo de cambio actual de Banxico
   */
  async getCurrentRate(): Promise<number> {
    try {
      const headers = this.banxicoToken
        ? { 'Bmx-Token': this.banxicoToken }
        : {};

      const response = await axios.get<BanxicoResponse>(
        `${BANXICO_API_URL}/series/${BANXICO_SERIES.USD_MXN_FIX}/datos/oportuno`,
        { headers }
      );

      const latestData = response.data.bmx.series[0].datos[0];
      return parseFloat(latestData.dato);
    } catch (error) {
      console.error('Error fetching Banxico rate:', error);
      // Fallback a API alternativa
      return this.getFallbackRate();
    }
  }

  /**
   * API alternativa si Banxico falla
   */
  private async getFallbackRate(): Promise<number> {
    try {
      const response = await axios.get(
        'https://api.exchangerate-api.com/v4/latest/USD'
      );
      return response.data.rates.MXN;
    } catch (error) {
      console.error('Error fetching fallback rate:', error);
      return 17.5; // Valor por defecto
    }
  }

  /**
   * Obtener historial de tipos de cambio
   */
  async getHistoricalRates(days: number = 30): Promise<ExchangeRate[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const formatDate = (date: Date) =>
        date.toISOString().split('T')[0].replace(/-/g, '/');

      const headers = this.banxicoToken
        ? { 'Bmx-Token': this.banxicoToken }
        : {};

      const response = await axios.get<BanxicoResponse>(
        `${BANXICO_API_URL}/series/${BANXICO_SERIES.USD_MXN_FIX}/datos/${formatDate(startDate)}/${formatDate(endDate)}`,
        { headers }
      );

      return response.data.bmx.series[0].datos.map((item) => ({
        date: item.fecha,
        value: parseFloat(item.dato),
      })).reverse();
    } catch (error) {
      console.error('Error fetching historical rates:', error);
      // Generar datos mock si falla
      return this.generateMockHistoricalData(days);
    }
  }

  /**
   * Generar datos históricos mock para desarrollo
   */
  private generateMockHistoricalData(days: number): ExchangeRate[] {
    const data: ExchangeRate[] = [];
    const baseRate = 17.5;
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Variación aleatoria ±0.5 MXN
      const variation = (Math.random() - 0.5) * 1;
      const value = baseRate + variation;

      data.push({
        date: date.toISOString().split('T')[0],
        value: parseFloat(value.toFixed(4)),
      });
    }

    return data;
  }

  /**
   * Calcular spread óptimo basado en volatilidad
   */
  calculateOptimalSpread(historicalRates: ExchangeRate[]): {
    buy: number;
    sell: number;
    spread: number;
  } {
    if (historicalRates.length === 0) {
      return { buy: 0, sell: 0, spread: 0 };
    }

    // Calcular volatilidad (desviación estándar)
    const values = historicalRates.map((r) => r.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      values.length;
    const stdDev = Math.sqrt(variance);

    // Spread base: 2% + factor de volatilidad
    const volatilityFactor = (stdDev / mean) * 100;
    const baseSpread = 0.02;
    const volatilityAdjustment = volatilityFactor * 0.001;
    const totalSpread = baseSpread + volatilityAdjustment;

    const currentRate = values[values.length - 1];
    const buy = currentRate * (1 - totalSpread / 2);
    const sell = currentRate * (1 + totalSpread / 2);

    return {
      buy: parseFloat(buy.toFixed(4)),
      sell: parseFloat(sell.toFixed(4)),
      spread: parseFloat((totalSpread * 100).toFixed(2)),
    };
  }

  /**
   * Calcular indicadores técnicos
   */
  calculateTechnicalIndicators(
    historicalRates: ExchangeRate[]
  ): TechnicalIndicators {
    const prices = historicalRates.map((r) => r.value);

    return {
      rsi: this.calculateRSI(prices, 14),
      macd: this.calculateMACD(prices),
      bollinger: this.calculateBollingerBands(prices, 20, 2),
    };
  }

  /**
   * RSI (Relative Strength Index)
   */
  private calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);

    return parseFloat(rsi.toFixed(2));
  }

  /**
   * MACD (Moving Average Convergence Divergence)
   */
  private calculateMACD(prices: number[]): {
    value: number;
    signal: number;
    histogram: number;
  } {
    if (prices.length < 26) {
      return { value: 0, signal: 0, histogram: 0 };
    }

    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macdLine = ema12 - ema26;

    // Señal EMA de 9 períodos sobre MACD
    const macdHistory = [macdLine]; // Simplificado
    const signal = this.calculateEMA(macdHistory, 9);
    const histogram = macdLine - signal;

    return {
      value: parseFloat(macdLine.toFixed(4)),
      signal: parseFloat(signal.toFixed(4)),
      histogram: parseFloat(histogram.toFixed(4)),
    };
  }

  /**
   * EMA (Exponential Moving Average)
   */
  private calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1];

    const k = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

    for (let i = period; i < prices.length; i++) {
      ema = prices[i] * k + ema * (1 - k);
    }

    return ema;
  }

  /**
   * Bollinger Bands
   */
  private calculateBollingerBands(
    prices: number[],
    period: number = 20,
    stdDevMultiplier: number = 2
  ): { upper: number; middle: number; lower: number } {
    if (prices.length < period) {
      const lastPrice = prices[prices.length - 1];
      return { upper: lastPrice, middle: lastPrice, lower: lastPrice };
    }

    const recentPrices = prices.slice(-period);
    const middle =
      recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;

    const variance =
      recentPrices.reduce((sum, val) => sum + Math.pow(val - middle, 2), 0) /
      recentPrices.length;
    const stdDev = Math.sqrt(variance);

    const upper = middle + stdDev * stdDevMultiplier;
    const lower = middle - stdDev * stdDevMultiplier;

    return {
      upper: parseFloat(upper.toFixed(4)),
      middle: parseFloat(middle.toFixed(4)),
      lower: parseFloat(lower.toFixed(4)),
    };
  }

  /**
   * Detectar alertas de volatilidad
   */
  detectVolatilityAlerts(
    indicators: TechnicalIndicators,
    currentRate: number
  ): Array<{ type: 'warning' | 'danger' | 'info'; message: string }> {
    const alerts: Array<{ type: 'warning' | 'danger' | 'info'; message: string }> = [];

    // RSI extremos
    if (indicators.rsi > 70) {
      alerts.push({
        type: 'warning',
        message: `RSI sobrecomprado (${indicators.rsi}) - posible corrección`,
      });
    } else if (indicators.rsi < 30) {
      alerts.push({
        type: 'info',
        message: `RSI sobrevendido (${indicators.rsi}) - oportunidad de compra`,
      });
    }

    // MACD crossover
    if (Math.abs(indicators.macd.histogram) > 0.1) {
      const direction = indicators.macd.histogram > 0 ? 'alcista' : 'bajista';
      alerts.push({
        type: 'info',
        message: `MACD señal ${direction}`,
      });
    }

    // Bollinger Bands
    if (currentRate > indicators.bollinger.upper) {
      alerts.push({
        type: 'danger',
        message: 'Precio por encima de banda superior - alta volatilidad',
      });
    } else if (currentRate < indicators.bollinger.lower) {
      alerts.push({
        type: 'danger',
        message: 'Precio por debajo de banda inferior - alta volatilidad',
      });
    }

    return alerts;
  }
}

export const casaCambioService = new CasaCambioService();
export default casaCambioService;
