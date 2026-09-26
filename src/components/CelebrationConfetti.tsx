import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface CelebrationConfettiProps {
  active: boolean;
}

export function CelebrationConfetti({ active }: CelebrationConfettiProps) {
  useEffect(() => {
    if (!active) return;

    // First burst - lightweight particles
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#fbbf24', '#f59e0b', '#d97706', '#fef08a', '#ffffff'],
      disableForReducedMotion: true
    });

    // Side cannons - throttled to prevent frame drops
    const end = Date.now() + 1200;
    const interval: ReturnType<typeof setInterval> = setInterval(() => {
      if (Date.now() > end) {
        clearInterval(interval);
        return;
      }

      confetti({
        particleCount: 20,
        angle: 60,
        spread: 45,
        origin: { x: 0, y: 0.7 },
        colors: ['#fbbf24', '#f59e0b', '#ffffff'],
        disableForReducedMotion: true
      });

      confetti({
        particleCount: 20,
        angle: 120,
        spread: 45,
        origin: { x: 1, y: 0.7 },
        colors: ['#fbbf24', '#f59e0b', '#ffffff'],
        disableForReducedMotion: true
      });
    }, 350);

    return () => clearInterval(interval);
  }, [active]);

  return null;
}
