export interface GymCycleInfo {
  startDate: Date;
  endDate: Date;
  dueDate: Date;
  rangeLabel: string;
  dueLabel: string;
}

export interface LandTaxCycleInfo {
  startYear: number;
  endYear: number;
  duration: number;
  rangeLabel: string;
  displayRange: string;
  dueYear: number;
  dueDate: Date;
  dueLabel: string;
}

export interface TitasGasDueInfo {
  monthCount: number;
  overdueCount: number;
  billsAt10: number;
  billsAt20: number;
  totalFee: number;
}

export interface MatuailGasStatus {
  paidTill: string;
  dueText: string;
  dueColor: string;
  totalDue: number;
  fee: number;
  monthsFraction: number;
  billedMonths: number;
  fine: number;
  dueCalc?: TitasGasDueInfo;
}

export interface DueCalculationResult {
  nextDueDate: Date | null;
  dueText: string;
  statusClass: 'due' | 'paid' | 'partial' | 'overdue' | 'warning' | 'muted';
  diffDays: number;
  isOverdue: boolean;
  isDueSoon: boolean;
  isPaused?: boolean;
}
