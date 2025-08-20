import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import LandingPricing from "./LandingPricing";
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
      title: "Mitgliederverwaltung ohne Chaos",
      description: "Nie wieder Excel-Listen! Alle Mitgliederdaten an einem Ort, automatische Beitragsverwaltung und Kommunikation direkt über die Plattform."
    },
    {
      icon: Calendar,
      title: "Termine die jeder sieht", 
      description: "Schluss mit vergessenen Trainingszeiten! Gemeinsamer Kalender für alle Termine, automatische Erinnerungen und mobile App für unterwegs."
    },
    {
      icon: MapPin,
      title: "Platzbuchung revolutioniert",
      description: "Keine Doppelbuchungen mehr! Intelligente Platzverwaltung, sofortige Verfügbarkeitsanzeige und faire Buchungsregeln für alle Teams."
    },
    {
      icon: Trophy,
      title: "Teams perfekt organisiert", 
      description: "Von der Bambini bis zur 1. Mannschaft: Alle Teams übersichtlich verwaltet, Spielereinteilungen auf Knopfdruck und Trainer immer informiert."
    },
    {
      icon: BarChart3,
      title: "Finanzen endlich transparent",
      description: "Wer hat bezahlt? Wer schuldet noch? Automatische Beitragsübersicht, Mahnwesen und Reports für den Kassier - alles digital und korrekt."
    },
    {
      icon: MessageSquare,
      title: "Kommunikation die ankommt",
      description: "Wichtige Infos gehen nicht unter! Direkte Nachrichten, Vereinsankündigungen und Teamnews - alle erreichen alle, garantiert."
    }
  ];

  const stats = [
    { number: "2", label: "Aktive Vereine" },
    { number: "155+", label: "Verwaltete Mitglieder" },
    { number: "9", label: "Vereinsrollen" },
    { number: "Beta", label: "Status" }
  ];

  const testimonials = [
    {
      name: "SV Oberglan 1975",
      role: "Testverein",
      content: "Wir testen ClubFlow seit einigen Monaten mit über 31 Mitgliedern und 15 Teams. Die Grundfunktionen für Mitglieder- und Teamverwaltung funktionieren bereits solide.",
      avatar: "SV",
      rating: 4
    },
    {
      name: "Testverein", 
      role: "Beta-Tester",
      content: "Als zweiter Testverein evaluieren wir die Multi-Vereins-Funktionalität. Die rollenbasierte Zugriffskontrolle mit 9 verschiedenen Rollen ist sehr durchdacht.",
      avatar: "TV",
      rating: 4
    },
    {
      name: "Entwicklerteam",
      role: "ClubFlow Development",
      content: "Aktuell arbeiten wir intensiv an der Stabilisierung der Kernfunktionen. 155+ verwaltete Spieler und Mitglieder zeigen die Skalierbarkeit des Systems.",
      avatar: "CF",
      rating: 3
    },
    {
      name: "Alpha-Version",
      role: "Aktueller Status",
      content: "Beta-Status: Grundfunktionen stabil, kontinuierliche Entwicklung. Mobile Optimierung, Subscription-System und Super-Admin-Funktionen implementiert.",
      avatar: "αV",
      rating: 3
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
              <div className="w-2 h-2 bg-orange-500 rounded-full mr-3 animate-pulse" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Beta-Version • In aktiver Entwicklung • Aktuell 2 Testvereine • Reale Daten</span>
            </div>
            
            {/* Hero headline - Clean typography */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-light text-gray-900 dark:text-white mb-6 leading-[1.1] tracking-tight">
              Ihr Verein
              <br />
              <span className="font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                endlich digital
              </span>
            </h1>
            
            {/* Elegant subtitle */}
            <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
              Beta-Version in aktiver Entwicklung! ClubFlow wird aktuell von 2 Testvereinen
              <br className="hidden sm:block" />
              mit über 155 Mitgliedern erfolgreich getestet.
            </p>

            {/* Premium CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Button 
                size="lg" 
                className="group bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 font-medium px-12 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-0"
                onClick={() => window.location.href = "/login"}
              >
                Jetzt starten
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-orange-500" />
                Beta-Version
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                2 aktive Testvereine
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-blue-500" />
                155+ verwaltete Mitglieder
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
              Alles was Ihr
              <br />
              <span className="font-medium">Verein braucht</span>
            </h2>
            
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto font-light">
              Von der Mitgliederverwaltung bis zur Platzbuchung - ClubFlow digitalisiert
              alle Vereinsprozesse und spart Ihnen Zeit, Nerven und Geld.
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

      {/* Simple Benefits Section */}
      <section className="py-24 lg:py-32 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 dark:text-white mb-12">
              Warum ClubFlow
              <br />
              <span className="font-medium">die beste Wahl ist</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Beta-Entwicklung</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Aktive Entwicklung mit kontinuierlichen Updates und Verbesserungen
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Echte Daten</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Getestet mit realen Vereinsdaten - 2 Vereine, 155+ Mitglieder, 15+ Teams
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Sicher & Datenschutz</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  DSGVO-konform, sichere Server, österreichische Standards - Ihre Daten sind bestens geschützt
                </p>
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
              Aktueller Status
              <br />
              <span className="font-medium">der Beta-Version</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto font-light">
              Ehrliche Einblicke in den aktuellen Entwicklungsstand und echte Testerfahrungen.
            </p>
          </div>

          {/* Testimonials Grid - Responsive 4-column layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8 max-w-7xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-xl shadow-sm hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 flex flex-col">
                
                {/* Rating Stars */}
                <div className="flex items-center mb-4">
                  {Array.from({ length: 5 }, (_, i) => (
                    <svg
                      key={i}
                      className={`w-4 h-4 ${i < testimonial.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">({testimonial.rating}/5)</span>
                </div>

                {/* Content */}
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm mb-6 flex-grow">
                  "{testimonial.content}"
                </p>
                
                {/* Author */}
                <div className="flex items-center mt-auto">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs shadow-sm">
                    {testimonial.avatar}
                  </div>
                  <div className="ml-3">
                    <div className="font-medium text-gray-900 dark:text-white text-sm">{testimonial.name}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Call to action below testimonials */}
          <div className="mt-16 text-center">
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Interessiert an der Beta-Version? Kontaktieren Sie uns für einen Testverein-Zugang
            </p>
            <Button 
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium inline-flex items-center"
              onClick={() => window.location.href = "/login"}
            >
              <span>Beta-Zugang anfragen</span>
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <LandingPricing 
        onGetStarted={(planType) => {
          // Store selected plan in localStorage for after login
          localStorage.setItem('selectedPlan', planType);
          window.location.href = "/login";
        }}
      />

      {/* CTA Section - Premium */}
      <section className="py-24 lg:py-32 relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-gray-100 dark:via-white dark:to-gray-100" />
        
        {/* Subtle pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.1),transparent)]" />
        
        <div className="relative container mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl xl:text-6xl font-light text-white dark:text-gray-900 mb-8 leading-tight">
            Interesse an der
            <br />
            <span className="font-medium">Beta-Version?</span>
          </h2>
          
          <p className="text-xl text-gray-300 dark:text-gray-600 mb-12 max-w-3xl mx-auto font-light">
            ClubFlow befindet sich in aktiver Entwicklung. Aktuell testen 2 Vereine
            <br className="hidden sm:block" />
            mit über 155 Mitgliedern die Plattform erfolgreich.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              className="group bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 font-medium px-10 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => window.location.href = "/login"}
            >
              Demo ansehen
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </div>

          {/* Final trust indicators */}
          <div className="flex flex-wrap justify-center items-center gap-8 mt-12 text-sm text-gray-400 dark:text-gray-600">
            <span>⚠ Beta-Version</span>
            <span>✓ 2 aktive Testvereine</span>
            <span>✓ Kontinuierliche Entwicklung</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Landing;