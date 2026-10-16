'use client'

import { useState, useEffect } from 'react'

/**
 * Detects if the current device is mobile (touch + small viewport).
 * Used to show inference-only warnings for RL demos.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const isSmall = window.innerWidth < 768
      setIsMobile(hasTouch && isSmall)
    }

    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return isMobile
}
