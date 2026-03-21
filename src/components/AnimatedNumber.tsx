'use client'
import { useEffect, useRef, useState } from 'react'

interface AnimatedNumberProps {
  value: number
  duration?: number
  suffix?: string
  className?: string
}

export default function AnimatedNumber({
  value,
  duration = 900,
  suffix = '',
  className,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0)
  const frameRef = useRef<number>(0)
  const startRef = useRef<number>(0)

  useEffect(() => {
    startRef.current = performance.now()
    const animate = (now: number) => {
      const elapsed = now - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      // ease-out-quart: decelerates sharply — feels like a precision instrument settling
      const eased = 1 - Math.pow(1 - progress, 4)
      setDisplay(Math.round(eased * value))
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      }
    }
    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [value, duration])

  return (
    <span className={className}>
      {display}
      {suffix}
    </span>
  )
}
