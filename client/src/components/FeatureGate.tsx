/**
 * Feature gating components for subscription-based access control
 */

import { useFeatureGate, useSubscription } from "@/hooks/use-subscription";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, Crown, Zap } from "lucide-react";
import type { FeatureName } from "@shared/lib/subscription-manager";

interface FeatureGateProps {
  feature: FeatureName;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgrade?: boolean;
}

export function FeatureGate({ 
  feature, 
  children, 
  fallback, 
  showUpgrade = true 
}: FeatureGateProps) {
  const { hasAccess, planType, upgrade } = useFeatureGate(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgrade) {
    return null;
  }

  // Default upgrade prompt
  return <UpgradePrompt feature={feature} onUpgrade={upgrade} currentPlan={planType} />;
}

interface UpgradePromptProps {
  feature: FeatureName;
  onUpgrade: () => void;
  currentPlan: string;
  compact?: boolean;
}

export function UpgradePrompt({ 
  feature, 
  onUpgrade, 
  currentPlan, 
  compact = false 
}: UpgradePromptProps) {
  const featureDescriptions: Record<FeatureName, { title: string; description: string; icon: any }> = {
    basicManagement: {
      title: "Grundlegende Verwaltung",
      description: "Mitgliederverwaltung und einfache Funktionen",
      icon: Lock
    },
    teamManagement: {
      title: "Team-Management",
      description: "Erstellen und verwalten Sie Teams und Mannschaften",
      icon: Crown
    },
    facilityBooking: {
      title: "Anlagen-Buchung",
      description: "Buchungssystem für Sportanlagen und Räume",
      icon: Zap
    },
    financialReports: {
      title: "Finanzberichte",
      description: "Detaillierte Finanzauswertungen und Berichte",
      icon: Crown
    },
    advancedReports: {
      title: "Erweiterte Berichte",
      description: "Umfassende Analysen und Statistiken",
      icon: Crown
    },
    automatedEmails: {
      title: "Automatisierte E-Mails",
      description: "Automatische E-Mail-Benachrichtigungen",
      icon: Zap
    },
    apiAccess: {
      title: "API-Zugang",
      description: "Programmatischer Zugriff auf Vereinsdaten",
      icon: Crown
    },
    prioritySupport: {
      title: "Priority-Support",
      description: "Bevorzugter Kundensupport mit schnellerer Bearbeitung",
      icon: Crown
    },
    whiteLabel: {
      title: "White-Label",
      description: "Anpassung der Plattform mit Ihrem Branding",
      icon: Crown
    },
    customIntegrations: {
      title: "Custom-Integrationen",
      description: "Individuelle Verbindungen zu externen Systemen",
      icon: Crown
    },
    multiAdmin: {
      title: "Mehrere Administratoren",
      description: "Mehrere Benutzer mit Administratorrechten",
      icon: Zap
    },
    bulkImport: {
      title: "Bulk-Import",
      description: "Massenimport von Daten aus Excel oder CSV",
      icon: Zap
    },
    exportData: {
      title: "Daten-Export",
      description: "Export aller Vereinsdaten in verschiedene Formate",
      icon: Zap
    },
    smsNotifications: {
      title: "SMS-Benachrichtigungen",
      description: "Benachrichtigungen per SMS versenden",
      icon: Crown
    },
    customFields: {
      title: "Benutzerdefinierte Felder",
      description: "Zusätzliche Felder für Mitglieder und Teams",
      icon: Zap
    },
  };

  const featureInfo = featureDescriptions[feature];
  const Icon = featureInfo.icon;

  const planBadges = {
    free: { label: "Kostenlos", color: "bg-gray-100 text-gray-800" },
    starter: { label: "Starter", color: "bg-blue-100 text-blue-800" },
    professional: { label: "Professional", color: "bg-purple-100 text-purple-800" },
    enterprise: { label: "Enterprise", color: "bg-green-100 text-green-800" },
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
        <Lock className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {featureInfo.title} nur in höheren Plänen verfügbar
        </span>
        <Button size="sm" variant="outline" onClick={onUpgrade}>
          Upgraden
        </Button>
      </div>
    );
  }

  return (
    <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-2">
          <Icon className="h-6 w-6 text-gray-400" />
        </div>
        <CardTitle className="text-lg">{featureInfo.title}</CardTitle>
        <CardDescription>{featureInfo.description}</CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Aktueller Plan:</span>
          <Badge 
            variant="secondary" 
            className={planBadges[currentPlan as keyof typeof planBadges]?.color}
          >
            {planBadges[currentPlan as keyof typeof planBadges]?.label || currentPlan}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Diese Funktion ist in Ihrem aktuellen Plan nicht verfügbar.
        </p>
        <Button onClick={onUpgrade} className="w-full">
          <Crown className="h-4 w-4 mr-2" />
          Plan upgraden
        </Button>
      </CardContent>
    </Card>
  );
}

// Component for member limit warnings
interface MemberLimitWarningProps {
  currentCount: number;
  className?: string;
}

export function MemberLimitWarning({ currentCount, className }: MemberLimitWarningProps) {
  const { subscriptionManager } = useSubscription();
  
  const remainingMembers = subscriptionManager.getRemainingMembers();
  const planType = subscriptionManager.getCurrentPlan();
  
  // Don't show warning for unlimited plans
  if (remainingMembers === null) return null;
  
  // Show warning when approaching limit
  const showWarning = remainingMembers <= 10;
  const showError = remainingMembers <= 0;
  
  if (!showWarning) return null;

  return (
    <Card className={`${showError ? 'border-red-200 bg-red-50 dark:bg-red-900/10' : 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10'} ${className}`}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full ${showError ? 'bg-red-100 dark:bg-red-900/20' : 'bg-yellow-100 dark:bg-yellow-900/20'}`}>
            <Lock className={`h-4 w-4 ${showError ? 'text-red-600' : 'text-yellow-600'}`} />
          </div>
          <div className="flex-1">
            <h4 className={`font-medium ${showError ? 'text-red-800 dark:text-red-200' : 'text-yellow-800 dark:text-yellow-200'}`}>
              {showError ? 'Mitgliederlimit erreicht' : 'Mitgliederlimit fast erreicht'}
            </h4>
            <p className={`text-sm mt-1 ${showError ? 'text-red-600 dark:text-red-300' : 'text-yellow-600 dark:text-yellow-300'}`}>
              {showError 
                ? `Sie haben das Limit von ${currentCount} Mitgliedern für den ${planType}-Plan erreicht.`
                : `Noch ${remainingMembers} Mitglieder bis zum Limit für den ${planType}-Plan.`
              }
            </p>
            <Button 
              size="sm" 
              variant={showError ? "destructive" : "default"}
              className="mt-3"
              onClick={() => window.location.href = '/subscription/upgrade'}
            >
              Plan upgraden
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Inline feature badge for UI elements
interface FeatureBadgeProps {
  feature: FeatureName;
  requiredPlan?: string;
}

export function FeatureBadge({ feature, requiredPlan }: FeatureBadgeProps) {
  const { hasAccess } = useFeatureGate(feature);
  
  if (hasAccess) return null;

  return (
    <Badge variant="secondary" className="ml-2 text-xs">
      {requiredPlan || "Premium"}
    </Badge>
  );
}