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
import { useQuery } from "@tanstack/react-query";

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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
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
  
  // Get members and teams for recipient selection
  const { data: members = [] } = useQuery<any[]>({
    queryKey: ['/api/clubs', selectedClub?.id, 'members'],
    enabled: !!selectedClub?.id,
  });
  
  const { data: teams = [] } = useQuery<any[]>({
    queryKey: ['/api/clubs', selectedClub?.id, 'teams'],
    enabled: !!selectedClub?.id,
  });
  
  // Get players for recipient selection
  const { data: players = [] } = useQuery<any[]>({
    queryKey: ['/api/clubs', selectedClub?.id, 'players'],
    enabled: !!selectedClub?.id,
  });
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
    (user as any)?.id?.toString() || ""
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

  // Additional state for message functionality
  const [messageText, setMessageText] = useState("");
  const [subject, setSubject] = useState("");
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>(["all"]);
  const [recipientType, setRecipientType] = useState<"all" | "teams" | "members" | "players">("all");

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

  // Use real messages from the API
  const displayMessages = messages || [];

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/';
    }
  }, [isAuthenticated, isLoading]);



  // Handle search
  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    
    const filteredMessages = displayMessages.filter(msg => 
      (msg.subject?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      msg.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (msg.sender?.firstName + ' ' + msg.sender?.lastName).toLowerCase().includes(searchTerm.toLowerCase())
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
      {/* Search and Status Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          {wsConnected && (
            <div className="flex items-center gap-2">
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
              {stats?.unreadMessages || displayMessages.length} ungelesen
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ankündigungen</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalAnnouncements || announcements?.length || 0}</div>
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
            {displayMessages.length > 0 ? (
              displayMessages.map((message) => (
                <Card key={message.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{message.subject || "Kein Betreff"}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>Von: {message.sender?.firstName} {message.sender?.lastName}</span>
                          <span>•</span>
                          <span>{formatDistanceToNow(new Date(message.createdAt), { addSuffix: true, locale: de })}</span>
                        </div>
                      </div>
                      <Badge variant={message.priority === 'high' ? 'destructive' : message.priority === 'medium' ? 'default' : 'secondary'}>
                        {message.priority === 'high' ? 'Hoch' : message.priority === 'medium' ? 'Mittel' : 'Normal'}
                      </Badge>
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
                    <Button variant="ghost" size="sm" onClick={() => markMessageAsRead(message.id)}>
                      <Eye className="w-4 h-4 mr-2" />
                      Als gelesen markieren
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <MessageCircle className="w-12 h-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Nachrichten</h3>
                  <p className="text-gray-600 text-center mb-4">
                    Sie haben noch keine Nachrichten erhalten. Sobald Ihnen jemand schreibt, erscheinen die Nachrichten hier.
                  </p>
                  <Button onClick={() => setShowNewMessage(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Erste Nachricht senden
                  </Button>
                </CardContent>
              </Card>
            )}
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

          <div className="grid gap-4">
            {announcements?.length > 0 ? (
              announcements.map((announcement) => (
                <Card key={announcement.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {announcement.isPinned && <Pin className="w-5 h-5 text-blue-600" />}
                      {announcement.title}
                    </CardTitle>
                    <CardDescription>
                      Veröffentlicht von {announcement.author?.firstName} {announcement.author?.lastName} • 
                      {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true, locale: de })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{announcement.content}</p>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="flex gap-2">
                      <Badge variant="secondary">
                        <Megaphone className="w-3 h-3 mr-1" />
                        {announcement.category === 'general' ? 'Allgemein' :
                         announcement.category === 'training' ? 'Training' :
                         announcement.category === 'event' ? 'Veranstaltung' :
                         announcement.category === 'important' ? 'Wichtig' : announcement.category}
                      </Badge>
                      {announcement.isPinned && <Badge variant="outline">Angepinnt</Badge>}
                      <Badge variant={announcement.priority === 'high' ? 'destructive' : announcement.priority === 'medium' ? 'default' : 'secondary'}>
                        {announcement.priority === 'high' ? 'Hoch' : announcement.priority === 'medium' ? 'Mittel' : 'Normal'}
                      </Badge>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Eye className="w-4 h-4 mr-1" />
                      <span>{announcement.viewCount} Aufrufe</span>
                    </div>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Megaphone className="w-12 h-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Ankündigungen</h3>
                  <p className="text-gray-600 text-center mb-4">
                    Es wurden noch keine Ankündigungen veröffentlicht. Erstellen Sie die erste Ankündigung für Ihren Verein.
                  </p>
                  <Button onClick={() => setShowNewAnnouncement(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Erste Ankündigung erstellen
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
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
      <Dialog open={showNewMessage} onOpenChange={setShowNewMessage}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neue Nachricht</DialogTitle>
            <DialogDescription>
              Senden Sie eine Nachricht an Mitglieder, Teams oder alle Vereinsmitglieder
            </DialogDescription>
          </DialogHeader>
          
          <Form {...messageForm}>
            <form onSubmit={(e) => {
              e.preventDefault();
              
              if (!messageText.trim()) {
                toast({
                  title: "Fehler",
                  description: "Bitte geben Sie eine Nachricht ein",
                  variant: "destructive",
                });
                return;
              }
              
              if (recipientType !== "all" && selectedRecipients.length === 0) {
                toast({
                  title: "Fehler", 
                  description: "Bitte wählen Sie mindestens einen Empfänger aus",
                  variant: "destructive",
                });
                return;
              }
              
              const messageData = {
                subject: subject || "Keine Betreff",
                content: messageText,
                messageType: "direct",
                priority: "normal",
                recipients: selectedRecipients.map(recipient => {
                  if (recipient === "all") {
                    return { type: "all" };
                  } else if (recipient.startsWith("team_")) {
                    return { type: "team", id: recipient.replace("team_", "") };
                  } else if (recipient.startsWith("member_")) {
                    return { type: "member", id: recipient.replace("member_", "") };
                  } else if (recipient.startsWith("player_")) {
                    return { type: "player", id: recipient.replace("player_", "") };
                  }
                  return { type: "all" };
                })
              };
              
              console.log("Sending message:", messageData);
              sendMessage(messageData);
              
              // Reset form
              setMessageText('');
              setSubject('');
              setSelectedRecipients(['all']);
              setRecipientType('all');
              setShowNewMessage(false);
              
              toast({
                title: "Nachricht gesendet",
                description: `Nachricht wurde an ${selectedRecipients.length === 1 && selectedRecipients[0] === 'all' ? 'alle Mitglieder' : selectedRecipients.length + ' Empfänger'} gesendet`,
              });
            }} className="space-y-4">
              
              <div className="space-y-4">
                <label className="text-sm font-medium">Empfänger auswählen</label>
                
                {/* Recipient Type Selection */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={recipientType === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setRecipientType("all");
                        setSelectedRecipients(["all"]);
                      }}
                    >
                      Alle ({(members as any[]).length})
                    </Button>
                    <Button
                      type="button"
                      variant={recipientType === "teams" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setRecipientType("teams");
                        setSelectedRecipients([]);
                      }}
                    >
                      Teams ({(teams as any[]).length})
                    </Button>
                    <Button
                      type="button"
                      variant={recipientType === "members" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setRecipientType("members");
                        setSelectedRecipients([]);
                      }}
                    >
                      Mitglieder ({(members as any[]).length})
                    </Button>
                    <Button
                      type="button"
                      variant={recipientType === "players" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setRecipientType("players");
                        setSelectedRecipients([]);
                      }}
                    >
                      Spieler ({(players as any[]).length})
                    </Button>
                  </div>
                </div>

                {/* Recipients List */}
                {recipientType !== "all" && (
                  <div className="space-y-2">
                    <ScrollArea className="h-48 border rounded-md p-3">
                      <div className="space-y-2">
                        {recipientType === "teams" && teams.map((team: any) => (
                          <div key={team.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`team_${team.id}`}
                              checked={selectedRecipients.includes(`team_${team.id}`)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedRecipients([...selectedRecipients, `team_${team.id}`]);
                                } else {
                                  setSelectedRecipients(selectedRecipients.filter(r => r !== `team_${team.id}`));
                                }
                              }}
                            />
                            <label
                              htmlFor={`team_${team.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {team.name}
                              <span className="text-xs text-gray-500 ml-2">
                                ({team.playerCount || 0} Spieler)
                              </span>
                            </label>
                          </div>
                        ))}
                        
                        {recipientType === "members" && members.map((member: any) => (
                          <div key={member.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`member_${member.id}`}
                              checked={selectedRecipients.includes(`member_${member.id}`)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedRecipients([...selectedRecipients, `member_${member.id}`]);
                                } else {
                                  setSelectedRecipients(selectedRecipients.filter(r => r !== `member_${member.id}`));
                                }
                              }}
                            />
                            <label
                              htmlFor={`member_${member.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {member.firstName} {member.lastName}
                              {member.email && (
                                <span className="text-xs text-gray-500 ml-2">
                                  ({member.email})
                                </span>
                              )}
                            </label>
                          </div>
                        ))}

                        {recipientType === "players" && players.map((player: any) => (
                          <div key={player.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`player_${player.id}`}
                              checked={selectedRecipients.includes(`player_${player.id}`)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedRecipients([...selectedRecipients, `player_${player.id}`]);
                                } else {
                                  setSelectedRecipients(selectedRecipients.filter(r => r !== `player_${player.id}`));
                                }
                              }}
                            />
                            <label
                              htmlFor={`player_${player.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {player.firstName} {player.lastName}
                              {player.email && (
                                <span className="text-xs text-gray-500 ml-2">
                                  ({player.email})
                                </span>
                              )}
                              <span className="text-xs text-blue-500 ml-2">
                                (Spieler)
                              </span>
                            </label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    
                    {/* Selected Recipients Summary */}
                    {selectedRecipients.length > 0 && (
                      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        <strong>Ausgewählt:</strong> {selectedRecipients.length} Empfänger
                        {recipientType === "teams" && (
                          <span className="ml-2">
                            ({selectedRecipients.filter(r => r.startsWith('team_')).length} Teams)
                          </span>
                        )}
                        {recipientType === "members" && (
                          <span className="ml-2">
                            ({selectedRecipients.filter(r => r.startsWith('member_')).length} Mitglieder)
                          </span>
                        )}
                        {recipientType === "players" && (
                          <span className="ml-2">
                            ({selectedRecipients.filter(r => r.startsWith('player_')).length} Spieler)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {/* All Members Summary */}
                {recipientType === "all" && (
                  <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                    <strong>Alle Vereinsmitglieder:</strong> {(members as any[]).length} Personen erhalten diese Nachricht
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Betreff (optional)</label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Betreff der Nachricht"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Nachricht *</label>
                <Textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Ihre Nachricht..."
                  className="min-h-32"
                  required
                />
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowNewMessage(false)}>
                  Abbrechen
                </Button>
                <Button type="submit" disabled={sendingMessage || !messageText.trim() || (recipientType !== "all" && selectedRecipients.length === 0)}>
                  <Send className="w-4 h-4 mr-2" />
                  {sendingMessage ? "Wird gesendet..." : "Senden"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* New Announcement Dialog */}
      <Dialog open={showNewAnnouncement} onOpenChange={setShowNewAnnouncement}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neue Ankündigung</DialogTitle>
            <DialogDescription>
              Erstellen Sie eine öffentliche Ankündigung für alle Vereinsmitglieder
            </DialogDescription>
          </DialogHeader>
          
          <Form {...announcementForm}>
            <form onSubmit={announcementForm.handleSubmit((data) => {
              createAnnouncement(data);
              setShowNewAnnouncement(false);
            })} className="space-y-4">
              
              <FormField
                control={announcementForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titel *</FormLabel>
                    <FormControl>
                      <Input placeholder="Titel der Ankündigung" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={announcementForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategorie</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Kategorie auswählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="general">Allgemein</SelectItem>
                        <SelectItem value="training">Training</SelectItem>
                        <SelectItem value="event">Veranstaltung</SelectItem>
                        <SelectItem value="important">Wichtig</SelectItem>
                        <SelectItem value="news">Neuigkeiten</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={announcementForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inhalt *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Inhalt der Ankündigung..."
                        className="min-h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={announcementForm.control}
                name="isPinned"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Als wichtig markieren
                      </FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Wichtige Ankündigungen werden oben angepinnt
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowNewAnnouncement(false)}>
                  Abbrechen
                </Button>
                <Button type="submit" disabled={creatingAnnouncement}>
                  <Megaphone className="w-4 h-4 mr-2" />
                  {creatingAnnouncement ? "Wird erstellt..." : "Veröffentlichen"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}