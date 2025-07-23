import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useClub } from "@/hooks/use-club";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Calendar, 
  Trophy, 
  MapPin, 
  ArrowRight, 
  Shield, 
  BarChart3,
  Star,
  Zap,
  Building,
  MessageSquare,
  Target,
  TrendingUp,
  Heart,
  Award,
  Sparkles
} from "lucide-react";

export function Landing() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Modern feature grid with bento-style layout
  const features = [
    {
      icon: Users,
      title: "Mitgliederverwaltung",
      description: "Zentrale Verwaltung aller Vereinsmitglieder mit detaillierten Profilen, Rollen und Kontaktdaten.",
      highlight: "KI-gestützt",
      size: "large"
    },
    {
      icon: Trophy,
      title: "Team-Organisation",
      description: "Intelligente Teamzusammenstellung nach Alter, Leistung und Verfügbarkeit.",
      highlight: "Smart Matching",
      size: "medium"
    },
    {
      icon: Calendar,
      title: "Terminplanung",
      description: "Automatisierte Terminkoordination mit Konfliktserkennung und Benachrichtigungen.",
      highlight: "Auto-Sync",
      size: "medium"
    },
    {
      icon: MapPin,
      title: "Anlagenverwaltung",
      description: "Effiziente Buchung und Verwaltung aller Vereinsanlagen mit Echtzeitübersicht.",
      highlight: "Real-time",
      size: "small"
    },
    {
      icon: BarChart3,
      title: "Finanz-Dashboard",
      description: "Übersichtliche Finanzanalysen mit automatischen Reports und Forecasting.",
      highlight: "Analytics",
      size: "small"
    },
    {
      icon: MessageSquare,
      title: "Kommunikation",
      description: "Integrierte Kommunikationsplattform für alle Vereinsmitglieder.",
      highlight: "Instant",
      size: "medium"
    },
  ];

  const stats = [
    { number: "1000+", label: "Aktive Vereine", icon: Building },
    { number: "50K+", label: "Verwaltete Mitglieder", icon: Users },
    { number: "99.9%", label: "Verfügbarkeit", icon: Shield },
    { number: "4.9", label: "Kundenbewertung", icon: Star },
  ];

  const testimonials = [
    {
      name: "Michael Weber",
      role: "Vorstand SV Musterstadt",
      content: "TeamIO hat unsere Vereinsverwaltung revolutioniert. Die Zeitersparnis ist enorm!",
      rating: 5
    },
    {
      name: "Sarah Schmidt",
      role: "Geschäftsführerin TC Beispielort",
      content: "Endlich eine moderne Lösung, die wirklich alle Bereiche abdeckt. Sehr empfehlenswert!",
      rating: 5
    }
  ];

  // For demo purposes, we show the main landing page for non-authenticated users

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Modern Hero Section with Subtle Gradients */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Subtle Grayscale Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.02)_0%,transparent_50%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03)_0%,transparent_50%)]" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gray-400/5 dark:bg-gray-600/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gray-500/5 dark:bg-gray-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <Badge variant="secondary" className="mb-6 sm:mb-8 bg-gray-900/10 dark:bg-white/10 text-gray-800 dark:text-gray-200 border-gray-300/30 dark:border-gray-600/30 backdrop-blur-sm px-4 sm:px-6 py-2 text-xs sm:text-sm">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              2025 • Moderne Vereinsverwaltung
            </Badge>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8 leading-tight px-2">
              Die Zukunft der
              <span className="block bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-300 dark:to-gray-100 bg-clip-text text-transparent">
                Vereinsverwaltung
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-4">
              TeamIO revolutioniert die Art, wie Sportvereine verwaltet werden. 
              KI-gestützt, intuitiv und komplett cloudbasiert.
            </p>

            <div className="flex justify-center items-center px-4">
              <Button 
                size="lg" 
                className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 font-semibold px-8 sm:px-12 py-4 sm:py-5 text-base sm:text-lg rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
                onClick={() => window.location.href = "/api/login"}
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Kostenlos starten
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-8 mt-10 sm:mt-16 lg:mt-20 max-w-4xl mx-auto px-4">
              {stats.map((stat, index) => (
                <div 
                  key={index} 
                  className={`text-center transition-all duration-700 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                  style={{ transitionDelay: `${800 + index * 150}ms` }}
                >
                  <div className="mb-2 sm:mb-4 flex justify-center">
                    <div className="p-2 sm:p-3 rounded-xl bg-gray-800/10 dark:bg-white/10 backdrop-blur-sm">
                      <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-gray-300" />
                    </div>
                  </div>
                  <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">{stat.number}</div>
                  <div className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Modern Bento Grid Features Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white dark:bg-gray-900 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <Badge variant="outline" className="mb-4 sm:mb-6 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm">
              <Target className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Alle Features
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-4 sm:mb-6">
              Alles was moderne Vereine brauchen
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto px-4">
              Von KI-gestützter Mitgliederverwaltung bis zu Echtzeit-Analytics. 
              TeamIO bietet eine All-in-One-Lösung für zeitgemäße Vereinsführung.
            </p>
          </div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className={`group hover:shadow-2xl transition-all duration-500 border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm hover:scale-105 cursor-pointer ${
                  feature.size === 'large' ? 'sm:col-span-2 lg:col-span-2 lg:row-span-2' : 
                  feature.size === 'medium' ? 'sm:col-span-2 lg:col-span-2' : 
                  'sm:col-span-1 lg:col-span-1'
                }`}
              >
                <CardHeader className={feature.size === 'large' ? 'p-6 sm:p-8' : 'p-4 sm:p-6'}>
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className={`p-2 sm:p-3 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 dark:from-gray-300 dark:to-gray-100 text-white dark:text-gray-900 group-hover:scale-110 transition-transform duration-300 ${
                      feature.size === 'large' ? 'sm:p-4' : 'sm:p-3'
                    }`}>
                      <feature.icon className={feature.size === 'large' ? 'w-6 h-6 sm:w-8 sm:h-8' : 'w-5 h-5 sm:w-6 sm:h-6'} />
                    </div>
                    <Badge variant="secondary" className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1">
                      {feature.highlight}
                    </Badge>
                  </div>
                  <CardTitle className={`font-bold group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors ${
                    feature.size === 'large' ? 'text-xl sm:text-2xl mb-3 sm:mb-4' : 'text-base sm:text-lg mb-2 sm:mb-3'
                  }`}>
                    {feature.title}
                  </CardTitle>
                  <CardDescription className={`text-gray-600 dark:text-gray-300 leading-relaxed ${
                    feature.size === 'large' ? 'text-base' : 'text-sm'
                  }`}>
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof & Testimonials */}
      <section className="py-24 bg-gray-50 dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-6 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2">
              <Heart className="w-4 h-4 mr-2" />
              Kundenstimmen
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-6">
              Vereine lieben TeamIO
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border border-gray-200 dark:border-gray-700 shadow-xl bg-white dark:bg-gray-900">
                <CardContent className="p-8">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-gray-400 text-gray-400 dark:fill-gray-500 dark:text-gray-500" />
                    ))}
                  </div>
                  <p className="text-lg text-gray-700 dark:text-gray-300 mb-6 italic">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-900 dark:from-gray-300 dark:to-gray-100 rounded-full flex items-center justify-center text-white dark:text-gray-900 font-bold text-lg mr-4">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Modern CTA Section */}
      <section className="py-24 bg-gradient-to-br from-gray-800 via-gray-900 to-black dark:from-gray-200 dark:via-gray-100 dark:to-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.05)_0%,transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_30%,rgba(0,0,0,0.05)_0%,transparent_50%)]" />
        <div className="container mx-auto px-4 text-center relative">
          <Badge variant="secondary" className="mb-8 bg-white/10 dark:bg-black/10 text-white dark:text-gray-900 border-white/20 dark:border-black/20 backdrop-blur-sm px-6 py-2">
            <Award className="w-4 h-4 mr-2" />
            Starten Sie jetzt
          </Badge>
          
          <h2 className="text-4xl lg:text-5xl font-bold text-white dark:text-gray-900 mb-6">
            Bereit für die Zukunft?
          </h2>
          
          <p className="text-xl text-gray-300 dark:text-gray-600 mb-12 max-w-2xl mx-auto">
            Schließen Sie sich über 1.000 fortschrittlichen Vereinen an und 
            revolutionieren Sie Ihre Vereinsverwaltung noch heute.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button 
              size="lg" 
              className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold px-12 py-4 text-lg rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
              onClick={() => window.location.href = "/api/login"}
            >
              <TrendingUp className="mr-2 h-5 w-5" />
              Kostenlos starten
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          <div className="mt-12 text-sm text-gray-400 dark:text-gray-600">
            ✓ Kostenlose 30-Tage-Testphase • ✓ Keine Kreditkarte erforderlich • ✓ Sofort einsatzbereit
          </div>
        </div>
      </section>
    </div>
  );
}

export default Landing;