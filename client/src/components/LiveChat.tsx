import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Users, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { useClub } from '@/hooks/use-club';

interface ChatRoom {
  id: number;
  name: string;
  type: string;
  description?: string;
  lastActivity: string;
  unreadCount?: number;
}

interface ChatMessage {
  id: number;
  content: string;
  senderId: string;
  createdAt: string;
  sender: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export default function LiveChat() {
  const { selectedClub } = useClub();
  const queryClient = useQueryClient();
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get chat rooms - reduziertes Polling
  const { data: chatRooms = [], isLoading: roomsLoading } = useQuery({
    queryKey: [`/api/clubs/${selectedClub?.id}/chat/rooms`],
    enabled: !!selectedClub?.id,
    refetchInterval: false, // Kein automatisches Polling - verhindert Page-Reloads
    staleTime: 10 * 60 * 1000, // 10 Minuten Cache
  });

  // Get messages for selected room - reduziertes Polling
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: [`/api/clubs/${selectedClub?.id}/chat/rooms/${selectedRoom?.id}/messages`],
    enabled: !!selectedClub?.id && !!selectedRoom?.id,
    refetchInterval: false, // Kein automatisches Polling - verhindert Page-Reloads
    staleTime: 2 * 60 * 1000, // 2 Minuten Cache
  });

  // Create room mutation
  const createRoomMutation = useMutation({
    mutationFn: (roomData: { name: string; type: string; description?: string }) =>
      apiRequest(`/api/clubs/${selectedClub?.id}/chat/rooms`, {
        method: 'POST',
        body: JSON.stringify(roomData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clubs/${selectedClub?.id}/chat/rooms`] });
      setNewRoomName('');
      setShowCreateRoom(false);
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (messageData: { content: string; messageType?: string }) =>
      apiRequest(`/api/clubs/${selectedClub?.id}/chat/rooms/${selectedRoom?.id}/messages`, {
        method: 'POST',
        body: JSON.stringify(messageData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/clubs/${selectedClub?.id}/chat/rooms/${selectedRoom?.id}/messages`] 
      });
      setNewMessage('');
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update user activity periodically
  useEffect(() => {
    if (!selectedClub?.id) return;
    
    const updateActivity = () => {
      apiRequest(`/api/clubs/${selectedClub.id}/chat/activity`, {
        method: 'POST',
      }).catch(console.error);
    };
    
    updateActivity();
    const interval = setInterval(updateActivity, 60000); // Every minute
    
    return () => clearInterval(interval);
  }, [selectedClub?.id]);

  const handleCreateRoom = () => {
    if (!newRoomName.trim()) return;
    
    createRoomMutation.mutate({
      name: newRoomName,
      type: 'group',
      description: 'Vereins-Chat Raum'
    });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedRoom) return;
    
    sendMessageMutation.mutate({
      content: newMessage,
      messageType: 'text'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!selectedClub) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Bitte wählen Sie einen Verein aus, um den Chat zu nutzen.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Chat Rooms Sidebar */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Chat Räume
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateRoom(!showCreateRoom)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          {showCreateRoom && (
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Raum Name"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
              />
              <Button size="sm" onClick={handleCreateRoom} disabled={createRoomMutation.isPending}>
                Erstellen
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {roomsLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                Lädt Chat Räume...
              </div>
            ) : chatRooms.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                Keine Chat Räume gefunden. Erstellen Sie einen neuen Raum!
              </div>
            ) : (
              <div className="space-y-1">
                {chatRooms.map((room: ChatRoom) => (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoom(room)}
                    className={cn(
                      'w-full text-left p-3 hover:bg-muted transition-colors border-b',
                      selectedRoom?.id === room.id && 'bg-muted'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{room.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {room.type === 'group' ? 'Gruppenraum' : 'Direktnachricht'}
                        </div>
                      </div>
                      {room.unreadCount && room.unreadCount > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                          {room.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Messages */}
      <Card className="lg:col-span-2">
        {selectedRoom ? (
          <>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                {selectedRoom.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex flex-col h-full">
              <ScrollArea className="flex-1 p-4 h-[400px]">
                {messagesLoading ? (
                  <div className="text-center text-muted-foreground">
                    Lädt Nachrichten...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-muted-foreground">
                    Keine Nachrichten in diesem Raum. Schreiben Sie die erste!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message: ChatMessage) => (
                      <div key={message.id} className="flex gap-3">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                          {message.sender.firstName?.[0] || message.sender.email[0].toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {message.sender.firstName && message.sender.lastName
                                ? `${message.sender.firstName} ${message.sender.lastName}`
                                : message.sender.email}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(message.createdAt)}
                            </span>
                          </div>
                          <div className="text-sm bg-muted p-2 rounded-lg">
                            {message.content}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>
              
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Nachricht eingeben..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={sendMessageMutation.isPending}
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        ) : (
          <CardContent className="p-8 text-center text-muted-foreground h-full flex items-center justify-center">
            <div>
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>Wählen Sie einen Chat Raum aus, um zu beginnen</p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}