"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { HelpCircle, Info, Lightbulb, Zap, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

// Enhanced help tooltip with playful micro-interactions
interface ContextualHelpProps {
  children: React.ReactNode
  content: string | React.ReactNode
  title?: string
  type?: "info" | "tip" | "warning" | "feature" | "shortcut"
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  showIcon?: boolean
  iconOnly?: boolean
  className?: string
  delay?: number
  interactive?: boolean
}

export function ContextualHelp({
  children,
  content,
  title,
  type = "info",
  side = "top",
  align = "center",
  showIcon = true,
  iconOnly = false,
  className,
  delay = 300,
  interactive = false
}: ContextualHelpProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  // Type-specific styling and icons
  const getTypeConfig = (type: string) => {
    switch (type) {
      case "tip":
        return {
          icon: <Lightbulb className="h-3.5 w-3.5" />,
          color: "text-yellow-500",
          bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
          borderColor: "border-yellow-200 dark:border-yellow-800",
          emoji: "💡"
        }
      case "warning":
        return {
          icon: <Zap className="h-3.5 w-3.5" />,
          color: "text-orange-500",
          bgColor: "bg-orange-50 dark:bg-orange-900/20",
          borderColor: "border-orange-200 dark:border-orange-800",
          emoji: "⚡"
        }
      case "feature":
        return {
          icon: <Sparkles className="h-3.5 w-3.5" />,
          color: "text-purple-500",
          bgColor: "bg-purple-50 dark:bg-purple-900/20",
          borderColor: "border-purple-200 dark:border-purple-800",
          emoji: "✨"
        }
      case "shortcut":
        return {
          icon: <Zap className="h-3.5 w-3.5" />,
          color: "text-green-500",
          bgColor: "bg-green-50 dark:bg-green-900/20",
          borderColor: "border-green-200 dark:border-green-800",
          emoji: "⚡"
        }
      default:
        return {
          icon: <Info className="h-3.5 w-3.5" />,
          color: "text-blue-500",
          bgColor: "bg-blue-50 dark:bg-blue-900/20",
          borderColor: "border-blue-200 dark:border-blue-800",
          emoji: "ℹ️"
        }
    }
  }

  const config = getTypeConfig(type)

  return (
    <TooltipPrimitive.Provider delayDuration={delay}>
      <TooltipPrimitive.Root 
        open={isOpen} 
        onOpenChange={setIsOpen}
      >
        <TooltipPrimitive.Trigger asChild>
          {iconOnly ? (
            <button
              className={cn(
                "inline-flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 active:scale-95",
                "w-5 h-5 text-muted-foreground hover:text-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1",
                config.color,
                className
              )}
              data-testid="contextual-help-trigger"
            >
              {showIcon && config.icon}
            </button>
          ) : (
            <span className={cn("inline-flex items-center", className)}>
              {children}
              {showIcon && (
                <span 
                  className={cn(
                    "ml-1.5 inline-flex items-center justify-center transition-all duration-200",
                    "hover:scale-110 active:scale-95 hover:animate-pulse",
                    config.color
                  )}
                  data-testid="contextual-help-icon"
                >
                  {config.icon}
                </span>
              )}
            </span>
          )}
        </TooltipPrimitive.Trigger>

        <TooltipPrimitive.Content
          side={side}
          align={align}
          className={cn(
            // Base styling
            "z-50 max-w-sm rounded-lg border shadow-lg",
            "px-4 py-3 text-sm",
            // Enhanced animations with playful micro-interactions
            "animate-in fade-in-0 zoom-in-95 duration-200",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
            "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            // Playful hover effects
            "transform transition-all duration-200 hover:scale-[1.02]",
            // Type-specific styling
            config.bgColor,
            config.borderColor,
            // Interactive styling
            interactive && "cursor-pointer hover:shadow-xl",
            className
          )}
          onPointerDownOutside={(e) => !interactive && e.preventDefault()}
          data-testid="contextual-help-content"
        >
          {/* Enhanced content with micro-interactions */}
          <div className="space-y-2">
            {title && (
              <div className="flex items-center space-x-2">
                <span className="text-lg" role="img" aria-label={type}>
                  {config.emoji}
                </span>
                <h4 className={cn(
                  "font-semibold leading-none",
                  config.color
                )}>
                  {title}
                </h4>
              </div>
            )}
            
            <div className="text-foreground/90 leading-relaxed">
              {typeof content === 'string' ? (
                <p>{content}</p>
              ) : (
                content
              )}
            </div>
          </div>

          {/* Playful arrow with micro-interaction */}
          <TooltipPrimitive.Arrow 
            className={cn(
              "fill-current transition-all duration-200",
              config.bgColor.replace('bg-', 'text-')
            )} 
          />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}

// Quick help icon component for easy placement
export function HelpIcon({ 
  content, 
  type = "info", 
  className,
  size = "sm" 
}: {
  content: string | React.ReactNode
  type?: "info" | "tip" | "warning" | "feature" | "shortcut"
  className?: string
  size?: "xs" | "sm" | "md"
}) {
  const sizeClasses = {
    xs: "w-3.5 h-3.5",
    sm: "w-4 h-4", 
    md: "w-5 h-5"
  }

  return (
    <ContextualHelp
      content={content}
      type={type}
      iconOnly
      className={cn(sizeClasses[size], className)}
      data-testid="help-icon"
    >
      <span></span>
    </ContextualHelp>
  )
}

// Feature spotlight component for highlighting new features
export function FeatureSpotlight({
  children,
  title,
  description,
  isNew = false,
  className
}: {
  children: React.ReactNode
  title: string
  description: string
  isNew?: boolean
  className?: string
}) {
  return (
    <ContextualHelp
      content={
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            {isNew && (
              <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full animate-pulse">
                Neu
              </span>
            )}
          </div>
          <p className="text-sm">{description}</p>
        </div>
      }
      title={title}
      type="feature"
      interactive
      className={className}
    >
      {children}
    </ContextualHelp>
  )
}

// Keyboard shortcut helper
export function ShortcutHelp({
  shortcut,
  description,
  children
}: {
  shortcut: string
  description: string
  children: React.ReactNode
}) {
  return (
    <ContextualHelp
      content={
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-800 rounded border">
              {shortcut}
            </kbd>
          </div>
          <p className="text-sm">{description}</p>
        </div>
      }
      title="Tastenkürzel"
      type="shortcut"
    >
      {children}
    </ContextualHelp>
  )
}