import { useState, useEffect } from "react";
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
      highlight: "Intelligent",
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

  return (
    <div className="min-h-screen bg-black dark:bg-white overflow-hidden">
      {/* 2025 Brutalist Full-Screen Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Raw background with organic shapes */}
        <div className="absolute inset-0 bg-black dark:bg-white">
          {/* Floating organic shapes */}
          <div className="absolute top-20 left-10 w-32 h-32 bg-white/5 dark:bg-black/5 rounded-[40%_60%_30%_70%] animate-pulse" />
          <div className="absolute top-40 right-20 w-48 h-48 bg-white/3 dark:bg-black/3 rounded-[60%_40%_70%_30%] animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-32 left-1/3 w-64 h-64 bg-white/2 dark:bg-black/2 rounded-[30%_70%_40%_60%] animate-pulse" style={{ animationDelay: '4s' }} />
          
          {/* Brutalist grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_97%,rgba(255,255,255,0.03)_98%,transparent_100%),linear-gradient(0deg,transparent_97%,rgba(255,255,255,0.03)_98%,transparent_100%)] dark:bg-[linear-gradient(90deg,transparent_97%,rgba(0,0,0,0.03)_98%,transparent_100%),linear-gradient(0deg,transparent_97%,rgba(0,0,0,0.03)_98%,transparent_100%)] bg-[size:100px_100px]" />
        </div>

        {/* Asymmetric Layout */}
        <div className="relative w-full px-8 lg:px-16">
          {/* Left column - Text */}
          <div className="max-w-4xl">
            {/* Status indicator - Brutalist style */}
            <div className="inline-block mb-8 lg:mb-12">
              <div className="bg-white dark:bg-black text-black dark:text-white px-6 py-3 font-black text-sm tracking-widest uppercase border-2 border-white dark:border-black transform -rotate-1 hover:rotate-0 transition-transform duration-300">
                ● LIVE 2025
              </div>
            </div>
            
            {/* Brutalist Typography */}
            <h1 className="text-6xl sm:text-7xl lg:text-8xl xl:text-9xl font-black text-white dark:text-black mb-8 lg:mb-12 leading-[0.8] tracking-tighter">
              TEAM
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 dark:from-black dark:to-gray-600 italic transform inline-block -skew-x-12">
                IO
              </span>
            </h1>
            
            {/* Raw subtitle */}
            <div className="mb-16 lg:mb-20">
              <p className="text-2xl lg:text-3xl text-gray-300 dark:text-gray-700 font-light mb-4 leading-tight">
                Vereinsverwaltung.
                <br />
                Neu gedacht.
              </p>
              <div className="w-32 h-1 bg-white dark:bg-black transform -rotate-1" />
            </div>

            {/* Brutal CTA */}
            <div className="flex flex-col sm:flex-row gap-6">
              <Button 
                size="lg" 
                className="group bg-white dark:bg-black text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900 font-black px-12 py-6 text-xl uppercase tracking-wider border-4 border-white dark:border-black transform hover:-translate-y-1 hover:rotate-1 transition-all duration-300 rounded-none shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] dark:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]"
                onClick={() => window.location.href = "/api/login"}
              >
                START NOW
                <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
              </Button>
            </div>
          </div>
          
          {/* Right column - 3D-ish elements */}
          <div className="absolute right-8 lg:right-16 top-1/2 -translate-y-1/2 hidden lg:block">
            <div className="relative">
              {/* Floating cards with 3D effect */}
              <div className="w-64 h-40 bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-black/20 transform rotate-12 hover:rotate-6 transition-all duration-500">
                <div className="p-6">
                  <Users className="w-8 h-8 text-white dark:text-black mb-4" />
                  <div className="text-white dark:text-black font-bold text-lg">1000+</div>
                  <div className="text-white/70 dark:text-black/70 text-sm">VEREINE</div>
                </div>
              </div>
              
              <div className="w-64 h-40 bg-white/5 dark:bg-black/5 backdrop-blur-sm border border-white/10 dark:border-black/10 transform -rotate-6 hover:rotate-0 transition-all duration-500 mt-8 -ml-16">
                <div className="p-6">
                  <Trophy className="w-8 h-8 text-white dark:text-black mb-4" />
                  <div className="text-white dark:text-black font-bold text-lg">50K+</div>
                  <div className="text-white/70 dark:text-black/70 text-sm">MITGLIEDER</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Box Features Section */}
      <section className="py-24 lg:py-32 bg-white dark:bg-black relative overflow-hidden">
        {/* Background noise */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_98%,rgba(0,0,0,0.02)_99%,transparent_100%),linear-gradient(0deg,transparent_98%,rgba(0,0,0,0.02)_99%,transparent_100%)] dark:bg-[linear-gradient(90deg,transparent_98%,rgba(255,255,255,0.02)_99%,transparent_100%),linear-gradient(0deg,transparent_98%,rgba(255,255,255,0.02)_99%,transparent_100%)] bg-[size:50px_50px]" />
        
        <div className="container mx-auto px-8 lg:px-16 relative">
          {/* Brutal section header */}
          <div className="mb-20">
            <div className="inline-block mb-8">
              <div className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 font-black text-sm tracking-widest uppercase border-2 border-black dark:border-white transform rotate-1">
                ● FEATURES
              </div>
            </div>
            
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-black dark:text-white mb-8 leading-tight tracking-tighter">
              ALLES WAS
              <br />
              <span className="italic -skew-x-6">MODERNE</span> VEREINE
              <br />
              BRAUCHEN
            </h2>
          </div>

          {/* Asymmetric Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className={`group relative bg-gray-50 dark:bg-gray-950 border-2 border-black dark:border-white transform hover:-translate-y-2 hover:rotate-1 transition-all duration-300 ${
                  feature.size === 'large' ? 'sm:col-span-2 lg:col-span-2 lg:row-span-2' : 
                  feature.size === 'medium' ? 'sm:col-span-2 lg:col-span-2' : 
                  'sm:col-span-1 lg:col-span-1'
                }`}
              >
                <div className={`p-8 ${feature.size === 'large' ? 'lg:p-12' : 'lg:p-8'}`}>
                  {/* Icon and badge */}
                  <div className="flex items-start justify-between mb-6">
                    <div className={`bg-black dark:bg-white text-white dark:text-black p-4 border-2 border-black dark:border-white transform -rotate-3 group-hover:rotate-0 transition-transform duration-300 ${
                      feature.size === 'large' ? 'lg:p-5' : 'lg:p-4'
                    }`}>
                      <feature.icon className={`${feature.size === 'large' ? 'w-8 h-8 lg:w-10 lg:h-10' : 'w-6 h-6 lg:w-7 lg:h-7'}`} />
                    </div>
                    
                    <div className="bg-white dark:bg-black text-black dark:text-white px-3 py-1 text-xs font-black uppercase tracking-wider border border-black dark:border-white">
                      {feature.highlight}
                    </div>
                  </div>
                  
                  {/* Title */}
                  <h3 className={`font-black text-black dark:text-white mb-4 uppercase tracking-tight ${
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
                </div>
                
                {/* Corner accent */}
                <div className="absolute top-0 right-0 w-4 h-4 bg-black dark:bg-white transform rotate-45 translate-x-2 -translate-y-2" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - Raw Style */}
      <section className="py-24 lg:py-32 bg-gray-100 dark:bg-gray-900 relative">
        <div className="container mx-auto px-8 lg:px-16">
          {/* Section header */}
          <div className="mb-20">
            <div className="inline-block mb-8">
              <div className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 font-black text-sm tracking-widest uppercase border-2 border-black dark:border-white transform -rotate-1">
                ● TESTIMONIALS
              </div>
            </div>
            
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-black dark:text-white leading-tight tracking-tighter">
              VEREINE
              <br />
              <span className="italic skew-x-6">LIEBEN</span> TEAMIO
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-7xl">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="group relative">
                <div className="bg-white dark:bg-black border-4 border-black dark:border-white p-8 lg:p-12 transform hover:-translate-y-1 hover:rotate-1 transition-all duration-300">
                  {/* Quote mark */}
                  <div className="text-8xl text-black/10 dark:text-white/10 font-black leading-none mb-4">"</div>
                  
                  {/* Stars */}
                  <div className="flex mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-6 h-6 fill-black dark:fill-white text-black dark:text-white" />
                    ))}
                  </div>
                  
                  {/* Content */}
                  <p className="text-xl lg:text-2xl text-black dark:text-white mb-8 leading-relaxed font-medium">
                    {testimonial.content}
                  </p>
                  
                  {/* Author */}
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-black dark:bg-white text-white dark:text-black font-black text-2xl flex items-center justify-center border-2 border-black dark:border-white mr-6">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-black text-black dark:text-white text-lg uppercase">{testimonial.name}</div>
                      <div className="text-gray-600 dark:text-gray-400 font-medium">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - Maximum Impact */}
      <section className="py-24 lg:py-32 bg-black dark:bg-white relative overflow-hidden">
        {/* Organic shapes */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 right-10 w-40 h-40 bg-white/5 dark:bg-black/5 rounded-[60%_40%_30%_70%] animate-pulse" />
          <div className="absolute bottom-20 left-20 w-32 h-32 bg-white/3 dark:bg-black/3 rounded-[40%_60%_70%_30%] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="container mx-auto px-8 lg:px-16 text-center relative">
          {/* Status */}
          <div className="inline-block mb-12">
            <div className="bg-white dark:bg-black text-black dark:text-white px-6 py-3 font-black text-sm tracking-widest uppercase border-2 border-white dark:border-black">
              ● READY?
            </div>
          </div>
          
          {/* Dramatic headline */}
          <h2 className="text-6xl sm:text-7xl lg:text-8xl xl:text-9xl font-black text-white dark:text-black mb-12 leading-[0.8] tracking-tighter">
            STARTE
            <br />
            <span className="italic -skew-x-12">JETZT</span>
          </h2>
          
          {/* CTA */}
          <div className="mb-16">
            <Button 
              size="lg" 
              className="group bg-white dark:bg-black text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900 font-black px-20 py-8 text-2xl uppercase tracking-widest border-4 border-white dark:border-black transform hover:-translate-y-2 hover:-rotate-1 transition-all duration-300 rounded-none shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)] dark:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.1)]"
              onClick={() => window.location.href = "/api/login"}
            >
              GO
              <ArrowRight className="ml-4 h-8 w-8 group-hover:translate-x-3 transition-transform duration-300" />
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-white/70 dark:text-black/70 font-black text-sm uppercase tracking-widest">
            <div>● KOSTENLOS</div>
            <div>● SOFORT</div>
            <div>● KEINE KARTE</div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Landing;