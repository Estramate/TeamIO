import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/contexts/ThemeContext";
import { 
  Users, 
  Calendar, 
  Building, 
  Trophy, 
  BarChart3, 
  MessageSquare, 
  Sun, 
  Moon, 
  ArrowRight,
  Shield,
  Zap,
  Target,
  CheckCircle
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Mitgliederverwaltung",
    description: "Verwalten Sie alle Vereinsmitglieder, Teams und Funktionäre zentral an einem Ort.",
  },
  {
    icon: Calendar,
    title: "Terminplanung",
    description: "Planen Sie Trainings, Spiele und Events mit unserem integrierten Kalendersystem.",
  },
  {
    icon: Building,
    title: "Anlagenverwaltung",
    description: "Buchen und verwalten Sie Sportanlagen, Räume und Equipment effizient.",
  },
  {
    icon: Trophy,
    title: "Mannschaftsorganisation",
    description: "Organisieren Sie alle Mannschaften mit Altersgruppen und Kategorien.",
  },
  {
    icon: BarChart3,
    title: "Finanzübersicht",
    description: "Behalten Sie Einnahmen, Ausgaben und Vereinsfinanzen im Blick.",
  },
  {
    icon: MessageSquare,
    title: "Kommunikation",
    description: "Interne Kommunikation zwischen Mitgliedern, Trainern und Vorstand.",
  },
];

const benefits = [
  "Zentrale Verwaltung aller Vereinsdaten",
  "Multi-Mandanten-System für mehrere Vereine",
  "Moderne, responsive Benutzeroberfläche",
  "Sichere Authentifizierung über Replit",
  "Anpassbare Vereinsfarben und Themes",
  "Vollständige DSGVO-Konformität"
];

export function Landing() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="rounded-lg bg-club-primary p-2">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-club-primary">TeamIO</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
              <span className="sr-only">Theme wechseln</span>
            </Button>
            
            <Button asChild className="bg-club-primary hover:bg-club-primary/90">
              <a href="/api/login">
                Anmelden
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <Badge className="mb-6 bg-club-primary/10 text-club-primary hover:bg-club-primary/20">
            <Zap className="mr-1 h-3 w-3" />
            Moderne Vereinsverwaltung
          </Badge>
          
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            Verwalten Sie Ihren{" "}
            <span className="text-club-primary">Sportverein</span>{" "}
            professionell
          </h1>
          
          <p className="mb-8 text-xl text-muted-foreground max-w-2xl mx-auto">
            TeamIO ist die moderne, webbasierte Lösung für die komplette Vereinsverwaltung. 
            Von der Mitgliederverwaltung bis zur Finanzübersicht – alles an einem Ort.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-club-primary hover:bg-club-primary/90 text-white px-8"
              asChild
            >
              <a href="/api/login">
                Jetzt starten
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
            
            <Button size="lg" variant="outline" className="border-club-primary text-club-primary hover:bg-club-primary/10">
              Demo ansehen
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-club-secondary/10 text-club-secondary">
              <Target className="mr-1 h-3 w-3" />
              Funktionen
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Alles was Ihr Verein braucht
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Entdecken Sie die umfassenden Funktionen von TeamIO für eine effiziente Vereinsverwaltung.
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="border-muted hover:border-club-primary/50 transition-colors">
                <CardHeader>
                  <div className="rounded-lg bg-club-primary/10 p-3 w-fit">
                    <feature.icon className="h-6 w-6 text-club-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-muted/50 py-24">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-club-accent/10 text-club-accent">
                <CheckCircle className="mr-1 h-3 w-3" />
                Vorteile
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight smtp:text-4xl mb-4">
                Warum TeamIO wählen?
              </h2>
              <p className="text-xl text-muted-foreground">
                Profitieren Sie von den Vorteilen einer modernen Vereinsverwaltung.
              </p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="rounded-full bg-club-primary p-1">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Bereit für die Zukunft der Vereinsverwaltung?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Starten Sie noch heute mit TeamIO und revolutionieren Sie die Verwaltung Ihres Sportvereins.
          </p>
          
          <Button 
            size="lg" 
            className="bg-club-primary hover:bg-club-primary/90 text-white px-8"
            asChild
          >
            <a href="/api/login">
              Kostenlos anmelden
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="rounded-lg bg-club-primary p-2">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-club-primary">TeamIO</span>
            </div>
            
            <div className="text-sm text-muted-foreground">
              © 2025 TeamIO. Moderne Vereinsverwaltung für Sportvereine.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}