/**
 * Dashboard component for users with pending/inactive memberships
 * Shows status and information while waiting for approval
 */

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Clock, CheckCircle, XCircle, UserPlus, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function PendingMembershipDashboard() {
  const { toast } = useToast();

  // Get user's membership status
  const { data: membershipStatus, isLoading } = useQuery({
    queryKey: ['/api/user/memberships/status'],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Lade Mitgliedschaftsstatus...</p>
        </div>
      </div>
    );
  }

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleJoinAnotherClub = () => {
    // Reset club selection to show onboarding wizard
    localStorage.removeItem('selectedClub');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Mitgliedschaftsantrag eingereicht
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Ihr Antrag wartet auf die Genehmigung des Administrators
          </p>
        </div>

        {/* Status Card */}
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-orange-800 dark:text-orange-200">
              <UserPlus className="w-5 h-5" />
              Antragsstatus
            </CardTitle>
            <CardDescription className="text-orange-700 dark:text-orange-300">
              {membershipStatus?.pendingMemberships || 0} ausstehende Mitgliedschaftsanträge
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100">
                <Clock className="w-3 h-3 mr-1" />
                Wartet auf Genehmigung
              </Badge>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">Was passiert als nächstes?</h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Ihr Mitgliedschaftsantrag wurde erfolgreich eingereicht</span>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span>Ein Administrator des Vereins wird Ihren Antrag prüfen</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span>Nach der Genehmigung erhalten Sie Zugang zu allen Vereinsfunktionen</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">💡 Hinweis</h4>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Die Bearbeitungszeit kann je nach Verein variieren. Sie erhalten eine Benachrichtigung, 
                sobald Ihr Antrag bearbeitet wurde.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={handleRefresh} variant="outline" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Status aktualisieren
          </Button>
          <Button onClick={handleJoinAnotherClub} variant="default" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Anderem Verein beitreten
          </Button>
        </div>

        {/* Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Über ClubFlow
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-gray-600 dark:text-gray-400">
              ClubFlow ist eine moderne Vereinsmanagement-Plattform, die Ihnen nach der Freischaltung 
              folgende Funktionen bietet:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium">Mitgliederverwaltung</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Verwalten Sie Ihr Profil und bleiben Sie mit anderen Mitgliedern in Kontakt
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Terminplanung</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Buchen Sie Anlagen und nehmen Sie an Veranstaltungen teil
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Team-Management</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Verwalten Sie Ihre Teams und Spielerzuordnungen
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Kommunikation</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Bleiben Sie über Ankündigungen und Nachrichten informiert
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}