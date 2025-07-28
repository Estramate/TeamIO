import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { usePage } from '@/contexts/PageContext';
import LiveChat from '@/components/LiveChat';
import { useWebSocket } from '@/hooks/useWebSocket';
import { MessageCircle, Users, Phone, Video, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ChatDemo() {
  const { setTitle, setSubtitle } = usePage();
  const { isConnected, lastMessage, sendMessage, reconnect, connectionStatus } = useWebSocket();
  const [testMessages, setTestMessages] = useState<any[]>([]);

  // Set page title
  setTitle('Live Chat Demo');
  setSubtitle('Testen Sie das Real-Time Chat-System zwischen Mitgliedern und Administratoren');

  const connectionStatusConfig = {
    connecting: { icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'Verbinden...' },
    connected: { icon: Wifi, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/20', text: 'Verbunden' },
    disconnected: { icon: WifiOff, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-900/20', text: 'Getrennt' },
    error: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/20', text: 'Fehler' }
  };

  const statusConfig = connectionStatusConfig[connectionStatus];
  const StatusIcon = statusConfig.icon;

  const sendTestMessage = () => {
    const testMsg = {
      type: 'test_message',
      data: {
        message: 'Test-Nachricht vom Chat Demo',
        timestamp: new Date().toISOString(),
        sender: 'Demo User'
      }
    };
    
    sendMessage(testMsg);
    setTestMessages(prev => [...prev, testMsg]);
  };

  return (
    <div className="space-y-6">
      {/* Demo Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Live Chat Demo</h1>
          <p className="text-muted-foreground mt-2">
            Interaktives Chat-System für Vereinsmitglieder und Administratoren
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg", statusConfig.bg)}>
            <StatusIcon className={cn("h-4 w-4", statusConfig.color)} />
            <span className="text-sm font-medium">{statusConfig.text}</span>
          </div>
          
          {connectionStatus === 'disconnected' || connectionStatus === 'error' ? (
            <Button onClick={reconnect} variant="outline" size="sm">
              Neu verbinden
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Chat Interface */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Live Chat Interface
            </CardTitle>
            <CardDescription>
              Vollständiges Chat-System mit Räumen, Teilnehmern und Real-Time Messaging
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[600px] border rounded-lg">
              <LiveChat />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Chat-Räume
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Vorstand-Chat</span>
              <Badge variant="secondary">2 Teilnehmer</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Support-Chat</span>
              <Badge variant="outline">1 Online</Badge>
            </div>
            <Separator />
            <p className="text-xs text-muted-foreground">
              Organisierte Gruppen-Chats für verschiedene Vereinsbereiche
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-500" />
              Real-Time Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">WebSocket</span>
              <Badge variant={isConnected ? "default" : "destructive"}>
                {isConnected ? "Verbunden" : "Getrennt"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Live Nachrichten</span>
              <Badge variant="secondary">Aktiv</Badge>
            </div>
            <Separator />
            <p className="text-xs text-muted-foreground">
              Sofortige Nachrichtenzustellung und Online-Status
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Video className="h-5 w-5 text-purple-500" />
              Erweiterte Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Video-Anrufe</span>
              <Badge variant="outline">Geplant</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Datei-Upload</span>
              <Badge variant="outline">In Entwicklung</Badge>
            </div>
            <Separator />
            <p className="text-xs text-muted-foreground">
              Zukünftige Erweiterungen für umfassende Kommunikation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* WebSocket Test Area */}
      <Card>
        <CardHeader>
          <CardTitle>WebSocket Test</CardTitle>
          <CardDescription>
            Testen Sie die Real-Time Verbindung und Nachrichtenübertragung
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button onClick={sendTestMessage} disabled={!isConnected}>
              Test-Nachricht senden
            </Button>
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
              )} />
              <span className="text-sm text-muted-foreground">
                {isConnected ? "WebSocket verbunden" : "WebSocket getrennt"}
              </span>
            </div>
          </div>
          
          {lastMessage && (
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-sm font-medium">Letzte WebSocket-Nachricht:</div>
              <pre className="text-xs mt-1 text-muted-foreground">
                {JSON.stringify(lastMessage, null, 2)}
              </pre>
            </div>
          )}
          
          {testMessages.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Gesendete Test-Nachrichten:</div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {testMessages.map((msg, index) => (
                  <div key={index} className="text-xs bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                    {msg.data.message} - {new Date(msg.data.timestamp).toLocaleTimeString()}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}