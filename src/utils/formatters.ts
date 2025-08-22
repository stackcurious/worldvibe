// src/utils/formatters.ts
export class Formatter {
    static formatNumber(num: number, options: Intl.NumberFormatOptions = {}): string {
      return new Intl.NumberFormat('en-US', options).format(num);
    }
  
    static formatPercentage(value: number, decimals: number = 1): string {
      return `${value.toFixed(decimals)}%`;
    }
  
    static formatIntensity(intensity: number): string {
      const labels = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];
      return labels[intensity - 1] || 'Unknown';
    }
  
    static truncateText(text: string, length: number = 100): string {
      return text.length > length ? `${text.slice(0, length)}...` : text;
    }
  }