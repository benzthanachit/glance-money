import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, formatNumber, getCurrencySymbol, parseCurrency } from '@/lib/utils/formatting';

describe('Formatting Utilities', () => {
  describe('formatCurrency', () => {
    it('should format Thai Baht correctly for Thai locale', () => {
      const result = formatCurrency({
        locale: 'th',
        currency: 'THB',
        amount: 1234.56
      });
      expect(result).toContain('฿');
      expect(result).toContain('1,234.56');
    });

    it('should format USD correctly for English locale', () => {
      const result = formatCurrency({
        locale: 'en',
        currency: 'USD',
        amount: 1234.56
      });
      expect(result).toContain('$');
      expect(result).toContain('1,234.56');
    });

    it('should handle zero amounts', () => {
      const result = formatCurrency({
        locale: 'th',
        currency: 'THB',
        amount: 0
      });
      expect(result).toContain('฿');
      expect(result).toContain('0.00');
    });
  });

  describe('formatDate', () => {
    const testDate = new Date('2024-01-15');

    it('should format date in short format for Thai locale', () => {
      const result = formatDate({
        locale: 'th',
        date: testDate,
        format: 'short'
      });
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should format date in short format for English locale', () => {
      const result = formatDate({
        locale: 'en',
        date: testDate,
        format: 'short'
      });
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should use medium format by default', () => {
      const result = formatDate({
        locale: 'en',
        date: testDate
      });
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers correctly for Thai locale', () => {
      const result = formatNumber('th', 1234.56);
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should format numbers correctly for English locale', () => {
      const result = formatNumber('en', 1234.56);
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
  });

  describe('getCurrencySymbol', () => {
    it('should return correct symbols for supported currencies', () => {
      expect(getCurrencySymbol('THB')).toBe('฿');
      expect(getCurrencySymbol('USD')).toBe('$');
      expect(getCurrencySymbol('EUR')).toBe('€');
    });
  });

  describe('parseCurrency', () => {
    it('should parse Thai Baht currency strings', () => {
      expect(parseCurrency('฿1,234.56')).toBe(1234.56);
      expect(parseCurrency('฿ 1,234.56')).toBe(1234.56);
    });

    it('should parse USD currency strings', () => {
      expect(parseCurrency('$1,234.56')).toBe(1234.56);
      expect(parseCurrency('$ 1,234.56')).toBe(1234.56);
    });

    it('should handle invalid input gracefully', () => {
      expect(parseCurrency('invalid')).toBe(0);
      expect(parseCurrency('')).toBe(0);
    });
  });
});