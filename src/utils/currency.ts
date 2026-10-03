const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export const toBengaliNumerals = (str: string): string => {
  return str.replace(/[0-9]/g, (w) => BENGALI_DIGITS[parseInt(w)]);
};

export const formatBDT = (amount?: number | string | null, locale: 'en' | 'bn' = 'en'): string => {
  const num = typeof amount === 'number' 
    ? (isNaN(amount) ? 0 : amount) 
    : (parseFloat(String(amount ?? '0').replace(/[^0-9.-]/g, '')) || 0);
  const formatted = num.toLocaleString('en-US');
  if (locale === 'bn') {
    return `৳ ${toBengaliNumerals(formatted)}`;
  }
  return `৳ ${formatted}`;
};

export const parseBDT = (str: string): number => {
  const cleanStr = str.replace(/[৳,]/g, '').trim();
  // Handle bengali numbers if typed
  const englishStr = cleanStr.replace(/[০-৯]/g, (w) => BENGALI_DIGITS.indexOf(w).toString());
  return parseFloat(englishStr) || 0;
};
