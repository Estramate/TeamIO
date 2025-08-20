"use client"

import * as React from "react"
import { HelpCircle, X, ChevronRight, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { getHelpByCategory } from "@/lib/help-content"

// Floating help assistant that can guide users through features
interface FloatingHelpProps {
  isOpen: boolean
  onToggle: () => void
  currentPage?: string
}

export function FloatingHelpAssistant({ isOpen, onToggle, currentPage = "dashboard" }: FloatingHelpProps) {
  const [currentHelpIndex, setCurrentHelpIndex] = React.useState(0)
  const [isExpanded, setIsExpanded] = React.useState(false)
  
  const helpItems = getHelpByCategory(currentPage)
  const currentHelp = helpItems[currentHelpIndex]

  const nextHelp = () => {
    setCurrentHelpIndex((prev) => (prev + 1) % helpItems.length)
  }

  const prevHelp = () => {
    setCurrentHelpIndex((prev) => (prev - 1 + helpItems.length) % helpItems.length)
  }

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg",
          "bg-blue-600 hover:bg-blue-700 text-white",
          "transition-all duration-300 hover:scale-110 active:scale-95",
          "hover:shadow-xl"
        )}
        data-testid="floating-help-trigger"
      >
        <HelpCircle className="w-6 h-6" />
      </Button>
    )
  }

  return (
    <Card className={cn(
      "fixed bottom-6 right-6 z-50 shadow-xl border-2 border-blue-200 dark:border-blue-800",
      "transition-all duration-300 ease-in-out",
      "animate-in slide-in-from-bottom-5 fade-in-0",
      isExpanded ? "w-80" : "w-64"
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-sm">ClubFlow Hilfe</h3>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              {isExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {currentHelp && (
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-sm mb-1 flex items-center space-x-1">
                <span className="text-lg" role="img" aria-label={currentHelp.type}>
                  {currentHelp.type === 'tip' ? '💡' :
                   currentHelp.type === 'warning' ? '⚡' :
                   currentHelp.type === 'feature' ? '✨' :
                   currentHelp.type === 'shortcut' ? '⚡' : 'ℹ️'}
                </span>
                <span>{currentHelp.title}</span>
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {currentHelp.content}
              </p>
            </div>

            {helpItems.length > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={prevHelp}
                  className="h-8 px-2 text-xs"
                  disabled={helpItems.length <= 1}
                >
                  Zurück
                </Button>
                <span className="text-xs text-muted-foreground">
                  {currentHelpIndex + 1} von {helpItems.length}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={nextHelp}
                  className="h-8 px-2 text-xs"
                  disabled={helpItems.length <= 1}
                >
                  Weiter
                </Button>
              </div>
            )}
          </div>
        )}

        {!currentHelp && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Keine Hilfe für diese Seite verfügbar.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Hook for managing floating help state
export function useFloatingHelp() {
  const [isOpen, setIsOpen] = React.useState(false)
  
  const toggle = React.useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  const open = React.useCallback(() => {
    setIsOpen(true)
  }, [])

  const close = React.useCallback(() => {
    setIsOpen(false)
  }, [])

  return {
    isOpen,
    toggle,
    open,
    close
  }
}