/**
 * Pricing and plan comparison utilities
 */

export interface PlanFeature {
  name: string;
  enabled: boolean;
  description: string;
}

export interface PlanComparison {
  planType: string;
  name: string;
  price: {
    monthly: number;
    yearly: number;
  };
  memberLimit: number | null;
  features: PlanFeature[];
  popular?: boolean;
  description: string;
}

export const PLAN_COMPARISONS: PlanComparison[] = [
  {
    planType: 'free',
    name: 'Kostenlos',
    price: { monthly: 0, yearly: 0 },
    memberLimit: 50,
    description: 'Perfekt für kleine Vereine, um ClubFlow auszuprobieren',
    features: [
      { name: 'basicManagement', enabled: true, description: 'Grundverwaltung' },
      { name: 'teamManagement', enabled: false, description: 'Team-Management' },
      { name: 'facilityBooking', enabled: false, description: 'Anlagen-Buchung' },
      { name: 'financialReports', enabled: false, description: 'Finanzberichte' },
      { name: 'advancedReports', enabled: false, description: 'Erweiterte Berichte' },
      { name: 'automatedEmails', enabled: false, description: 'Automatische E-Mails' },
      { name: 'apiAccess', enabled: false, description: 'API-Zugang' },
      { name: 'prioritySupport', enabled: false, description: 'Priority-Support' },
    ],
  },
  {
    planType: 'starter',
    name: 'Vereins-Starter',
    price: { monthly: 19, yearly: 190 },
    memberLimit: 150,
    description: 'Ideal für wachsende Vereine mit erweiterten Funktionen',
    features: [
      { name: 'basicManagement', enabled: true, description: 'Grundverwaltung' },
      { name: 'teamManagement', enabled: true, description: 'Team-Management' },
      { name: 'facilityBooking', enabled: true, description: 'Anlagen-Buchung' },
      { name: 'financialReports', enabled: true, description: 'Finanzberichte' },
      { name: 'advancedReports', enabled: false, description: 'Erweiterte Berichte' },
      { name: 'automatedEmails', enabled: true, description: 'Automatische E-Mails' },
      { name: 'apiAccess', enabled: false, description: 'API-Zugang' },
      { name: 'prioritySupport', enabled: false, description: 'Priority-Support' },
    ],
  },
  {
    planType: 'professional',
    name: 'Vereins-Professional',
    price: { monthly: 49, yearly: 490 },
    memberLimit: 500,
    popular: true,
    description: 'Vollständige Lösung für professionelle Vereinsverwaltung',
    features: [
      { name: 'basicManagement', enabled: true, description: 'Grundverwaltung' },
      { name: 'teamManagement', enabled: true, description: 'Team-Management' },
      { name: 'facilityBooking', enabled: true, description: 'Anlagen-Buchung' },
      { name: 'financialReports', enabled: true, description: 'Finanzberichte' },
      { name: 'advancedReports', enabled: true, description: 'Erweiterte Berichte' },
      { name: 'automatedEmails', enabled: true, description: 'Automatische E-Mails' },
      { name: 'apiAccess', enabled: true, description: 'API-Zugang' },
      { name: 'prioritySupport', enabled: true, description: 'Priority-Support' },
    ],
  },
  {
    planType: 'enterprise',
    name: 'Vereins-Enterprise',
    price: { monthly: 99, yearly: 990 },
    memberLimit: null,
    description: 'Maßgeschneiderte Lösung für große Vereine und Verbände',
    features: [
      { name: 'basicManagement', enabled: true, description: 'Grundverwaltung' },
      { name: 'teamManagement', enabled: true, description: 'Team-Management' },
      { name: 'facilityBooking', enabled: true, description: 'Anlagen-Buchung' },
      { name: 'financialReports', enabled: true, description: 'Finanzberichte' },
      { name: 'advancedReports', enabled: true, description: 'Erweiterte Berichte' },
      { name: 'automatedEmails', enabled: true, description: 'Automatische E-Mails' },
      { name: 'apiAccess', enabled: true, description: 'API-Zugang' },
      { name: 'prioritySupport', enabled: true, description: 'Priority-Support' },
      { name: 'whiteLabel', enabled: true, description: 'White-Label' },
      { name: 'customIntegrations', enabled: true, description: 'Custom-Integrationen' },
    ],
  },
];

export function formatPrice(priceInEuros: number, interval: 'monthly' | 'yearly'): string {
  if (priceInEuros === 0) return 'Kostenlos';
  
  const formatted = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(priceInEuros);
  
  return interval === 'yearly' ? `${formatted}/Jahr` : `${formatted}/Monat`;
}

export function calculateYearlySavings(monthlyPrice: number, yearlyPrice: number): number {
  return Math.max(0, (monthlyPrice * 12) - yearlyPrice);
}

export function formatPlanName(planType: string): string {
  const plan = PLAN_COMPARISONS.find(p => p.planType === planType);
  return plan?.name || planType;
}

export function getPlanFeatures(planType: string): PlanFeature[] {
  const plan = PLAN_COMPARISONS.find(p => p.planType === planType);
  return plan?.features || [];
}

export function getMemberLimit(planType: string): number | null {
  const plan = PLAN_COMPARISONS.find(p => p.planType === planType);
  return plan?.memberLimit || null;
}

export function canAccessFeature(planType: string, featureName: string): boolean {
  const features = getPlanFeatures(planType);
  const feature = features.find(f => f.name === featureName);
  return feature?.enabled || false;
}