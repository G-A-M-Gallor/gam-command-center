import * as React from "react"
import { cn } from "@/lib/utils"

export type BadgeIntent = "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "neutral" | "danger" | "accent"
export type BadgeSize = "sm" | "md" | "lg"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  intent?: BadgeIntent
  size?: BadgeSize
}

const badgeIntentVariants: Record<BadgeIntent, string> = {
  default: "border-transparent bg-purple-600 text-white hover:bg-purple-500",
  secondary: "border-transparent bg-slate-700 text-slate-200 hover:bg-slate-600",
  destructive: "border-transparent bg-red-500 text-red-50 hover:bg-red-500/80",
  outline: "text-slate-300 border-slate-600 hover:bg-slate-800",
  success: "border-transparent bg-green-600 text-green-50 hover:bg-green-500",
  warning: "border-transparent bg-amber-600 text-amber-50 hover:bg-amber-500",
  info: "border-transparent bg-blue-600 text-blue-50 hover:bg-blue-500",
  neutral: "border-transparent bg-slate-600 text-slate-100 hover:bg-slate-500",
  danger: "border-transparent bg-red-600 text-red-50 hover:bg-red-500",
  accent: "border-transparent bg-purple-500 text-white hover:bg-purple-400",
}

const badgeSizeVariants: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-0.5 text-sm",
  lg: "px-3 py-1 text-base",
}

function Badge({ 
  className, 
  intent = "default", 
  size = "sm",
  ...props 
}: BadgeProps) {
  return (
    <div 
      className={cn(
        "inline-flex items-center rounded-full border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        badgeIntentVariants[intent],
        badgeSizeVariants[size],
        className
      )} 
      {...props} 
    />
  )
}

export { Badge }
