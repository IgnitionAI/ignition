'use client'

import { useIsMobile } from './use-is-mobile'

/**
 * Shows an "Inference only" badge on mobile devices.
 * RL training is CPU/GPU intensive and mobile browsers throttle background tabs.
 */
export function MobileInferenceBadge() {
  const isMobile = useIsMobile()

  if (!isMobile) return null

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 ml-2">
      Inference only
    </span>
  )
}
