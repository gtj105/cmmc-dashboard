'use client'
import { useEffect, useState } from 'react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface AnimatedProgressProps {
  value: number
  className?: string
  delay?: number
}

export default function AnimatedProgress({
  value,
  className,
  delay = 80,
}: AnimatedProgressProps) {
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setDisplayed(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])

  return (
    <Progress
      value={displayed}
      className={cn('[&>div]:duration-1000 [&>div]:ease-out', className)}
    />
  )
}
