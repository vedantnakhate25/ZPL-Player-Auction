import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface CelebrationConfettiProps {
  active: boolean;
}

export function CelebrationConfetti({ active }: CelebrationConfettiProps) {
  useEffect(() => {
    if (!active) return;

    // First burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#fbbf24', '#f59e0b', '#d97706', '#fef08a', '#ffffff']
    });

    // Side cannons
    const end = Date.now() + 1500;
    const interval: ReturnType<typeof setInterval> = setInterval(() => {
      if (Date.now() > end) {
        clearInterval(interval);
        return;
      }

      confetti({
        particleCount: 40,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#fbbf24', '#f59e0b', '#ffffff']
      });

      confetti({
        particleCount: 40,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#fbbf24', '#f59e0b', '#ffffff']
      });
    }, 250);

    return () => clearInterval(interval);
  }, [active]);

  return null;
}
