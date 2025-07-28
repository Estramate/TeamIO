import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useClub } from '@/hooks/use-club';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  MessageCircle,
  Send,
  Users,
  X,
  Minimize2,
  Maximize2,
  Phone,
  Video,
  MoreVertical,
  Image,
  Paperclip,
  Smile,
  Search,
  Circle,
  Check,
  CheckCheck
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface ChatMessage {
  id: number;
  senderId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  messageType: 'text' | 'image' | 'file';
  replyTo?: number;
  sender: {
    firstName?: string;
    lastName?: string;
    email: string;
  };
}

interface ChatRoom {
  id: number;
  name: string;
  type: 'direct' | 'group' | 'team';
  participants: Array<{
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    isOnline: boolean;
    lastSeen?: string;
  }>;
  lastMessage?: ChatMessage;
  unreadCount: number;
}

export function LiveChatWidget() {
  const { user } = useAuth();
  const { selectedClub } = useClub();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Chat rooms query
  const { data: chatRooms = [], isLoading: roomsLoading } = useQuery<ChatRoom[]>({
    queryKey: ['/api/clubs', selectedClub?.id, 'chat-rooms'],
    enabled: !!selectedClub?.id && isOpen,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Messages query for selected room
  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ['/api/clubs', selectedClub?.id, 'chat-rooms', selectedRoom?.id, 'messages'],
    enabled: !!selectedClub?.id && !!selectedRoom && isOpen,
    refetchInterval: 2000, // Refresh every 2 seconds for real-time feel
  });

  // Online users query
  const { data: onlineUsers = [] } = useQuery<string[]>({
    queryKey: ['/api/clubs', selectedClub?.id, 'online-users'],
    enabled: !!selectedClub?.id && isOpen,
    refetchInterval: 10000, // Check online status every 10 seconds
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (messageData: { content: string; roomId: number; messageType?: string }) =>
      apiRequest('POST', `/api/clubs/${selectedClub?.id}/chat-rooms/${messageData.roomId}/messages`, {
        content: messageData.content,
        messageType: messageData.messageType || 'text',
      }),
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ 
        queryKey: ['/api/clubs', selectedClub?.id, 'chat-rooms', selectedRoom?.id, 'messages'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/clubs', selectedClub?.id, 'chat-rooms'] 
      });
    },
    onError: () => {
      toast({
        title: 'Fehler',
        description: 'Nachricht konnte nicht gesendet werden',
        variant: 'destructive',
      });
    },
  });

  // Mark messages as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (roomId: number) =>
      apiRequest('POST', `/api/clubs/${selectedClub?.id}/chat-rooms/${roomId}/mark-read`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/clubs', selectedClub?.id, 'chat-rooms'] 
      });
    },
  });

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Mark messages as read when room is selected
  useEffect(() => {
    if (selectedRoom && selectedRoom.unreadCount > 0) {
      markAsReadMutation.mutate(selectedRoom.id);
    }
  }, [selectedRoom?.id]);

  // Focus input when room is selected
  useEffect(() => {
    if (selectedRoom && inputRef.current && !isMinimized) {
      inputRef.current.focus();
    }
  }, [selectedRoom, isMinimized]);

  const handleSendMessage = () => {
    if (!message.trim() || !selectedRoom) return;
    
    sendMessageMutation.mutate({
      content: message.trim(),
      roomId: selectedRoom.id,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getDisplayName = (participant: any) => {
    if (participant.firstName && participant.lastName) {
      return `${participant.firstName} ${participant.lastName}`;
    }
    return participant.email.split('@')[0];
  };

  const formatMessageTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { 
      addSuffix: true, 
      locale: de 
    });
  };

  const filteredRooms = (chatRooms || []).filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (room.participants || []).some(p => 
      getDisplayName(p).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const totalUnreadCount = (chatRooms || []).reduce((sum, room) => sum + room.unreadCount, 0);

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-300 bg-blue-600 hover:bg-blue-700 relative"
        >
          <MessageCircle className="w-6 h-6 text-white" />
          {totalUnreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full">
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className={`w-80 bg-white shadow-2xl transition-all duration-300 ${
        isMinimized ? 'h-16' : 'h-96'
      }`}>
        {/* Chat Header */}
        <CardHeader className="p-3 bg-blue-600 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5" />
              <CardTitle className="text-sm">
                {selectedRoom ? selectedRoom.name : 'Team Chat'}
              </CardTitle>
              {selectedRoom && selectedRoom.type === 'direct' && (
                <div className="flex items-center space-x-1">
                  {(selectedRoom.participants || [])
                    .filter(p => p.id !== user?.id)
                    .map(participant => (
                      <div key={participant.id} className="flex items-center">
                        <Circle className={`w-2 h-2 ${
                          onlineUsers.includes(participant.id) ? 'text-green-400 fill-current' : 'text-gray-400'
                        }`} />
                      </div>
                    ))}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-1">
              {totalUnreadCount > 0 && (
                <Badge className="bg-red-500 text-white text-xs">
                  {totalUnreadCount}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:bg-blue-700 p-1"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-blue-700 p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0 flex flex-col h-80">
            {!selectedRoom ? (
              // Room List
              <div className="flex flex-col h-full">
                {/* Search */}
                <div className="p-3 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Suche Chats..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-8"
                    />
                  </div>
                </div>

                {/* Room List */}
                <ScrollArea className="flex-1">
                  {roomsLoading ? (
                    <div className="p-4 text-center text-gray-500">
                      Lade Chats...
                    </div>
                  ) : filteredRooms.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Keine Chats gefunden
                    </div>
                  ) : (
                    filteredRooms.map((room) => (
                      <div
                        key={room.id}
                        onClick={() => setSelectedRoom(room)}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className="relative">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                  {room.type === 'group' ? <Users className="w-4 h-4" /> : 
                                   room.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              {room.type === 'direct' && (room.participants || [])
                                .filter(p => p.id !== user?.id)
                                .some(p => onlineUsers.includes(p.id)) && (
                                <Circle className="absolute -bottom-1 -right-1 w-3 h-3 text-green-500 fill-current bg-white rounded-full" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {room.name}
                              </div>
                              {room.lastMessage && (
                                <div className="text-xs text-gray-500 truncate">
                                  {room.lastMessage.content}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            {room.lastMessage && (
                              <span className="text-xs text-gray-400">
                                {formatMessageTime(room.lastMessage.timestamp)}
                              </span>
                            )}
                            {room.unreadCount > 0 && (
                              <Badge className="bg-blue-600 text-white text-xs min-w-[18px] h-4 flex items-center justify-center">
                                {room.unreadCount > 99 ? '99+' : room.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </ScrollArea>
              </div>
            ) : (
              // Chat Messages
              <div className="flex flex-col h-full">
                {/* Chat Header */}
                <div className="p-3 border-b bg-gray-50">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedRoom(null)}
                      className="p-1"
                    >
                      ← Zurück
                    </Button>
                    <div className="text-sm font-medium">{selectedRoom.name}</div>
                    <div className="flex items-center space-x-1">
                      {selectedRoom.type === 'direct' && (
                        <>
                          <Button variant="ghost" size="sm" className="p-1">
                            <Phone className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="p-1">
                            <Video className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="sm" className="p-1">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-3">
                  {messagesLoading ? (
                    <div className="text-center text-gray-500 py-4">
                      Lade Nachrichten...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">
                      Noch keine Nachrichten
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg, index) => {
                        const isOwn = msg.senderId === user?.id;
                        const showSender = index === 0 || 
                          messages[index - 1].senderId !== msg.senderId;
                        
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                              {showSender && !isOwn && (
                                <div className="text-xs text-gray-500 mb-1 px-2">
                                  {getDisplayName(msg.sender)}
                                </div>
                              )}
                              <div
                                className={`rounded-2xl px-3 py-2 ${
                                  isOwn
                                    ? 'bg-blue-600 text-white rounded-br-sm'
                                    : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                                }`}
                              >
                                <div className="text-sm">{msg.content}</div>
                                <div className={`text-xs mt-1 flex items-center justify-end space-x-1 ${
                                  isOwn ? 'text-blue-200' : 'text-gray-500'
                                }`}>
                                  <span>{formatMessageTime(msg.timestamp)}</span>
                                  {isOwn && (
                                    msg.isRead ? (
                                      <CheckCheck className="w-3 h-3" />
                                    ) : (
                                      <Check className="w-3 h-3" />
                                    )
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                <div className="p-3 border-t bg-white">
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" className="p-1">
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="p-1">
                      <Image className="w-4 h-4" />
                    </Button>
                    <Input
                      ref={inputRef}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Nachricht schreiben..."
                      className="flex-1 h-8"
                      disabled={sendMessageMutation.isPending}
                    />
                    <Button variant="ghost" size="sm" className="p-1">
                      <Smile className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={handleSendMessage}
                      disabled={!message.trim() || sendMessageMutation.isPending}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white p-1"
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
    </div>
  );
}