import { BillId, BillType, UtilityCategory } from './payment';

export interface UtilityDefinition {
  id: BillId;
  name: string;
  utility: UtilityCategory;
  account: string;
  type: BillType;
  portalUrl?: string;
  portalLabel?: string;
  location?: string;
  formType: 'prepaid' | 'postpaid' | 'gym' | 'landTax';
  defaultRate?: number;
  meterNumber?: string;
}

export const BILL_DEFINITIONS: Record<BillId, UtilityDefinition> = {
  rupnagarDesco: {
    id: 'rupnagarDesco',
    name: 'Rupnagar DESCO',
    utility: 'electric',
    account: '140-10-368',
    type: 'prepaid',
    portalUrl: 'https://prepaid.desco.org.bd/',
    portalLabel: 'Open DESCO Portal ↗',
    location: 'Mirpur, Dhaka',
    formType: 'prepaid',
    meterNumber: '140-10-368'
  },
  rupnagarGas: {
    id: 'rupnagarGas',
    name: 'Rupnagar Gas',
    utility: 'gas',
    account: '110-407-082-016',
    type: 'prepaid',
    portalUrl: 'https://pgcl.org.bd/',
    portalLabel: 'Open Gas Portal ↗',
    location: 'Rupnagar, Dhaka',
    formType: 'prepaid',
    meterNumber: '9840-02-14'
  },
  uttaraDesco: {
    id: 'uttaraDesco',
    name: 'Uttara DESCO',
    utility: 'electric',
    account: '250-38-654',
    type: 'prepaid',
    portalUrl: 'https://prepaid.desco.org.bd/',
    portalLabel: 'Open DESCO Portal ↗',
    location: 'Uttara Sector 4, Dhaka',
    formType: 'prepaid',
    meterNumber: '3801-9924-11'
  },
  uttaraWater: {
    id: 'uttaraWater',
    name: 'Uttara Water',
    utility: 'water',
    account: '0901798991',
    type: 'postpaid',
    portalUrl: 'https://dwasa.org.bd/',
    portalLabel: 'Open WASA Portal ↗',
    location: 'Uttara, Dhaka',
    formType: 'postpaid',
    meterNumber: 'WASA-UT-884'
  },
  matuailGas: {
    id: 'matuailGas',
    name: 'Matuail Gas',
    utility: 'gas',
    account: '108-26-719',
    type: 'postpaid',
    portalUrl: 'https://titasgas.org.bd/',
    portalLabel: 'Open Gas Portal ↗',
    location: 'Matuail, Dhaka',
    formType: 'postpaid',
    defaultRate: 1080,
    meterNumber: 'MG-774-12'
  },
  noakhaliPalli: {
    id: 'noakhaliPalli',
    name: 'Noakhali Palli',
    utility: 'electric',
    account: '103-102-312-7100',
    type: 'postpaid',
    portalUrl: 'http://reb.gov.bd/',
    portalLabel: 'Open Palli Bidyut Portal ↗',
    location: 'Noakhali',
    formType: 'postpaid',
    meterNumber: 'NP-5541-09'
  },
  inspireBroadband: {
    id: 'inspireBroadband',
    name: 'Inspire Broadband',
    utility: 'internet',
    account: 'rpmehedi6',
    type: 'prepaid',
    portalUrl: 'https://user.inspirebd.net/',
    portalLabel: 'Open Inspire Portal ↗',
    location: 'Mirpur, Dhaka',
    formType: 'prepaid',
    defaultRate: 840,
    meterNumber: 'ISP-8821'
  },
  gym: {
    id: 'gym',
    name: 'Gym',
    utility: 'gym',
    account: '1724',
    type: 'prepaid',
    location: 'Fitness Club',
    formType: 'gym',
    defaultRate: 1700,
    meterNumber: '1724'
  },
  landTax: {
    id: 'landTax',
    name: 'Land Tax',
    utility: 'tax',
    account: 'LT-9921',
    type: 'prepaid',
    portalUrl: 'https://ldtax.gov.bd/',
    portalLabel: 'Open Land Tax Portal ↗',
    location: 'Dhaka Municipal',
    formType: 'landTax',
    meterNumber: 'LT-9921'
  }
};
