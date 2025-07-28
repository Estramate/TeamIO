import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, X, Minus, Maximize2, Search, Users, Plus } from 'lucide-react';
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

export default function FloatingChatWidget() {
  const { selectedClub } = useClub();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get chat rooms only when widget is open to improve performance
  const { data: chatRooms = [], isLoading: roomsLoading } = useQuery({
    queryKey: [`/api/clubs/${selectedClub?.id}/chat/rooms`],
    enabled: !!selectedClub?.id && isOpen,
    staleTime: 60000, // 1 minute cache
    refetchInterval: isOpen ? 30000 : false, // Only poll when open
  });

  // Get messages for selected room - optimized for performance
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: [`/api/clubs/${selectedClub?.id}/chat/rooms/${selectedRoom?.id}/messages`],
    enabled: !!selectedClub?.id && !!selectedRoom?.id && isOpen && !isMinimized,
    staleTime: 30000, // 30 seconds cache
    refetchInterval: (isOpen && !isMinimized && selectedRoom) ? 10000 : false, // Only poll when actively viewing
  });

  // Calculate total unread messages
  const totalUnread = chatRooms.reduce((sum: number, room: ChatRoom) => sum + (room.unreadCount || 0), 0);

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
    if (isOpen && !isMinimized && selectedRoom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, selectedRoom]);

  // Update user activity only when widget is actively being used
  useEffect(() => {
    if (!selectedClub?.id || !isOpen || isMinimized) return;
    
    const updateActivity = () => {
      fetch(`/api/clubs/${selectedClub.id}/chat/activity`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      }).catch(() => {}); // Silent fail to avoid console spam
    };
    
    // Only update activity when actually using the chat
    updateActivity();
    const interval = setInterval(updateActivity, 120000); // Reduced frequency to 2 minutes
    
    return () => clearInterval(interval);
  }, [selectedClub?.id, isOpen, isMinimized]);

  const handleCreateRoom = () => {
    if (!newRoomName.trim()) return;
    
    createRoomMutation.mutate({
      name: newRoomName,
      type: 'group',
      description: 'Team Chat Raum'
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

  const filteredRooms = chatRooms.filter((room: ChatRoom) =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!selectedClub) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat Widget Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          size="icon"
        >
          <MessageCircle className="w-6 h-6" />
          {totalUnread > 0 && (
            <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white text-xs p-0 flex items-center justify-center">
              {totalUnread > 9 ? '9+' : totalUnread}
            </Badge>
          )}
        </Button>
      )}

      {/* Chat Widget Window */}
      {isOpen && (
        <Card className={cn(
          "w-80 h-96 shadow-xl border-0 overflow-hidden transition-all duration-200",
          isMinimized && "h-12"
        )}>
          {/* Header */}
          <CardHeader className="p-3 bg-blue-600 text-white flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <CardTitle className="text-sm font-medium">
                {selectedRoom ? selectedRoom.name : 'Team Chat'}
              </CardTitle>
              {totalUnread > 0 && !isMinimized && (
                <Badge className="bg-red-500 text-white text-xs">
                  {totalUnread}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 w-8 p-0 text-white hover:bg-blue-700"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsOpen(false);
                  setSelectedRoom(null);
                  setIsMinimized(false);
                }}
                className="h-8 w-8 p-0 text-white hover:bg-blue-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          {/* Content */}
          {!isMinimized && (
            <CardContent className="p-0 h-full flex flex-col">
              {!selectedRoom ? (
                // Room List View
                <div className="flex flex-col h-full">
                  {/* Search and Create */}
                  <div className="p-3 border-b space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Suche Chats..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-8 text-sm"
                      />
                    </div>
                    {showCreateRoom ? (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Raum Name"
                          value={newRoomName}
                          onChange={(e) => setNewRoomName(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
                          className="h-8 text-sm"
                        />
                        <Button size="sm" onClick={handleCreateRoom} disabled={createRoomMutation.isPending}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCreateRoom(true)}
                        className="w-full h-8"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Neuer Chat
                      </Button>
                    )}
                  </div>

                  {/* Rooms List */}
                  <ScrollArea className="flex-1">
                    {roomsLoading ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        Lade Chats...
                      </div>
                    ) : filteredRooms.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        {searchQuery ? 'Keine Chats gefunden' : 'Keine Chats vorhanden'}
                      </div>
                    ) : (
                      <div className="space-y-1 p-2">
                        {filteredRooms.map((room: ChatRoom) => (
                          <button
                            key={room.id}
                            onClick={() => setSelectedRoom(room)}
                            className="w-full text-left p-2 hover:bg-muted rounded transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                <div>
                                  <div className="font-medium text-sm">{room.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {room.type === 'group' ? 'Gruppe' : 'Direkt'}
                                  </div>
                                </div>
                              </div>
                              {room.unreadCount && room.unreadCount > 0 && (
                                <Badge className="bg-blue-500 text-white text-xs">
                                  {room.unreadCount}
                                </Badge>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              ) : (
                // Chat Room View
                <div className="flex flex-col h-full">
                  {/* Chat Header */}
                  <div className="p-3 border-b flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedRoom(null)}
                      className="p-1"
                    >
                      ← Zurück
                    </Button>
                    <div className="text-sm font-medium">{selectedRoom.name}</div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-3">
                    {messagesLoading ? (
                      <div className="text-center text-sm text-muted-foreground">
                        Lade Nachrichten...
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-sm text-muted-foreground">
                        Noch keine Nachrichten
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {messages.map((message: ChatMessage) => (
                          <div key={message.id} className="flex gap-2">
                            <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                              {message.sender.firstName?.[0] || message.sender.email[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-xs">
                                  {message.sender.firstName && message.sender.lastName
                                    ? `${message.sender.firstName} ${message.sender.lastName}`
                                    : message.sender.email}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(message.createdAt)}
                                </span>
                              </div>
                              <div className="text-xs bg-muted p-2 rounded break-words">
                                {message.content}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="p-3 border-t">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nachricht..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        disabled={sendMessageMutation.isPending}
                        className="h-8 text-sm"
                      />
                      <Button 
                        onClick={handleSendMessage} 
                        disabled={!newMessage.trim() || sendMessageMutation.isPending}
                        size="sm"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}