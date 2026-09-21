import { useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let lenisInstance: Lenis | null = null;

export function getLenis() {
  return lenisInstance;
}

export function pauseScroll() {
  if (lenisInstance) {
    lenisInstance.stop();
  }
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
}

export function resumeScroll() {
  if (lenisInstance) {
    lenisInstance.start();
  }
  document.documentElement.style.overflow = '';
  document.body.style.overflow = '';
}

export function useSmoothScroll() {
  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.5,
    });

    lenisInstance = lenis;

    // Synchronize Lenis scroll position with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    const updateTicker = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateTicker);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(updateTicker);
      lenis.destroy();
      lenisInstance = null;
    };
  }, []);
}

export function scrollToSection(targetId: string) {
  const element = document.getElementById(targetId.replace('#', ''));
  if (element) {
    const navbarHeight = 80;
    const y = element.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
    if (lenisInstance) {
      lenisInstance.scrollTo(y, { duration: 1.2 });
    } else {
      window.scrollTo({
        top: y,
        behavior: 'smooth'
      });
    }
  }
}
