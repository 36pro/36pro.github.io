import { describe, it, expect } from 'vitest';
import { TOKENS, getStatusStyles } from '@/ui/tokens';

describe('Design System Tokens & Accessibility Constraints', () => {
  it('enforces touch targets >= 48px in tokens', () => {
    expect(parseInt(TOKENS.layout.minTouchTarget, 10)).toBeGreaterThanOrEqual(48);
  });

  it('provides semantic status colors for all 6 required states', () => {
    const statuses = ['due', 'paid', 'partial', 'overdue', 'warning', 'muted'] as const;
    statuses.forEach(status => {
      const style = getStatusStyles(status);
      expect(style.color).toBeDefined();
      expect(style.bg).toBeDefined();
      expect(style.borderColor).toBeDefined();
    });
  });

  it('defines typography rules with Outfit for amount and Tiro Bangla for Bengali text', () => {
    expect(TOKENS.typography.fontAmount).toContain('Outfit');
    expect(TOKENS.typography.fontBangla).toContain('Tiro Bangla');
    expect(TOKENS.typography.fontLogo).toContain('Plus Jakarta Sans');
  });
});
