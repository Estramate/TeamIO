# Feature-Gating System - Umfassende Dokumentation

## Überblick

Das Feature-Gating System von ClubFlow ermöglicht elegante subscription-basierte Zugriffskontrolle mit professionellen Upgrade-Prompts. Benutzer erhalten schöne Upgrade-Karten statt Fehlermeldungen oder automatische Weiterleitungen.

## System-Architektur

### Core-Komponenten

#### 1. FeatureGate Component (`client/src/components/FeatureGate.tsx`)
```tsx
interface FeatureGateProps {
  feature: FeatureName;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgrade?: boolean;
}
```

**Verwendung:**
```tsx
<FeatureGate feature="teamManagement">
  <TeamManagementContent />
</FeatureGate>
```

#### 2. useFeatureGate Hook (`client/src/hooks/use-subscription.tsx`)
```tsx
const { hasAccess, planType, upgrade } = useFeatureGate('facilityBooking');
```

**Rückgabewerte:**
- `hasAccess`: Boolean - Zugriff auf Feature verfügbar
- `planType`: String - Aktueller Plan-Typ
- `upgrade`: Function - Navigation zur Subscription-Seite

#### 3. SubscriptionManager (`shared/lib/subscription-manager.ts`)
Zentrale Logik für Feature-Zugriff und Plan-Validierung.

### Datenbank-Schema

#### Subscription Plans (`shared/schemas/subscriptions.ts`)
```sql
subscription_plans:
- id, name, planType, features[], maxMembers
- monthlyPrice, yearlyPrice, displayName

club_subscriptions:
- clubId, planId, status, billingInterval
- currentPeriodStart, currentPeriodEnd

subscription_usage:
- clubId, memberCount, teamCount, facilityCount
- periodStart, periodEnd, recordedAt
```

## Feature-Definitionen

### Plan-Features Matrix

| Feature | Free | Starter | Professional | Enterprise |
|---------|------|---------|--------------|------------|
| basicManagement | ✅ | ✅ | ✅ | ✅ |
| teamManagement | ❌ | ✅ | ✅ | ✅ |
| facilityBooking | ❌ | ✅ | ✅ | ✅ |
| financialReports | ❌ | ✅ | ✅ | ✅ |
| advancedReports | ❌ | ❌ | ✅ | ✅ |
| automatedEmails | ❌ | ✅ | ✅ | ✅ |
| apiAccess | ❌ | ❌ | ✅ | ✅ |
| prioritySupport | ❌ | ❌ | ✅ | ✅ |
| whiteLabel | ❌ | ❌ | ❌ | ✅ |

### Page-Protection Mapping

| Seite | Feature Required | Minimum Plan |
|-------|------------------|--------------|
| `/bookings` | facilityBooking | Starter |
| `/teams` | teamManagement | Starter |
| `/facilities` | facilityBooking | Starter |
| `/finance` | financialReports | Professional |
| `/reports` | advancedReports | Professional |

## Implementierung

### 1. Page-Level Protection

**Beispiel - Teams.tsx:**
```tsx
export default function Teams() {
  return (
    <FeatureGate feature="teamManagement">
      <TeamsContent />
    </FeatureGate>
  );
}
```

### 2. Component-Level Protection

**Beispiel - "Buchung hinzufügen" Button:**
```tsx
const { hasAccess } = useFeatureGate('facilityBooking');

{hasAccess && (
  <Button onClick={openBookingModal}>
    <Plus className="h-4 w-4 mr-2" />
    Buchung hinzufügen
  </Button>
)}
```

### 3. API-Level Protection

**Server-side Validation:**
```typescript
// server/routes.ts
app.post('/api/clubs/:id/teams', requireFeature('teamManagement'), (req, res) => {
  // Team creation logic
});
```

## Upgrade-Prompts Design

### Standard Upgrade Card
- **Crown Icon** für Premium-Features
- **Zap Icon** für erweiterte Features  
- **Lock Icon** für gesperrte Features
- **Gradient Background** mit Plan-spezifischen Farben
- **Clear Call-to-Action** Button

### Upgrade-Flow
1. **Feature Access Check** - useFeatureGate Hook
2. **Upgrade Prompt Display** - FeatureGate Component
3. **Navigation** - Redirect zu `/subscription`
4. **Plan Selection** - Subscription.tsx Seite
5. **Payment Processing** - (zukünftig Stripe Integration)

## Fehlerbehandlung

### React Rendering Schutz
```tsx
// Type-Guards für sichere Datenverarbeitung
const renderUsageStats = () => {
  if (!usage || typeof usage !== 'object') return 'N/A';
  if (typeof usage.memberCount !== 'number') return 'N/A';
  return usage.memberCount.toString();
};
```

### API Error Handling
```typescript
// Graceful degradation bei Subscription-API-Fehlern
const { subscription, isLoading, error } = useSubscription(clubId);

if (error) {
  // Fallback zu Basic-Plan oder Error-State
  return <ErrorBoundary />;
}
```

## Testing

### Component Testing
```typescript
// FeatureGate.test.tsx
test('shows upgrade prompt for restricted feature', () => {
  render(
    <FeatureGate feature="teamManagement">
      <div>Protected Content</div>
    </FeatureGate>
  );
  
  expect(screen.getByText(/Team-Management/)).toBeInTheDocument();
  expect(screen.getByText(/Plan upgraden/)).toBeInTheDocument();
});
```

### Integration Testing
```typescript
// subscription-flow.test.tsx
test('complete upgrade flow', async () => {
  // 1. Access restricted page
  // 2. See upgrade prompt
  // 3. Click upgrade button
  // 4. Navigate to subscription page
  // 5. Select plan
});
```

## Deployment Considerations

### Environment Variables
```env
# Subscription Service
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Plan Configuration
DEFAULT_PLAN=free
TRIAL_PERIOD_DAYS=14
```

### Database Migrations
```sql
-- Initial subscription setup
INSERT INTO subscription_plans (name, planType, features, maxMembers) VALUES
('free', 'free', '["basicManagement"]', 50),
('starter', 'starter', '["basicManagement","teamManagement","facilityBooking"]', 150);
```

## Monitoring & Analytics

### Feature Access Tracking
```typescript
// shared/schemas/subscriptions.ts
export const featureAccessLog = pgTable("feature_access_log", {
  clubId: integer("club_id").notNull(),
  featureName: varchar("feature_name", { length: 100 }).notNull(),
  accessedAt: timestamp("accessed_at").defaultNow().notNull(),
  result: varchar("result", { length: 20 }).notNull(), // 'allowed' | 'denied'
});
```

### Usage Metrics
- Feature Access Attempts vs. Successful Access
- Upgrade Conversion Rates
- Plan Usage by Club Size
- Feature Adoption Rates

## Future Enhancements

### 1. Dynamic Feature Flags
```typescript
// Runtime feature toggling
const features = useRemoteConfig();
```

### 2. Usage-Based Limits
```typescript
// API calls, storage, emails per plan
const { quota, used } = useQuota('apiCalls');
```

### 3. Custom Plan Features
```typescript
// Enterprise customers with custom feature sets
const customFeatures = useCustomPlan(clubId);
```

## Troubleshooting

### Common Issues

**1. Feature Detection Failures**
```typescript
// Check subscription data structure
console.log('Subscription:', subscription);
console.log('Plan Type:', subscription?.plan?.planType);
```

**2. Caching Issues**
```typescript
// Force cache refresh
queryClient.invalidateQueries(['subscription', clubId]);
```

**3. Navigation Problems**
```typescript
// Verify route configuration
const navigate = useLocation();
navigate('/subscription'); // Korrekte Route verwenden
```

## Conclusion

Das Feature-Gating System bietet eine professionelle, benutzerfreundliche Lösung für subscription-basierte Zugriffskontrolle. Es verbessert die Benutzererfahrung erheblich durch elegante Upgrade-Prompts statt störende Fehlermeldungen.

**Wichtigste Vorteile:**
- Elegante UX statt Fehler
- Konsistente Implementation
- Sichere Server-side Validation
- Einfache Erweiterbarkeit
- Production-Ready Architecture