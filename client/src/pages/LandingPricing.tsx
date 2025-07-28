/**
 * Landing Page Pricing Section
 * Professional pricing display for ClubFlow's subscription plans
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Crown, 
  Check, 
  X, 
  Users, 
  Calendar,
  BarChart3,
  Shield,
  Star,
  Zap,
  ArrowRight,
  Euro
} from "lucide-react";
import { formatPrice, calculateYearlySavings, PLAN_COMPARISONS } from "@/lib/pricing";

interface LandingPricingProps {
  onGetStarted?: (planType: string) => void;
}

export default function LandingPricing({ onGetStarted }: LandingPricingProps) {
  const [selectedInterval, setSelectedInterval] = useState<'monthly' | 'yearly'>('monthly');

  const handleGetStarted = (planType: string) => {
    if (onGetStarted) {
      onGetStarted(planType);
    } else {
      // Default behavior - navigate to registration
      window.location.href = '/login';
    }
  };

  return (
    <section className="py-24 bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium mb-6">
            <Euro className="h-4 w-4" />
            Transparente Preise für jeden Verein
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Wählen Sie den{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              perfekten Plan
            </span>{" "}
            für Ihren Verein
          </h2>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Von kleinen Vereinen bis hin zu großen Verbänden - ClubFlow wächst mit Ihnen. 
            Starten Sie kostenlos und upgraden Sie, wenn Sie mehr Funktionen benötigen.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <Button
              variant={selectedInterval === 'monthly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedInterval('monthly')}
              className="px-6"
            >
              Monatlich
            </Button>
            <Button
              variant={selectedInterval === 'yearly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedInterval('yearly')}
              className="px-6 relative"
            >
              Jährlich
              <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                -17% sparen
              </Badge>
            </Button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {PLAN_COMPARISONS.map((plan) => {
            const price = plan.price[selectedInterval];
            const monthlySavings = selectedInterval === 'yearly' ? calculateYearlySavings(plan.price.monthly, plan.price.yearly) : 0;
            const isPopular = plan.popular;
            const isFree = plan.planType === 'free';

            return (
              <Card 
                key={plan.planType} 
                className={`relative transition-all duration-300 hover:shadow-xl ${
                  isPopular 
                    ? 'ring-2 ring-purple-500 dark:ring-purple-400 shadow-lg scale-105 lg:scale-110' 
                    : 'hover:shadow-lg hover:scale-[1.02]'
                } ${isFree ? 'border-gray-200 dark:border-gray-700' : ''}`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-1 text-sm font-medium">
                      <Star className="h-3 w-3 mr-1" />
                      Am beliebtesten
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className="mb-4">
                    {isFree && <Shield className="h-8 w-8 mx-auto text-gray-500" />}
                    {plan.planType === 'starter' && <Users className="h-8 w-8 mx-auto text-blue-500" />}
                    {plan.planType === 'professional' && <Crown className="h-8 w-8 mx-auto text-purple-500" />}
                    {plan.planType === 'enterprise' && <Zap className="h-8 w-8 mx-auto text-amber-500" />}
                  </div>
                  
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-sm text-gray-600 dark:text-gray-400 min-h-[2.5rem] flex items-center">
                    {plan.description}
                  </CardDescription>
                  
                  <div className="mt-6">
                    <div className="text-4xl font-bold text-gray-900 dark:text-white">
                      {formatPrice(price, selectedInterval)}
                    </div>
                    {selectedInterval === 'yearly' && monthlySavings > 0 && (
                      <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                        Sparen Sie €{monthlySavings}/Jahr
                      </div>
                    )}
                    {plan.memberLimit && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        Bis zu {plan.memberLimit} Mitglieder
                      </div>
                    )}
                    {!plan.memberLimit && plan.planType !== 'free' && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        Unbegrenzte Mitglieder
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {/* Features List */}
                  <div className="space-y-3 mb-8">
                    {plan.features.slice(0, 6).map((feature) => (
                      <div key={feature.name} className="flex items-center gap-3 text-sm">
                        {feature.enabled ? (
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-gray-300 flex-shrink-0" />
                        )}
                        <span className={feature.enabled ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 line-through'}>
                          {feature.description}
                        </span>
                      </div>
                    ))}
                    {plan.features.length > 6 && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                        + {plan.features.length - 6} weitere Funktionen
                      </div>
                    )}
                  </div>
                  
                  <Separator className="mb-6" />
                  
                  {/* CTA Button */}
                  <Button 
                    className={`w-full ${
                      isPopular 
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg' 
                        : isFree
                        ? 'bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                    size="lg"
                    onClick={() => handleGetStarted(plan.planType)}
                  >
                    {isFree ? (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Kostenlos starten
                      </>
                    ) : (
                      <>
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Plan wählen
                      </>
                    )}
                  </Button>
                  
                  {isFree && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                      Keine Kreditkarte erforderlich
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-16">
          <h3 className="text-2xl font-bold text-center mb-8">Funktions-Vergleich</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-4 px-2 font-medium text-gray-900 dark:text-white">
                    Funktionen
                  </th>
                  {PLAN_COMPARISONS.map(plan => (
                    <th key={plan.planType} className="text-center py-4 px-2 font-medium text-gray-900 dark:text-white min-w-[120px]">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { key: 'basicManagement', label: 'Grundverwaltung' },
                  { key: 'teamManagement', label: 'Team-Management' },
                  { key: 'facilityBooking', label: 'Anlagen-Buchung' },
                  { key: 'financialReports', label: 'Finanzberichte' },
                  { key: 'advancedReports', label: 'Erweiterte Berichte' },
                  { key: 'automatedEmails', label: 'Automatische E-Mails' },
                  { key: 'apiAccess', label: 'API-Zugang' },
                  { key: 'prioritySupport', label: 'Priority-Support' },
                ].map((featureRow, index) => (
                  <tr key={featureRow.key} className={`border-b border-gray-100 dark:border-gray-700 ${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/50' : ''}`}>
                    <td className="py-4 px-2 text-gray-700 dark:text-gray-300 font-medium">
                      {featureRow.label}
                    </td>
                    {PLAN_COMPARISONS.map(plan => {
                      const feature = plan.features.find(f => f.name === featureRow.key);
                      return (
                        <td key={plan.planType} className="text-center py-4 px-2">
                          {feature?.enabled ? (
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-gray-300 mx-auto" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-4">Häufig gestellte Fragen</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Haben Sie Fragen? Kontaktieren Sie uns gerne für eine persönliche Beratung.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left max-w-4xl mx-auto">
            <div>
              <h4 className="font-semibold mb-2">Kann ich jederzeit upgraden oder downgraden?</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Ja, Sie können Ihren Plan jederzeit ändern. Upgrades werden sofort wirksam, 
                bei Downgrades erhalten Sie eine anteilige Rückerstattung.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Gibt es langfristige Verträge?</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Nein, alle Pläne sind monatlich kündbar. Bei jährlicher Zahlung erhalten Sie 
                einen Rabatt, aber auch hier können Sie jederzeit kündigen.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Was passiert mit meinen Daten bei einer Kündigung?</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Ihre Daten bleiben 30 Tage nach der Kündigung gespeichert. In dieser Zeit 
                können Sie sie exportieren oder Ihr Abonnement reaktivieren.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Bieten Sie Support für alle Pläne?</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Ja, alle Pläne erhalten E-Mail-Support. Professional und Enterprise Kunden 
                erhalten zusätzlich Priority-Support mit schnelleren Antwortzeiten.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}