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
    <div className="min-h-screen bg-white dark:bg-black overflow-hidden">
      {/* Ultra Modern Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Advanced Background with Grid Pattern */}
        <div className="absolute inset-0">
          {/* Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-black dark:to-gray-900" />
          
          {/* Modern grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:6rem_4rem] opacity-30" />
          
          {/* Animated orbs */}
          <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-gradient-to-r from-gray-200/20 to-gray-300/20 dark:from-gray-700/20 dark:to-gray-600/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-gradient-to-l from-gray-300/15 to-gray-400/15 dark:from-gray-600/15 dark:to-gray-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          
          {/* Subtle texture overlay */}
          <div className="absolute inset-0 opacity-10 mix-blend-overlay bg-gradient-to-br from-gray-900/5 via-transparent to-gray-900/5 dark:from-white/5 dark:via-transparent dark:to-white/5" />
        </div>

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-6xl">
          <div className={`transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Modern status badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 mb-8">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3 animate-pulse" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">2025 • Jetzt verfügbar</span>
            </div>
            
            {/* Hero headline with improved typography */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-gray-900 dark:text-white mb-8 leading-[0.9] tracking-tight">
              Die Zukunft der
              <br />
              <span className="bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-gray-100 dark:via-gray-300 dark:to-gray-100 bg-clip-text text-transparent">
                Vereinsverwaltung
              </span>
            </h1>
            
            {/* Improved subtitle */}
            <p className="text-xl sm:text-2xl lg:text-3xl text-gray-600 dark:text-gray-400 mb-12 max-w-4xl mx-auto leading-relaxed font-light">
              Revolutionäre KI-gestützte Plattform für moderne Sportvereine.
              <br className="hidden sm:block" />
              <span className="text-gray-500 dark:text-gray-500">Intuitiv. Cloudbasiert. Zukunftssicher.</span>
            </p>

            {/* Modern CTA with enhanced styling */}
            <div className="flex justify-center items-center mb-16">
              <Button 
                size="lg" 
                className="group relative bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 font-semibold px-12 py-6 text-lg rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 border-0 overflow-hidden"
                onClick={() => window.location.href = "/api/login"}
              >
                {/* Button shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                
                <Sparkles className="mr-3 h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                Kostenlos starten
                <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </div>

            {/* Modern Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto">
              {stats.map((stat, index) => (
                <div 
                  key={index} 
                  className={`relative group transition-all duration-700 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                  style={{ transitionDelay: `${800 + index * 100}ms` }}
                >
                  <div className="relative p-6 rounded-3xl bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 hover:border-gray-300/70 dark:hover:border-gray-600/70 transition-all duration-300 hover:scale-105">
                    {/* Modern icon container */}
                    <div className="mb-4 flex justify-center">
                      <div className="p-3 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-100 dark:to-gray-200">
                        <stat.icon className="w-6 h-6 text-white dark:text-gray-900" />
                      </div>
                    </div>
                    
                    {/* Large number display */}
                    <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">{stat.number}</div>
                    
                    {/* Label */}
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</div>
                    
                    {/* Subtle accent */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-gray-900/0 via-gray-900/0 to-gray-900/5 dark:from-white/0 dark:via-white/0 dark:to-white/5 pointer-events-none" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Ultra Modern Features Section */}
      <section className="py-24 lg:py-32 bg-gray-50/50 dark:bg-gray-950/50 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-100/30 to-transparent dark:via-gray-800/30" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            {/* Modern section indicator */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gray-900/5 dark:bg-white/5 border border-gray-200/50 dark:border-gray-700/50 mb-8">
              <Target className="w-4 h-4 mr-2 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Funktionen</span>
            </div>
            
            {/* Enhanced headline */}
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-300 dark:to-white bg-clip-text text-transparent mb-8 leading-tight tracking-tight">
              Alles was moderne
              <br />
              Vereine brauchen
            </h2>
            
            {/* Enhanced description */}
            <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-400 max-w-4xl mx-auto leading-relaxed font-light">
              Von KI-gestützter Mitgliederverwaltung bis zu Echtzeit-Analytics.
              <br className="hidden sm:block" />
              <span className="text-gray-500 dark:text-gray-500">Eine All-in-One-Lösung für zeitgemäße Vereinsführung.</span>
            </p>
          </div>

          {/* Ultra Modern Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 max-w-7xl mx-auto">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className={`group relative overflow-hidden rounded-3xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 hover:border-gray-300/70 dark:hover:border-gray-600/70 transition-all duration-700 hover:scale-[1.02] cursor-pointer ${
                  feature.size === 'large' ? 'sm:col-span-2 lg:col-span-2 lg:row-span-2' : 
                  feature.size === 'medium' ? 'sm:col-span-2 lg:col-span-2' : 
                  'sm:col-span-1 lg:col-span-1'
                }`}
              >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900/0 via-gray-900/0 to-gray-900/5 dark:from-white/0 dark:via-white/0 dark:to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className={`relative p-8 ${feature.size === 'large' ? 'lg:p-12' : 'lg:p-8'}`}>
                  {/* Header with icon and badge */}
                  <div className="flex items-start justify-between mb-6">
                    <div className={`relative p-4 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-100 dark:to-gray-200 text-white dark:text-gray-900 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ${
                      feature.size === 'large' ? 'lg:p-5' : 'lg:p-4'
                    }`}>
                      {/* Icon glow effect */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gray-600/20 to-gray-900/20 dark:from-white/20 dark:to-gray-200/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <feature.icon className={`relative z-10 ${feature.size === 'large' ? 'w-8 h-8 lg:w-10 lg:h-10' : 'w-6 h-6 lg:w-7 lg:h-7'}`} />
                    </div>
                    
                    <div className="px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{feature.highlight}</span>
                    </div>
                  </div>
                  
                  {/* Title */}
                  <h3 className={`font-black text-gray-900 dark:text-white mb-4 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300 ${
                    feature.size === 'large' ? 'text-2xl lg:text-3xl' : 'text-xl lg:text-2xl'
                  }`}>
                    {feature.title}
                  </h3>
                  
                  {/* Description */}
                  <p className={`text-gray-600 dark:text-gray-400 leading-relaxed ${
                    feature.size === 'large' ? 'text-lg' : 'text-base'
                  }`}>
                    {feature.description}
                  </p>
                  
                  {/* Bottom accent line */}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modern Testimonials Section */}
      <section className="py-24 lg:py-32 bg-white dark:bg-black relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            {/* Section indicator */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gray-900/5 dark:bg-white/5 border border-gray-200/50 dark:border-gray-700/50 mb-8">
              <Heart className="w-4 h-4 mr-2 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Kundenstimmen</span>
            </div>
            
            {/* Enhanced headline */}
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-300 dark:to-white bg-clip-text text-transparent mb-8 leading-tight tracking-tight">
              Vereine lieben
              <br />
              TeamIO
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 max-w-7xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="group relative">
                {/* Modern testimonial card */}
                <div className="relative p-8 lg:p-12 rounded-3xl bg-gray-50/80 dark:bg-gray-950/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 hover:border-gray-300/70 dark:hover:border-gray-600/70 transition-all duration-500 hover:scale-[1.02]">
                  {/* Quote decoration */}
                  <div className="absolute top-6 left-6 text-6xl text-gray-200/50 dark:text-gray-700/50 font-serif leading-none">"</div>
                  
                  {/* Rating stars */}
                  <div className="flex mb-6 relative z-10">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-gray-800 dark:fill-gray-300 text-gray-800 dark:text-gray-300" />
                    ))}
                  </div>
                  
                  {/* Testimonial text */}
                  <p className="text-xl lg:text-2xl text-gray-700 dark:text-gray-300 mb-8 leading-relaxed font-light relative z-10">
                    {testimonial.content}
                  </p>
                  
                  {/* Author info */}
                  <div className="flex items-center relative z-10">
                    <div className="relative">
                      <div className="w-14 h-14 bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-200 dark:to-gray-100 rounded-2xl flex items-center justify-center text-white dark:text-gray-900 font-black text-xl mr-4 group-hover:scale-110 transition-transform duration-300">
                        {testimonial.name.charAt(0)}
                      </div>
                      {/* Avatar glow effect */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gray-600/20 to-gray-900/20 dark:from-white/20 dark:to-gray-200/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white text-lg">{testimonial.name}</div>
                      <div className="text-gray-600 dark:text-gray-400 font-medium">{testimonial.role}</div>
                    </div>
                  </div>
                  
                  {/* Bottom accent */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-b-3xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ultra Modern CTA Section */}
      <section className="py-24 lg:py-32 bg-gradient-to-br from-gray-900 via-black to-gray-900 dark:from-gray-100 dark:via-white dark:to-gray-100 relative overflow-hidden">
        {/* Advanced background effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.03)_0%,transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_30%,rgba(0,0,0,0.03)_0%,transparent_50%)]" />
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-gray-700/10 dark:bg-gray-300/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-gray-600/10 dark:bg-gray-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          {/* Status indicator */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 dark:bg-black/10 backdrop-blur-md border border-white/20 dark:border-black/20 mb-12">
            <Award className="w-4 h-4 mr-2 text-white dark:text-gray-900" />
            <span className="text-sm font-medium text-white dark:text-gray-900">Jetzt starten</span>
          </div>
          
          {/* Dramatic headline */}
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white dark:text-gray-900 mb-8 leading-tight tracking-tight">
            Bereit für die
            <br />
            <span className="bg-gradient-to-r from-gray-300 to-white dark:from-gray-700 dark:to-gray-900 bg-clip-text text-transparent">
              Zukunft?
            </span>
          </h2>
          
          {/* Enhanced description */}
          <p className="text-xl lg:text-2xl text-gray-300 dark:text-gray-600 mb-16 max-w-4xl mx-auto leading-relaxed font-light">
            Schließen Sie sich über 1.000 fortschrittlichen Vereinen an und revolutionieren Sie 
            <br className="hidden sm:block" />
            Ihre Vereinsverwaltung noch heute.
          </p>

          {/* Premium CTA button */}
          <div className="flex justify-center items-center mb-16">
            <Button 
              size="lg" 
              className="group relative bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 font-bold px-16 py-6 text-xl rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 border-0 overflow-hidden"
              onClick={() => window.location.href = "/api/login"}
            >
              {/* Button shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200/20 dark:via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              
              <TrendingUp className="mr-3 h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
              Kostenlos starten
              <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center items-center gap-6 text-sm font-medium text-gray-400 dark:text-gray-600">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2" />
              30-Tage-Testphase
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2" />
              Keine Kreditkarte
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2" />
              Sofort einsatzbereit
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Landing;