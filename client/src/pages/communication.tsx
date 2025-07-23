import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useClub } from "@/hooks/use-club";
import { usePage } from "@/contexts/PageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, Send, Users, Megaphone, Mail, Search } from "lucide-react";

export default function Communication() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { selectedClub } = useClub();
  const { setPage } = usePage();

  // Set page title
  useEffect(() => {
    setPage("Kommunikation", "Nachrichten und Ankündigungen verwalten");
  }, [setPage]);
  
  const [messageText, setMessageText] = useState('');
  const [recipient, setRecipient] = useState('all');
  const [subject, setSubject] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for demonstration
  const messages = [
    {
      id: 1,
      subject: "Training am Samstag verschoben",
      content: "Das Training der Herren 1 am Samstag wird aufgrund des Wetters verschoben...",
      sender: "Max Trainer",
      recipients: "Herren 1",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      type: "team"
    },
    {
      id: 2,
      subject: "Vereinsfest 2025 - Save the Date",
      content: "Liebe Mitglieder, unser Vereinsfest findet am 15. Juni 2025 statt...",
      sender: "Vereinsvorstand",
      recipients: "Alle Mitglieder",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      type: "announcement"
    },
    {
      id: 3,
      subject: "Neue Trainingszeiten",
      content: "Ab nächster Woche gelten neue Trainingszeiten für die Jugendmannschaften...",
      sender: "Jugendleiter",
      recipients: "Jugendtrainer",
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
      type: "info"
    }
  ];

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const handleSendMessage = () => {
    if (!messageText.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie eine Nachricht ein",
        variant: "destructive",
      });
      return;
    }

    // Here you would typically send the message via API
    toast({
      title: "Erfolgreich",
      description: "Nachricht wurde versendet",
    });

    setMessageText('');
    setSubject('');
  };

  const handleSendAnnouncement = () => {
    if (!subject.trim() || !messageText.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Felder aus",
        variant: "destructive",
      });
      return;
    }

    // Here you would typically send the announcement via API
    toast({
      title: "Erfolgreich",
      description: "Ankündigung wurde versendet",
    });

    setSubject('');
    setMessageText('');
  };

  const filteredMessages = messages.filter(message =>
    message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.sender.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!selectedClub) {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="text-center py-12">
          <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Kein Verein ausgewählt</h3>
          <p className="mt-1 text-sm text-gray-500">
            Bitte wählen Sie einen Verein aus, um zu kommunizieren.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6">

      <Tabs defaultValue="messages" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="messages">Nachrichten</TabsTrigger>
          <TabsTrigger value="compose">Verfassen</TabsTrigger>
          <TabsTrigger value="announcements">Ankündigungen</TabsTrigger>
          <TabsTrigger value="templates">Vorlagen</TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="space-y-6">
          {/* Search and Filter */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Nachrichten suchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Messages List */}
          <div className="space-y-4">
            {filteredMessages.map((message) => (
              <Card key={message.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {message.subject}
                        </h3>
                        <Badge 
                          variant={
                            message.type === 'announcement' ? 'default' :
                            message.type === 'team' ? 'secondary' : 'outline'
                          }
                        >
                          {message.type === 'announcement' ? 'Ankündigung' :
                           message.type === 'team' ? 'Team' : 'Info'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {message.content}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Von: {message.sender}</span>
                        <span>An: {message.recipients}</span>
                        <span>{message.timestamp.toLocaleString('de-DE')}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button variant="outline" size="sm">
                        Antworten
                      </Button>
                      <Button variant="outline" size="sm">
                        Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="compose" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Send className="w-5 h-5 mr-2" />
                Neue Nachricht verfassen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Empfänger
                  </label>
                  <Select value={recipient} onValueChange={setRecipient}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Mitglieder</SelectItem>
                      <SelectItem value="board">Vorstand</SelectItem>
                      <SelectItem value="trainers">Trainer</SelectItem>
                      <SelectItem value="teams">Specific Team</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Betreff
                  </label>
                  <Input
                    placeholder="Betreff eingeben..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nachricht
                </label>
                <Textarea
                  placeholder="Ihre Nachricht..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows={8}
                />
              </div>

              <div className="flex items-center justify-end space-x-4">
                <Button variant="outline">
                  Entwurf speichern
                </Button>
                <Button onClick={handleSendMessage} className="bg-primary-500 hover:bg-primary-600">
                  <Send className="w-4 h-4 mr-2" />
                  Senden
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="announcements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Megaphone className="w-5 h-5 mr-2" />
                Öffentliche Ankündigung erstellen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titel der Ankündigung
                </label>
                <Input
                  placeholder="z.B. Vereinsfest 2025"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inhalt der Ankündigung
                </label>
                <Textarea
                  placeholder="Beschreiben Sie Ihre Ankündigung..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows={10}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Megaphone className="w-5 h-5 text-blue-500 mt-0.5 mr-2" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">Hinweis</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Ankündigungen werden an alle Mitglieder gesendet und auf der Website veröffentlicht.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4">
                <Button variant="outline">
                  Vorschau
                </Button>
                <Button onClick={handleSendAnnouncement} className="bg-primary-500 hover:bg-primary-600">
                  <Megaphone className="w-4 h-4 mr-2" />
                  Ankündigung veröffentlichen
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Nachrichtenvorlagen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Training abgesagt</h4>
                    <p className="text-sm text-gray-600">
                      Vorlage für Trainingsabsagen aufgrund von Wetter oder anderen Umständen.
                    </p>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Spielergebnis</h4>
                    <p className="text-sm text-gray-600">
                      Vorlage für die Bekanntgabe von Spielergebnissen.
                    </p>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Vereinsveranstaltung</h4>
                    <p className="text-sm text-gray-600">
                      Vorlage für Einladungen zu Vereinsveranstaltungen.
                    </p>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Mitgliedsbeitrag</h4>
                    <p className="text-sm text-gray-600">
                      Vorlage für Erinnerungen an ausstehende Mitgliedsbeiträge.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
