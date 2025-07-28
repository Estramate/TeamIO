import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Send, Users, X, Minimize2, Maximize2, Phone, Video, Paperclip, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useClub } from '@/hooks/use-club';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/use-notifications';
import { apiRequest } from '@/lib/queryClient';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface ChatMessage {
  id: string;
  chatRoomId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  timestamp: string;
  isRead: boolean;
  readBy: string[];
}

interface ChatRoom {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'support';
  participants: {
    id: string;
    name: string;
    role: string;
    isOnline: boolean;
    lastSeen?: string;
  }[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: string;
}

interface LiveChatProps {
  className?: string;
}

function LiveChat({ className }: LiveChatProps) {
  const { selectedClub } = useClub();
  const { user } = useAuth();
  const { showInfo } = useNotifications();
  const queryClient = useQueryClient();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch chat rooms
  const { data: chatRooms = [], isLoading: roomsLoading } = useQuery<ChatRoom[]>({
    queryKey: ['/api/clubs', selectedClub?.id, 'chat-rooms'],
    enabled: !!selectedClub?.id && isOpen,
    refetchInterval: 5000, // Check for new rooms every 5 seconds
  });

  // Fetch messages for selected room
  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ['/api/clubs', selectedClub?.id, 'chat-rooms', selectedRoom, 'messages'],
    enabled: !!selectedClub?.id && !!selectedRoom && isOpen,
    refetchInterval: 2000, // Real-time message updates
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { content: string; messageType: string }) => {
      const response = await fetch(`/api/clubs/${selectedClub?.id}/chat-rooms/${selectedRoom}/messages`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'chat-rooms', selectedRoom, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'chat-rooms'] });
    },
  });

  // Create new chat room mutation
  const createRoomMutation = useMutation({
    mutationFn: async (roomData: { name: string; type: string; participantIds: string[] }) => {
      const response = await fetch(`/api/clubs/${selectedClub?.id}/chat-rooms`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create chat room');  
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'chat-rooms'] });
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle typing indicator
  useEffect(() => {
    if (newMessage.length > 0) {
      setIsTyping(true);
      const timer = setTimeout(() => setIsTyping(false), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsTyping(false);
    }
  }, [newMessage]);

  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim() || !selectedRoom) return;

    sendMessageMutation.mutate({
      content: newMessage.trim(),
      messageType: 'text'
    });
  }, [newMessage, selectedRoom, sendMessageMutation]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const unreadCount = (chatRooms || []).reduce((total, room) => total + room.unreadCount, 0);

  if (!isOpen) {
    return (
      <div className={cn("fixed bottom-6 right-6 z-50", className)}>
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-primary hover:bg-primary/90"
        >
          <MessageCircle className="h-6 w-6 mr-2" />
          Live Chat
          {unreadCount > 0 && (
            <Badge className="ml-2 bg-destructive text-destructive-foreground animate-pulse">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className={cn(
      "fixed bottom-6 right-6 z-50 transition-all duration-300",
      isMinimized ? "w-80 h-16" : "w-96 h-[600px]",
      className
    )}>
      <Card className="h-full flex flex-col shadow-2xl border-2">
        {/* Chat Header */}
        <CardHeader className="pb-3 bg-primary text-primary-foreground rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <CardTitle className="text-lg">
                {selectedRoom ? 
                  (chatRooms || []).find(r => r.id === selectedRoom)?.name || 'Chat' : 
                  'Live Chat'
                }
              </CardTitle>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="bg-primary-foreground text-primary">
                  {unreadCount}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              {selectedRoom && (
                <>
                  <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary/80">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary/80">
                    <Video className="h-4 w-4" />
                  </Button>
                </>
              )}
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-primary-foreground hover:bg-primary/80"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsOpen(false)}
                className="text-primary-foreground hover:bg-primary/80"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="flex-1 p-0 flex">
            {/* Chat Rooms Sidebar */}
            <div className="w-1/3 border-r bg-muted/20">
              <div className="p-3 border-b">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" className="w-full">
                      <Users className="h-4 w-4 mr-2" />
                      Neuer Chat
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Neuen Chat erstellen</DialogTitle>
                      <DialogDescription>
                        Starten Sie einen neuen Chat mit Vereinsmitgliedern
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Chat-Name</label>
                        <Input placeholder="z.B. Team-Besprechung" className="mt-1" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Teilnehmer</label>
                        <Input placeholder="Namen eingeben..." className="mt-1" />
                      </div>
                      <Button className="w-full">Chat erstellen</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <ScrollArea className="h-[400px]">
                <div className="p-2 space-y-1">
                  {roomsLoading ? (
                    <div className="p-4 text-center text-muted-foreground">
                      Lade Chats...
                    </div>
                  ) : (chatRooms || []).length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      Keine Chats vorhanden
                    </div>
                  ) : (
                    (chatRooms || []).map((room) => (
                      <div
                        key={room.id}
                        onClick={() => setSelectedRoom(room.id)}
                        className={cn(
                          "p-2 rounded-lg cursor-pointer transition-colors hover:bg-accent",
                          selectedRoom === room.id && "bg-accent"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {room.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {(room.participants || []).some(p => p.isOnline) && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium truncate">{room.name}</p>
                              {room.unreadCount > 0 && (
                                <Badge variant="destructive" className="text-xs h-5 w-5 p-0 flex items-center justify-center">
                                  {room.unreadCount}
                                </Badge>
                              )}
                            </div>
                            {room.lastMessage && (
                              <p className="text-xs text-muted-foreground truncate">
                                {room.lastMessage.content}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 flex flex-col">
              {selectedRoom ? (
                <>
                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messagesLoading ? (
                        <div className="text-center text-muted-foreground">
                          Lade Nachrichten...
                        </div>
                      ) : (messages || []).length === 0 ? (
                        <div className="text-center text-muted-foreground">
                          Noch keine Nachrichten in diesem Chat
                        </div>
                      ) : (
                        (messages || []).map((message) => (
                          <div
                            key={message.id}
                            className={cn(
                              "flex gap-2",
                              message.senderId === user?.id ? "justify-end" : "justify-start"
                            )}
                          >
                            {message.senderId !== user?.id && (
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {message.senderName.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            
                            <div className={cn(
                              "max-w-[70%] space-y-1",
                              message.senderId === user?.id ? "items-end" : "items-start"
                            )}>
                              {message.senderId !== user?.id && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium">{message.senderName}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {message.senderRole}
                                  </Badge>
                                </div>
                              )}
                              
                              <div className={cn(
                                "rounded-lg px-3 py-2 text-sm",
                                message.senderId === user?.id
                                  ? "bg-primary text-primary-foreground ml-auto"
                                  : "bg-muted"
                              )}>
                                {message.content}
                              </div>
                              
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(message.timestamp), 'HH:mm', { locale: de })}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  <Separator />

                  {/* Message Input */}
                  <div className="p-3 space-y-2">
                    {isTyping && (
                      <div className="text-xs text-muted-foreground">
                        {user?.email} tippt...
                      </div>
                    )}
                    
                    <div className="flex items-end gap-2">
                      <Button variant="ghost" size="sm" className="mb-1">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Nachricht eingeben..."
                        className="min-h-[40px] max-h-[120px] resize-none"
                        disabled={sendMessageMutation.isPending}
                      />
                      
                      <Button variant="ghost" size="sm" className="mb-1">
                        <Smile className="h-4 w-4" />
                      </Button>
                      
                      <Button 
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sendMessageMutation.isPending}
                        size="sm"
                        className="mb-1"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center p-8">
                  <div className="space-y-2">
                    <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h3 className="font-medium">Wählen Sie einen Chat</h3>
                    <p className="text-sm text-muted-foreground">
                      Klicken Sie auf einen Chat links oder erstellen Sie einen neuen
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

// LiveChatIndicator for Header
export function LiveChatIndicator() {
  const { selectedClub } = useClub();
  const [isOpen, setIsOpen] = useState(false);
  
  // Get unread chat count
  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ['/api/clubs', selectedClub?.id, 'chat-unread-count'],
    enabled: !!selectedClub?.id,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // 1 minute
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative text-foreground hover:bg-muted"
        >
          <MessageCircle className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px] h-[80vh] p-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle>Live Chat</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <LiveChat />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default LiveChat;

