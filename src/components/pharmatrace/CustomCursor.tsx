'use client'
import { useEffect, useRef } from 'react'

/**
 * Custom cursor — a single white glowing dot that follows the mouse.
 * Uses a direct DOM ref + requestAnimationFrame for buttery-smooth
 * tracking with zero React re-renders. The native cursor is hidden.
 * Desktop only (disabled on touch devices).
 */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Disable on mobile/touch devices
    if (window.matchMedia('(hover: none)').matches) return

    const dot = dotRef.current
    if (!dot) return

    let mouseX = 0
    let mouseY = 0
    let dotX = 0
    let dotY = 0
    let rafId = 0
    let visible = false

    const animate = () => {
      // Lerp the dot toward the mouse for smooth trailing
      dotX += (mouseX - dotX) * 0.35
      dotY += (mouseY - dotY) * 0.35
      dot.style.transform = `translate(${dotX}px, ${dotY}px) translate(-50%, -50%)`
      rafId = requestAnimationFrame(animate)
    }

    const move = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
      if (!visible) {
        visible = true
        dot.style.opacity = '1'
        dotX = mouseX
        dotY = mouseY
      }
      // Check if hovering interactive element
      const target = e.target as HTMLElement
      const interactive = target.closest('button, a, [role=button], input, textarea, select, label')
      if (interactive) {
        dot.style.width = '14px'
        dot.style.height = '14px'
        dot.style.boxShadow = '0 0 12px rgba(255,255,255,0.8), 0 0 24px rgba(34,211,238,0.4)'
      } else {
        dot.style.width = '10px'
        dot.style.height = '10px'
        dot.style.boxShadow = '0 0 8px rgba(255,255,255,0.6)'
      }
    }

    const leave = () => {
      visible = false
      dot.style.opacity = '0'
    }

    // Start animation loop
    rafId = requestAnimationFrame(animate)
    document.addEventListener('mousemove', move)
    document.addEventListener('mouseleave', leave)

    return () => {
      cancelAnimationFrame(rafId)
      document.removeEventListener('mousemove', move)
      document.removeEventListener('mouseleave', leave)
    }
  }, [])

  return (
    <>
      <style>{`* { cursor: none !important; }`}</style>
      <div
        ref={dotRef}
        className="pointer-events-none fixed top-0 left-0 z-[9999] rounded-full"
        style={{
          width: '10px',
          height: '10px',
          backgroundColor: '#ffffff',
          boxShadow: '0 0 8px rgba(255,255,255,0.6)',
          opacity: '0',
          willChange: 'transform',
        }}
      />
    </>
  )
}
