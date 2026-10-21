export const STORAGE_KEYS = {
  FIRESTORE_CACHE: 'billzy_firestore_cache',
  LOCAL_PAYMENTS: 'billzy_local_payments',
  MATUAIL_RATE: 'billzy_matuail_rate',
  GYM_PAUSED: 'billzy_gym_paused',
  LANDTAX_RATE_MATUAIL: 'billzy_landtax_rate_matuail',
  LANDTAX_RATE_UTTARKHAN: 'billzy_landtax_rate_uttarkhan',
  LANDTAX_RATE_KESHURBAG: 'billzy_landtax_rate_keshurbag'
} as const;

export const DEFAULT_RATES = {
  MATUAIL_GAS: 1080,
  LANDTAX_MATUAIL: 1500,
  LANDTAX_UTTARKHAN: 2000,
  LANDTAX_KESHURBAG: 850,
  GYM_MONTHLY: 1700,
  INSPIRE_BROADBAND: 840
} as const;
