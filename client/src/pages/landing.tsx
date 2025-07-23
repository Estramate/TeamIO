import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, MapPin, Euro, MessageCircle, Settings } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <Users className="text-white text-2xl" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">TeamIO</h1>
          </div>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Die moderne Lösung für professionelles Vereinsmanagement. 
            Verwalten Sie Mitglieder, Teams, Buchungen und Finanzen an einem Ort.
          </p>
          <Button 
            size="lg" 
            className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 text-lg"
            onClick={() => window.location.href = "/api/login"}
          >
            Jetzt anmelden
          </Button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="text-blue-500 text-2xl" />
              </div>
              <CardTitle>Mitgliederverwaltung</CardTitle>
              <CardDescription>
                Verwalten Sie alle Vereinsmitglieder mit umfassenden Profilen, Kontaktdaten und Teamzuordnungen.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Calendar className="text-green-500 text-2xl" />
              </div>
              <CardTitle>Terminplanung</CardTitle>
              <CardDescription>
                Planen Sie Trainings, Spiele und Veranstaltungen mit dem integrierten Kalender- und Buchungssystem.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <MapPin className="text-purple-500 text-2xl" />
              </div>
              <CardTitle>Anlagenverwaltung</CardTitle>
              <CardDescription>
                Verwalten Sie Ihre Sportanlagen und koordinieren Sie Buchungen effizient und konfliktfrei.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Euro className="text-orange-500 text-2xl" />
              </div>
              <CardTitle>Finanzmanagement</CardTitle>
              <CardDescription>
                Behalten Sie den Überblick über Mitgliedsbeiträge, Ausgaben und das Vereinsbudget.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="text-red-500 text-2xl" />
              </div>
              <CardTitle>Kommunikation</CardTitle>
              <CardDescription>
                Kommunizieren Sie effektiv mit Mitgliedern, Teams und Trainern über integrierte Nachrichten.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Settings className="text-gray-500 text-2xl" />
              </div>
              <CardTitle>Multi-Verein</CardTitle>
              <CardDescription>
                Verwalten Sie mehrere Vereine in einer Anwendung mit rollenbasierten Berechtigungen.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Database Integration Info */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Settings className="text-blue-500" />
              </div>
              <span>PostgreSQL Integration</span>
            </CardTitle>
            <CardDescription className="text-blue-800">
              Diese Anwendung nutzt eine vollständige PostgreSQL-Datenbank für sichere und skalierbare Datenspeicherung.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Vollständige CRUD-Operationen für alle Entitäten</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Multi-Verein-Datenmodell implementiert</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Rollenbasierte Berechtigungen (45+ Rollen)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Musterverein für Testzwecke vorkonfiguriert</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-500">
          <p>© 2025 TeamIO. Professionelles Vereinsmanagement für moderne Sportvereine.</p>
        </div>
      </div>
    </div>
  );
}
