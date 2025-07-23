import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Users, 
  Calendar, 
  Trophy, 
  MapPin, 
  ArrowRight, 
  Shield, 
  BarChart3,
  Star,
  Building,
  MessageSquare,
  CheckCircle,
  Play
} from "lucide-react";

export function Landing() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: Users,
      title: "Mitgliederverwaltung",
      description: "Zentrale Verwaltung aller Vereinsmitglieder mit detaillierten Profilen, Rollen, Kontaktdaten und Mitgliederstatus. Automatische Kategorisierung nach Alter, Leistungsklasse und Aktivitätsstatus."
    },
    {
      icon: Trophy,
      title: "Team-Organisation", 
      description: "Intelligente Teamzusammenstellung basierend auf Verfügbarkeit, Leistungsniveau und Trainingszeiten. Automatische Mannschaftsaufstellung und Spielerstatistiken."
    },
    {
      icon: Calendar,
      title: "Terminplanung",
      description: "Vollautomatisierte Terminkoordination für Training, Spiele und Veranstaltungen. Konfliktserkennung, Benachrichtigungen und Integration mit externen Kalendern."
    },
    {
      icon: MapPin,
      title: "Anlagenverwaltung", 
      description: "Effiziente Buchung und Verwaltung aller Vereinsanlagen - Sportplätze, Hallen, Räume. Echtzeitübersicht der Verfügbarkeit und automatische Reservierungsbestätigung."
    },
    {
      icon: BarChart3,
      title: "Finanz-Dashboard",
      description: "Umfassende Finanzanalysen mit Mitgliedsbeiträgen, Ausgaben und Budgetplanung. Automatische Reports, Mahnwesen und Liquiditätsprognosen."
    },
    {
      icon: MessageSquare,
      title: "Kommunikation",
      description: "Integrierte Kommunikationsplattform für Trainer, Spieler und Eltern. Push-Benachrichtigungen, Gruppenchats und offizielle Vereinsmitteilungen."
    }
  ];

  const stats = [
    { number: "1.000+", label: "Aktive Vereine" },
    { number: "50.000+", label: "Mitglieder" },
    { number: "99,9%", label: "Verfügbarkeit" },
    { number: "4,9/5", label: "Bewertung" }
  ];

  const testimonials = [
    {
      name: "Michael Weber",
      role: "1. Vorstand SV Musterstadt • 480 Mitglieder",
      content: "Seit der Einführung von TeamIO haben wir unseren Verwaltungsaufwand um mehr als die Hälfte reduziert. Besonders die automatische Beitragsverwaltung und die digitalen Mitgliedsausweise haben uns enorm geholfen.",
      avatar: "MW"
    },
    {
      name: "Sarah Schmidt", 
      role: "Geschäftsführerin TC Beispielort • 12 Teams",
      content: "Die Trainingsplanung war früher ein Alptraum. Jetzt organisiert sich alles automatisch und die Trainer haben endlich direkten Kontakt zu den Eltern. Unsere Mitgliederzufriedenheit ist spürbar gestiegen.",
      avatar: "SS"
    },
    {
      name: "Thomas Müller",
      role: "Jugendleiter FC Sportfreunde • 8 Jugendmannschaften", 
      content: "TeamIO hat unsere Jugendarbeit revolutioniert. Die Eltern sind endlich immer informiert, die Anwesenheitslisten führen sich automatisch und wir haben einen perfekten Überblick über alle Altersklassen.",
      avatar: "TM"
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Hero Section - Clean & Premium */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800" />
        
        {/* Floating geometric shapes - very subtle */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-50/30 dark:bg-blue-900/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-purple-50/20 dark:bg-purple-900/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

        <div className="relative container mx-auto px-6 lg:px-8 text-center">
          <div className={`transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            
            {/* Premium badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mb-8">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3 animate-pulse" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Jetzt verfügbar • 2025</span>
            </div>
            
            {/* Hero headline - Clean typography */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-light text-gray-900 dark:text-white mb-6 leading-[1.1] tracking-tight">
              Die Zukunft der
              <br />
              <span className="font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                Vereinsverwaltung
              </span>
            </h1>
            
            {/* Elegant subtitle */}
            <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
              Moderne Plattform für zeitgemäße Sportvereine.
              <br className="hidden sm:block" />
              Intuitiv, cloudbasiert und zukunftssicher.
            </p>

            {/* Premium CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Button 
                size="lg" 
                className="group bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 font-medium px-12 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-0"
                onClick={() => window.location.href = "/api/login"}
              >
                Kostenlos starten
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                Kostenlos registrieren
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                Keine Kreditkarte erforderlich
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                DSGVO-konform
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-light text-gray-900 dark:text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Clean Grid */}
      <section className="py-24 lg:py-32">
        <div className="container mx-auto px-6 lg:px-8">
          
          {/* Section header */}
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 dark:text-white mb-6 leading-tight">
              Alles was moderne
              <br />
              <span className="font-medium">Vereine brauchen</span>
            </h2>
            
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto font-light">
              Von intelligenter Mitgliederverwaltung bis zu Echtzeit-Analytics.
              Eine All-in-One-Lösung für zeitgemäße Vereinsführung.
            </p>
          </div>

          {/* Clean feature grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="group border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-900">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                  </div>
                  
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-4">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Platform Benefits */}
      <section className="py-24 lg:py-32 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-light text-gray-900 dark:text-white mb-6">
                Warum TeamIO die
                <br />
                <span className="font-medium">richtige Wahl ist</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              
              {/* For Administrators */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-medium text-gray-900 dark:text-white mb-4">
                    Für Vereinsvorstände
                  </h3>
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-400">
                        <strong>Rechtssichere Mitgliederverwaltung</strong> mit DSGVO-konformen Datenbanken und automatischen Backup-Systemen
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-400">
                        <strong>Transparente Finanzen</strong> mit Echtzeit-Übersichten zu Mitgliedsbeiträgen, Ausgaben und Liquidität
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-400">
                        <strong>Automatisierte Prozesse</strong> reduzieren den Verwaltungsaufwand um bis zu 70%
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* For Trainers */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-medium text-gray-900 dark:text-white mb-4">
                    Für Trainer & Betreuer
                  </h3>
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-400">
                        <strong>Intelligente Trainingsplanung</strong> mit automatischer Berücksichtigung von Verfügbarkeiten und Leistungsständen
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-400">
                        <strong>Direkte Kommunikation</strong> mit Spielern und Eltern über integrierte Messaging-Funktionen
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-400">
                        <strong>Detaillierte Statistiken</strong> zur Leistungsentwicklung und Anwesenheit der Sportler
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

            </div>

            {/* Technical Features */}
            <div className="mt-16 pt-16 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-2xl font-medium text-gray-900 dark:text-white mb-8 text-center">
                Technische Highlights
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Cloud-basiert</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Sichere Datenhaltung in deutschen Rechenzentren mit 99,9% Verfügbarkeit
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">DSGVO-konform</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Vollständig rechtskonform mit deutschen und europäischen Datenschutzbestimmungen
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Mobile-First</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Optimiert für alle Geräte - Smartphone, Tablet und Desktop
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials - Enhanced */}
      <section className="py-24 lg:py-32 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-6 lg:px-8">
          
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 dark:text-white mb-6">
              Vertrauen durch
              <br />
              <span className="font-medium">Erfahrung</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto font-light">
              Über 1.000 Vereine setzen bereits auf TeamIO. Hier sind einige ihrer Erfolgsgeschichten.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300">
                
                {/* Quote */}
                <p className="text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
                  "{testimonial.content}"
                </p>
                
                {/* Author */}
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mr-4">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {testimonial.avatar}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                      {testimonial.name}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 leading-tight">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Additional stats */}
          <div className="mt-16 pt-16 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
              <div>
                <div className="text-3xl font-light text-gray-900 dark:text-white mb-2">98%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Weiterempfehlungsrate</div>
              </div>
              <div>
                <div className="text-3xl font-light text-gray-900 dark:text-white mb-2">70%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Weniger Verwaltungsaufwand</div>
              </div>
              <div>
                <div className="text-3xl font-light text-gray-900 dark:text-white mb-2">24/7</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Support & Verfügbarkeit</div>
              </div>
              <div>
                <div className="text-3xl font-light text-gray-900 dark:text-white mb-2">5★</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Durchschnittsbewertung</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Premium */}
      <section className="py-24 lg:py-32 relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-gray-100 dark:via-white dark:to-gray-100" />
        
        {/* Subtle pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.1),transparent)]" />
        
        <div className="relative container mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl xl:text-6xl font-light text-white dark:text-gray-900 mb-8 leading-tight">
            Bereit für die
            <br />
            <span className="font-medium">Zukunft?</span>
          </h2>
          
          <p className="text-xl text-gray-300 dark:text-gray-600 mb-12 max-w-3xl mx-auto font-light">
            Starten Sie noch heute und erleben Sie, wie einfach
            <br className="hidden sm:block" />
            moderne Vereinsverwaltung sein kann.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              className="group bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 font-medium px-10 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => window.location.href = "/api/login"}
            >
              Jetzt kostenlos starten
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </div>

          {/* Final trust indicators */}
          <div className="flex flex-wrap justify-center items-center gap-8 mt-12 text-sm text-gray-400 dark:text-gray-600">
            <span>✓ Kostenlos starten</span>
            <span>✓ Jederzeit kündbar</span>
            <span>✓ Deutscher Support</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Landing;