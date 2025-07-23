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
      description: "Zentrale Verwaltung aller Vereinsmitglieder mit detaillierten Profilen und Rollen."
    },
    {
      icon: Trophy,
      title: "Team-Organisation",
      description: "Intelligente Teamzusammenstellung nach Verfügbarkeit und Leistungsniveau."
    },
    {
      icon: Calendar,
      title: "Terminplanung",
      description: "Automatisierte Koordination mit Konfliktserkennung und Benachrichtigungen."
    },
    {
      icon: MapPin,
      title: "Anlagenverwaltung",
      description: "Effiziente Buchung und Verwaltung aller Vereinsanlagen in Echtzeit."
    },
    {
      icon: BarChart3,
      title: "Finanz-Dashboard",
      description: "Übersichtliche Analysen mit automatischen Reports und Prognosen."
    },
    {
      icon: MessageSquare,
      title: "Kommunikation",
      description: "Integrierte Plattform für Vereinskommunikation und Nachrichten."
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
      role: "Vorstand SV Musterstadt",
      content: "TeamIO hat unsere Vereinsverwaltung komplett modernisiert. Die Zeitersparnis ist beeindruckend.",
      avatar: "MW"
    },
    {
      name: "Sarah Schmidt", 
      role: "Geschäftsführerin TC Beispielort",
      content: "Endlich eine Lösung, die alle Bereiche nahtlos verbindet. Absolut empfehlenswert.",
      avatar: "SS"
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
                className="group bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 font-medium px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-0"
                onClick={() => window.location.href = "/api/login"}
              >
                Kostenlos starten
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="lg"
                className="group text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium px-8 py-6 text-lg"
              >
                <Play className="mr-2 h-5 w-5" />
                Demo ansehen
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                Kostenlose Testphase
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

      {/* Testimonials - Minimal */}
      <section className="py-24 lg:py-32 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto px-6 lg:px-8">
          
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 dark:text-white mb-6">
              Vertrauen durch
              <br />
              <span className="font-medium">Erfahrung</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm">
                
                {/* Quote */}
                <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
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
                    <div className="font-medium text-gray-900 dark:text-white">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
            <span>✓ 30 Tage kostenfrei testen</span>
            <span>✓ Jederzeit kündbar</span>
            <span>✓ Deutscher Support</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Landing;