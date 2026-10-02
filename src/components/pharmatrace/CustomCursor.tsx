'use client'
import { useEffect, useState } from 'react'

/**
 * Custom cursor — a glowing dot with an outer ring that expands
 * when hovering interactive elements. Desktop only.
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
      {/* Outer ring */}
      <div
        className="pointer-events-none fixed z-[9999] rounded-full border transition-all duration-200 ease-out"
        style={{
          left: position.x,
          top: position.y,
          width: hovering ? 36 : 24,
          height: hovering ? 36 : 24,
          transform: 'translate(-50%, -50%)',
          borderColor: hovering ? 'rgba(34, 211, 238, 0.6)' : 'rgba(34, 211, 238, 0.3)',
          boxShadow: hovering ? '0 0 20px rgba(34, 211, 238, 0.3)' : 'none',
        }}
      />
      {/* Inner dot */}
      <div
        className="pointer-events-none fixed z-[9999] h-1.5 w-1.5 rounded-full bg-cyan-400"
        style={{
          left: position.x,
          top: position.y,
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 0 8px rgba(34, 211, 238, 0.8)',
        }}
      />
    </>
  )
}
