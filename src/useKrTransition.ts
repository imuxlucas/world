import { useEffect, useLayoutEffect, useState } from 'react';
import type { Objective, KrVariant } from './okrContent';

// Keep exit timing in sync with the bounded character stagger in okr.css.
export const KR_EXIT_MS = 320;
export const KR_ENTER_MS = 560;

export function useKrTransition(objective: Objective, kr: number, open: boolean, variant: KrVariant = 'default') {
  const [displayed, setDisplayed] = useState({ objective, kr, variant });
  const [animateText, setAnimateText] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'out' | 'in'>('idle');
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useLayoutEffect(() => {
    if (!open || reducedMotion || displayed.objective.id !== objective.id) {
      if (displayed.objective !== objective || displayed.kr !== kr || displayed.variant !== variant) setDisplayed({ objective, kr, variant });
      setPhase('idle');
      return;
    }
    if (displayed.kr === kr && displayed.variant === variant) {
      // A quick return to the visible tab cancels the pending replacement.
      setPhase(current => current === 'out' ? 'idle' : current);
      return;
    }
    setAnimateText(displayed.kr !== kr);
    setPhase('out');
    const timer = window.setTimeout(() => {
      setDisplayed({ objective, kr, variant });
      setPhase('in');
    }, KR_EXIT_MS);
    // A newer navigation always wins; never replay stale tab content.
    return () => window.clearTimeout(timer);
  }, [objective, kr, variant, open, reducedMotion, displayed.objective, displayed.kr, displayed.variant]);

  useEffect(() => {
    if (phase !== 'in') return;
    const timer = window.setTimeout(() => setPhase('idle'), KR_ENTER_MS);
    return () => window.clearTimeout(timer);
  }, [phase, displayed]);

  return { ...displayed, phase, textPhase: animateText ? phase : 'idle' };
}
