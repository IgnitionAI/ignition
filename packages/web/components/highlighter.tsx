'use client'

import React, { useRef, useEffect } from 'react'
import MousePosition from './utils/mouse-position'

type HighlighterProps = {
  children: React.ReactNode
  className?: string
  refresh?: boolean
}

export default function Highlighter({
  children,
  className = '',
  refresh = false
}: HighlighterProps) {

  const containerRef = useRef<HTMLDivElement>(null)
  const mousePosition = MousePosition()
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const x = mousePosition.x - rect.left
    const y = mousePosition.y - rect.top
    if (x <= 0 || y <= 0 || x >= rect.width || y >= rect.height) return
    Array.from(container.children).forEach((child) => {
      if (!(child instanceof HTMLElement)) return
      const box = child.getBoundingClientRect()
      child.style.setProperty('--mouse-x', `${mousePosition.x - box.left}px`)
      child.style.setProperty('--mouse-y', `${mousePosition.y - box.top}px`)
    })
  }, [mousePosition.x, mousePosition.y, refresh])

  return (
    <div className={className} ref={containerRef}>{children}</div>
  )
}

type HighlighterItemProps = {
  children: React.ReactNode,
  className?: string
}

export function HighlighterItem({
  children,
  className = ''
}: HighlighterItemProps) {
  return <div className={`relative h-full bg-slate-800 rounded-3xl p-px before:absolute before:w-96 before:h-96 before:-left-48 before:-top-48 before:bg-indigo-500 before:rounded-full before:opacity-0 before:pointer-events-none before:transition-opacity before:duration-500 before:translate-x-[var(--mouse-x)] before:translate-y-[var(--mouse-y)] hover:before:opacity-20 before:z-30 before:blur-[100px] after:absolute after:inset-0 after:rounded-[inherit] after:opacity-0 after:transition-opacity after:duration-500 after:[background:radial-gradient(250px_circle_at_var(--mouse-x)_var(--mouse-y),var(--color-slate-400),transparent)] group-hover:after:opacity-100 after:z-10 overflow-hidden ${className}`}>{children}</div>
}

export function HighlighterItem02({
  children,
  className = ''
}: HighlighterItemProps) {
  return <div className={`relative h-full bg-slate-800 rounded-3xl p-px -m-px before:absolute before:w-64 before:h-64 before:-left-32 before:-top-32 before:bg-indigo-500 before:rounded-full before:opacity-0 before:pointer-events-none before:transition-opacity before:duration-500 before:translate-x-[var(--mouse-x)] before:translate-y-[var(--mouse-y)] hover:before:opacity-30 before:z-30 before:blur-[64px] after:absolute after:inset-0 after:rounded-[inherit] after:opacity-0 after:transition-opacity after:duration-500 after:[background:radial-gradient(250px_circle_at_var(--mouse-x)_var(--mouse-y),var(--color-slate-400),transparent)] group-hover:after:opacity-100 after:z-10 overflow-hidden ${className}`}>{children}</div>
}