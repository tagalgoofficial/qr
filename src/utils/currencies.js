// Supported currencies in the system
export const CURRENCIES = {
  EGP: {
    code: 'EGP',
    name: 'Egyptian Pound',
    nameAr: 'جنية مصري',
    symbol: 'EGP',
    symbolAr: 'ج.م',
    decimalPlaces: 2,
    isDefault: true
  },
  SAR: {
    code: 'SAR',
    name: 'Saudi Riyal',
    nameAr: 'ريال سعودي',
    symbol: 'SAR',
    symbolAr: 'ر.س',
    decimalPlaces: 2,
    isDefault: false
  },
  USD: {
    code: 'USD',
    name: 'US Dollar',
    nameAr: 'دولار أمريكي',
    symbol: '$',
    symbolAr: '$',
    decimalPlaces: 2,
    isDefault: false
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    nameAr: 'يورو',
    symbol: '€',
    symbolAr: '€',
    decimalPlaces: 2,
    isDefault: false
  },
  AED: {
    code: 'AED',
    name: 'UAE Dirham',
    nameAr: 'درهم إماراتي',
    symbol: 'AED',
    symbolAr: 'د.إ',
    decimalPlaces: 2,
    isDefault: false
  }
};

// Get currency by code
export const getCurrency = (code) => {
  return CURRENCIES[code] || CURRENCIES.EGP;
};

// Get default currency
export const getDefaultCurrency = () => {
  return CURRENCIES.EGP;
};

// Format price with currency
export const formatPrice = (price, currencyCode = 'EGP', language = 'ar') => {
  const currency = getCurrency(currencyCode);
  const formattedPrice = parseFloat(price).toFixed(currency.decimalPlaces);
  
  if (language === 'ar') {
    return `${formattedPrice} ${currency.symbolAr}`;
  } else {
    return `${currency.symbol}${formattedPrice}`;
  }
};

// Get all currencies as array
export const getAllCurrencies = () => {
  return Object.values(CURRENCIES);
};

// Get currency options for select
export const getCurrencyOptions = (language = 'ar') => {
  return Object.values(CURRENCIES).map(currency => ({
    value: currency.code,
    label: language === 'ar' ? currency.nameAr : currency.name
  }));
};
