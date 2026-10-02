'use client'
import { useEffect, useState } from 'react'

/**
 * Custom cursor — a single white glowing dot that follows the mouse.
 * Hides the native cursor so there's only ONE pointer visible.
 * Desktop only (disabled on touch devices).
 */
export function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [hovering, setHovering] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Disable on mobile/touch devices
    if (window.matchMedia('(hover: none)').matches) return

    const move = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY })
      setVisible(true)
      // Check if hovering interactive element
      const target = e.target as HTMLElement
      const interactive = target.closest('button, a, [role=button], input, textarea, select, label')
      setHovering(!!interactive)
    }
    const leave = () => setVisible(false)
    document.addEventListener('mousemove', move)
    document.addEventListener('mouseleave', leave)
    return () => {
      document.removeEventListener('mousemove', move)
      document.removeEventListener('mouseleave', leave)
    }
  }, [])

  if (!visible) return null

  return (
    <>
      {/* Hide the native cursor on desktop */}
      <style>{`* { cursor: none !important; }`}</style>
      {/* Single white cursor — a dot with a subtle glow */}
      <div
        className="pointer-events-none fixed z-[9999] rounded-full transition-all duration-150 ease-out"
        style={{
          left: position.x,
          top: position.y,
          width: hovering ? 14 : 10,
          height: hovering ? 14 : 10,
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#ffffff',
          boxShadow: hovering
            ? '0 0 12px rgba(255, 255, 255, 0.8), 0 0 24px rgba(34, 211, 238, 0.4)'
            : '0 0 8px rgba(255, 255, 255, 0.6)',
        }}
      />
    </>
  )
}
