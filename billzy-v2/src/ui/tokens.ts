export const TOKENS = {
  colors: {
    bg: '#020817',
    surface: '#0b1730',
    surfaceHover: '#102448',
    surfaceActive: '#142c57',
    border: '#1d3969',
    borderGlow: 'rgba(0, 194, 255, 0.35)',

    // Accents
    accentGreen: '#00E676',
    accentCyan: '#00C2FF',
    accentOrange: '#FF7A00',
    accentPurple: '#A855F7',

    // Semantic Statuses
    statusDue: '#00C2FF',        // Cyan / Blue
    statusPaid: '#00E676',       // Green
    statusPartial: '#A855F7',    // Purple
    statusOverdue: '#ff6077',    // Red / Coral
    statusWarning: '#ffb84d',    // Amber / Yellow
    statusMuted: '#94a3b8',      // Gray

    // Status Backgrounds (Translucent)
    bgStatusDue: 'rgba(0, 194, 255, 0.12)',
    bgStatusPaid: 'rgba(0, 230, 118, 0.12)',
    bgStatusPartial: 'rgba(168, 85, 247, 0.12)',
    bgStatusOverdue: 'rgba(255, 96, 119, 0.14)',
    bgStatusWarning: 'rgba(255, 184, 77, 0.14)',
    bgStatusMuted: 'rgba(148, 163, 184, 0.12)',

    // Text
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    textDim: '#64748b'
  },
  typography: {
    fontBody: 'Inter, system-ui, -apple-system, sans-serif',
    fontAmount: 'Outfit, system-ui, sans-serif',
    fontBangla: "'Tiro Bangla', serif",
    fontMono: "'JetBrains Mono', monospace",
    fontLogo: "'Plus Jakarta Sans', system-ui, sans-serif"
  },
  layout: {
    minTouchTarget: '48px',
    maxWidth: '1200px',
    mobileBreakpoint: '768px',
    smallMobileBreakpoint: '360px',
    borderRadiusCard: '16px',
    borderRadiusPill: '9999px',
    borderRadiusInput: '12px'
  }
} as const;

export type StatusType = 'due' | 'paid' | 'partial' | 'overdue' | 'warning' | 'muted';

export function getStatusStyles(status: StatusType): { color: string; bg: string; borderColor: string } {
  switch (status) {
    case 'paid':
      return {
        color: TOKENS.colors.statusPaid,
        bg: TOKENS.colors.bgStatusPaid,
        borderColor: 'rgba(0, 230, 118, 0.3)'
      };
    case 'overdue':
      return {
        color: TOKENS.colors.statusOverdue,
        bg: TOKENS.colors.bgStatusOverdue,
        borderColor: 'rgba(255, 96, 119, 0.35)'
      };
    case 'warning':
      return {
        color: TOKENS.colors.statusWarning,
        bg: TOKENS.colors.bgStatusWarning,
        borderColor: 'rgba(255, 184, 77, 0.35)'
      };
    case 'partial':
      return {
        color: TOKENS.colors.statusPartial,
        bg: TOKENS.colors.bgStatusPartial,
        borderColor: 'rgba(168, 85, 247, 0.35)'
      };
    case 'due':
      return {
        color: TOKENS.colors.statusDue,
        bg: TOKENS.colors.bgStatusDue,
        borderColor: 'rgba(0, 194, 255, 0.35)'
      };
    case 'muted':
    default:
      return {
        color: TOKENS.colors.statusMuted,
        bg: TOKENS.colors.bgStatusMuted,
        borderColor: 'rgba(148, 163, 184, 0.25)'
      };
  }
}
