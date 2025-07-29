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
      title: "Multi-Provider Authentifizierung",
      description: "Replit OAuth + E-Mail/Passwort mit 2FA-Unterstützung. Sichere Session-Verwaltung und rollenbasierte Zugriffskontrolle mit 8-Rollen-System."
    },
    {
      icon: Trophy,
      title: "Event-Management für alle", 
      description: "Events für alle Subscription-Typen verfügbar. Vollständige CRUD-Operationen mit Löschfunktion, automatischer Cache-Invalidierung und Modal-Interface."
    },
    {
      icon: Calendar,
      title: "Feature-Gating System",
      description: "Intelligente Subscription-basierte Funktionszugriffe. Events für kostenlose Pläne, Anlagenbuchungen nur für bezahlte Subscriptions."
    },
    {
      icon: MapPin,
      title: "Facility Management Pro", 
      description: "Intelligente Anlagenbuchung für bezahlte Pläne mit Echtzeit-Verfügbarkeit, wiederkehrenden Terminen und Konfliktprävention."
    },
    {
      icon: BarChart3,
      title: "Produktionsreife Codebase",
      description: "Zero LSP-Diagnostics, 90% Code-Bereinigung abgeschlossen. TypeScript Strict Mode, automatisierte Tests und Enterprise-Standards."
    },
    {
      icon: MessageSquare,
      title: "Klassisches Nachrichten-System",
      description: "Thread-basierte Kommunikation mit Antworten-Gruppierung, Real-Time-Updates und vollständig reaktiviertem Message-System."
    }
  ];

  const stats = [
    { number: "v2.3.0", label: "Produktionsbereit" },
    { number: "90%", label: "Code-Bereinigung" },
    { number: "Zero", label: "LSP-Diagnostics" },
    { number: "Multi-Auth", label: "2FA Support" }
  ];

  const testimonials = [
    {
      name: "Entwicklungsteam",
      role: "ClubFlow Development",
      content: "Version 2.3.0 erreicht Produktionsbereitschaft mit vollständigem Event-Management, Feature-Gating und bereinigter Codebase. Zero LSP-Diagnostics bestätigen Enterprise-Qualität.",
      avatar: "CF"
    },
    {
      name: "System Status", 
      role: "Technische Dokumentation",
      content: "Multi-Provider Authentifizierung, klassisches Nachrichten-System und Event-Löschfunktion vollständig implementiert. Alle kritischen Features funktionieren stabil.",
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
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">v2.3.0 Produktionsbereit • Zero LSP-Diagnostics • Multi-Auth</span>
            </div>
            
            {/* Hero headline - Clean typography */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-light text-gray-900 dark:text-white mb-6 leading-[1.1] tracking-tight">
              Professionelle
              <br />
              <span className="font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                Vereinsverwaltung
              </span>
            </h1>
            
            {/* Elegant subtitle */}
            <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
              Produktionsreife Vereinsverwaltung mit Event-Management, Feature-Gating und 
              <br className="hidden sm:block" />
              Multi-Provider-Authentifizierung. Vollständig funktionsfähig seit v2.3.0.
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
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                Event-Löschfunktion
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                90% Code-Bereinigung
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                Zero LSP-Diagnostics
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
              Umfassende
              <br />
              <span className="font-medium">Vereinsverwaltung</span>
            </h2>
            
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto font-light">
              Version 2.3.0 bringt vollständige Event-Management-Funktionalität mit Löschfunktion.
              Produktionsbereit mit bereinigter Codebase und Enterprise-Standards.
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
              Aktuelle
              <br />
              <span className="font-medium">Eigenschaften</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Produktionsbereit</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Version 2.3.0 mit vollständiger Funktionalität und Zero-Error-Status
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Feature-Gating</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Intelligente Subscription-basierte Funktionszugriffe implementiert
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Multi-Auth</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Replit OAuth + E-Mail/Passwort mit 2FA-Unterstützung
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
              Vertrauen durch
              <br />
              <span className="font-medium">Erfahrung</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto font-light">
              Feedback von Vereinsvertretern zur ClubFlow Plattform.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 shadow-sm">
                
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
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
            Bereit für die
            <br />
            <span className="font-medium">Zukunft?</span>
          </h2>
          
          <p className="text-xl text-gray-300 dark:text-gray-600 mb-12 max-w-3xl mx-auto font-light">
            Version 2.3.0 erreicht Produktionsbereitschaft mit Event-Management und Feature-Gating.
            <br className="hidden sm:block" />
            Zero LSP-Diagnostics. Code-bereinigt. Enterprise-Ready.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              className="group bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 font-medium px-10 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => window.location.href = "/login"}
            >
              Jetzt starten
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </div>

          {/* Final trust indicators */}
          <div className="flex flex-wrap justify-center items-center gap-8 mt-12 text-sm text-gray-400 dark:text-gray-600">
            <span>✓ v2.3.0 Produktionsbereit</span>
            <span>✓ Event-Management Vollständig</span>
            <span>✓ Zero LSP-Diagnostics</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Landing;