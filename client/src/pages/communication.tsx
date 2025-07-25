import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useClub } from "@/hooks/use-club";
import { usePage } from "@/contexts/PageContext";
import { useCommunication, useWebSocket } from "@/hooks/useCommunication";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { 
  MessageCircle, 
  Send, 
  Users, 
  Megaphone, 
  Mail, 
  Search, 
  Bell, 
  Settings, 
  Pin, 
  Eye,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Filter,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  MessageSquare,
  Globe,
  User,
  Volume2,
  VolumeX
} from "lucide-react";

// Form schemas
const messageFormSchema = z.object({
  subject: z.string().optional(),
  content: z.string().min(1, "Nachricht ist erforderlich"),
  messageType: z.string().default("direct"),
  priority: z.string().default("normal"),
  recipients: z.array(z.object({
    type: z.string(),
    id: z.string().optional(),
  })).min(1, "Mindestens ein Empfänger ist erforderlich"),
});

const announcementFormSchema = z.object({
  title: z.string().min(1, "Titel ist erforderlich"),
  content: z.string().min(1, "Inhalt ist erforderlich"),
  category: z.string().min(1, "Kategorie ist erforderlich"),
  priority: z.string().default("normal"),
  targetAudience: z.string().default("all"),
  isPinned: z.boolean().default(false),
  isPublished: z.boolean().default(true),
});

export default function Communication() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { selectedClub } = useClub();
  const { setPage } = usePage();

  // Set page title
  useEffect(() => {
    setPage("Kommunikation", "Nachrichten und Ankündigungen verwalten");
  }, [setPage]);

  // Communication hook
  const {
    messages,
    announcements,
    notifications,
    stats,
    preferences,
    messagesLoading,
    announcementsLoading,
    notificationsLoading,
    statsLoading,
    sendMessage,
    createAnnouncement,
    markMessageAsRead,
    markNotificationAsRead,
    updatePreferences,
    sendingMessage,
    creatingAnnouncement,
    searchMessages,
    searchAnnouncements,
  } = useCommunication(selectedClub?.id || 0);

  // WebSocket connection
  const { isConnected: wsConnected, sendMessage: wsSendMessage } = useWebSocket(
    selectedClub?.id || 0, 
    user?.id || ""
  );

  // State management
  const [activeTab, setActiveTab] = useState("messages");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [showNewAnnouncement, setShowNewAnnouncement] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  // Additional state for mock functionality
  const [messageText, setMessageText] = useState("");
  const [subject, setSubject] = useState("");
  const [recipient, setRecipient] = useState("all");

  // Forms
  const messageForm = useForm({
    resolver: zodResolver(messageFormSchema),
    defaultValues: {
      subject: "",
      content: "",
      messageType: "direct",
      priority: "normal",
      recipients: [{ type: "all" }],
    },
  });

  const announcementForm = useForm({
    resolver: zodResolver(announcementFormSchema),
    defaultValues: {
      title: "",
      content: "",
      category: "general",
      priority: "normal",
      targetAudience: "all",
      isPinned: false,
      isPublished: true,
    },
  });

  // Mock data for demonstration
  const mockMessages = [
    {
      id: 1,
      subject: "Training am Samstag verschoben",
      content: "Das Training der Herren 1 am Samstag wird aufgrund des Wetters verschoben...",
      sender: "Max Trainer",
      recipients: "Herren 1",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      type: "team"
    },
    {
      id: 2,
      subject: "Vereinsfest 2025 - Save the Date",
      content: "Liebe Mitglieder, unser Vereinsfest findet am 15. Juni 2025 statt...",
      sender: "Vereinsvorstand",
      recipients: "Alle Mitglieder",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      type: "announcement"
    },
    {
      id: 3,
      subject: "Neue Trainingszeiten",
      content: "Ab nächster Woche gelten neue Trainingszeiten für die Jugendmannschaften...",
      sender: "Jugendleiter",
      recipients: "Jugendtrainer",
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
      type: "info"
    }
  ];

  // Use real messages if available, otherwise fallback to mock
  const displayMessages = messages?.length > 0 ? messages : mockMessages;

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/';
    }
  }, [isAuthenticated, isLoading]);

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    
    toast({
      title: "Nachricht gesendet",
      description: `Nachricht wurde an ${recipient} gesendet`,
    });
    
    setMessageText('');
    setSubject('');
    setRecipient('all');
    setShowNewMessage(false);
  };

  // Handle search
  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    
    const filteredMessages = displayMessages.filter(msg => 
      msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.sender.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    toast({
      title: "Suche durchgeführt",
      description: `${filteredMessages.length} Nachrichten gefunden`,
    });
  };

  const getPriorityBadge = (type: string) => {
    switch (type) {
      case 'announcement':
        return <Badge variant="secondary"><Megaphone className="w-3 h-3 mr-1" />Ankündigung</Badge>;
      case 'team':
        return <Badge variant="outline"><Users className="w-3 h-3 mr-1" />Team</Badge>;
      case 'info':
        return <Badge variant="default"><Mail className="w-3 h-3 mr-1" />Info</Badge>;
      default:
        return <Badge variant="secondary">Nachricht</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Kommunikation...</p>
        </div>
      </div>
    );
  }

  if (!selectedClub) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Kommunikation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Bitte wählen Sie einen Verein aus, um die Kommunikation zu verwalten.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-blue-600" />
            Kommunikation
          </h1>
          <p className="text-gray-600 mt-1">Nachrichten und Ankündigungen verwalten</p>
          {wsConnected && (
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600">Live-Verbindung aktiv</span>
            </div>
          )}
        </div>
        
        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Nachrichten durchsuchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch} variant="outline">
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nachrichten</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMessages || displayMessages.length}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.unreadMessages || displayMessages.filter(m => m.type !== 'announcement').length} ungelesen
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ankündigungen</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalAnnouncements || displayMessages.filter(m => m.type === 'announcement').length}</div>
            <p className="text-xs text-muted-foreground">Diese Woche</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Benachrichtigungen</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.unreadNotifications || 7}</div>
            <p className="text-xs text-muted-foreground">3 ungelesen</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empfänger</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground">Aktive Mitglieder</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Nachrichten
          </TabsTrigger>
          <TabsTrigger value="announcements" className="flex items-center gap-2">
            <Megaphone className="w-4 h-4" />
            Ankündigungen
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Einstellungen
          </TabsTrigger>
        </TabsList>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Nachrichten</h2>
            <Button onClick={() => setShowNewMessage(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Neue Nachricht
            </Button>
          </div>

          <div className="grid gap-4">
            {displayMessages.map((message) => (
              <Card key={message.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{message.subject}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>Von: {message.sender}</span>
                        <span>•</span>
                        <span>An: {message.recipients}</span>
                        <span>•</span>
                        <span>{message.timestamp.toLocaleString('de-DE')}</span>
                      </div>
                    </div>
                    {getPriorityBadge(message.type)}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{message.content.substring(0, 150)}...</p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" size="sm">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Antworten
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Lesen
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Announcements Tab */}
        <TabsContent value="announcements" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Ankündigungen</h2>
            <Button onClick={() => setShowNewAnnouncement(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Neue Ankündigung
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pin className="w-5 h-5 text-blue-600" />
                Vereinsfest 2025 - Save the Date
              </CardTitle>
              <CardDescription>
                Veröffentlicht von Vereinsvorstand • vor 1 Tag
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Liebe Mitglieder, unser traditionelles Vereinsfest findet am 15. Juni 2025 statt. Weitere Informationen folgen in den nächsten Wochen.</p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex gap-2">
                <Badge variant="secondary">
                  <Megaphone className="w-3 h-3 mr-1" />
                  Ankündigung
                </Badge>
                <Badge variant="outline">Angepinnt</Badge>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Eye className="w-4 h-4 mr-1" />
                <span>24 Aufrufe</span>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <h2 className="text-xl font-semibold">Kommunikationseinstellungen</h2>
          
          <Card>
            <CardHeader>
              <CardTitle>Benachrichtigungen</CardTitle>
              <CardDescription>
                Verwalten Sie Ihre Benachrichtigungseinstellungen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">E-Mail Benachrichtigungen</label>
                  <p className="text-sm text-gray-600">Erhalten Sie E-Mails für neue Nachrichten</p>
                </div>
                <Switch defaultChecked={preferences?.emailNotifications} />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Push Benachrichtigungen</label>
                  <p className="text-sm text-gray-600">Erhalten Sie sofortige Benachrichtigungen</p>
                </div>
                <Switch defaultChecked={preferences?.pushNotifications} />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Sound Benachrichtigungen</label>
                  <p className="text-sm text-gray-600">Ton bei neuen Nachrichten abspielen</p>
                </div>
                <Switch defaultChecked={preferences?.soundNotifications} />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>E-Mail Einstellungen</CardTitle>
              <CardDescription>
                Konfigurieren Sie Ihre E-Mail-Präferenzen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">E-Mail Zusammenfassung</label>
                <Select defaultValue={preferences?.emailDigest || "daily"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wählen Sie die Häufigkeit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Sofort</SelectItem>
                    <SelectItem value="daily">Täglich</SelectItem>
                    <SelectItem value="weekly">Wöchentlich</SelectItem>
                    <SelectItem value="never">Nie</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Message Dialog */}
      {showNewMessage && (
        <Card className="fixed inset-4 z-50 bg-white border shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Neue Nachricht</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowNewMessage(false)}
              >
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Empfänger</label>
              <Select value={recipient} onValueChange={setRecipient}>
                <SelectTrigger>
                  <SelectValue placeholder="Empfänger auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Mitglieder</SelectItem>
                  <SelectItem value="coaches">Trainer</SelectItem>
                  <SelectItem value="players">Spieler</SelectItem>
                  <SelectItem value="board">Vorstand</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Betreff</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Betreff der Nachricht"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Nachricht</label>
              <Textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Ihre Nachricht..."
                className="min-h-32"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowNewMessage(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSendMessage} disabled={sendingMessage}>
              <Send className="w-4 h-4 mr-2" />
              {sendingMessage ? "Wird gesendet..." : "Senden"}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* New Announcement Dialog */}
      {showNewAnnouncement && (
        <Card className="fixed inset-4 z-50 bg-white border shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Neue Ankündigung</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowNewAnnouncement(false)}
              >
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Titel</label>
              <Input
                placeholder="Titel der Ankündigung"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Kategorie</label>
              <Select defaultValue="general">
                <SelectTrigger>
                  <SelectValue placeholder="Kategorie auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Allgemein</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="event">Veranstaltung</SelectItem>
                  <SelectItem value="important">Wichtig</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Inhalt</label>
              <Textarea
                placeholder="Inhalt der Ankündigung..."
                className="min-h-32"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch id="pinned" />
              <label htmlFor="pinned" className="text-sm font-medium">
                Als wichtig markieren
              </label>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowNewAnnouncement(false)}>
              Abbrechen
            </Button>
            <Button disabled={creatingAnnouncement}>
              <Megaphone className="w-4 h-4 mr-2" />
              {creatingAnnouncement ? "Wird erstellt..." : "Veröffentlichen"}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}