'use client';

import { useState, useEffect } from 'react';
import { BREAKPOINTS } from '../constants';

export function useResponsive() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < BREAKPOINTS.tablet);
      setIsTablet(width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop);
      setIsDesktop(width >= BREAKPOINTS.desktop);
    };

    // Check on mount
    checkScreenSize();

    // Add event listener
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return {
    isMobile,
    isTablet,
    isDesktop,
    viewport: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
  };
}