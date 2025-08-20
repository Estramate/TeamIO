import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Plus, Mail, Send, Loader2, User, Users } from 'lucide-react';
import { emailInvitationFormSchema } from '@shared/schemas/core';
import type { z } from 'zod';
import { useRoles } from '@/hooks/useRoles';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useNotificationTriggers } from '@/utils/notificationTriggers';
import { apiRequest } from '@/lib/queryClient';

type InviteFormData = z.infer<typeof emailInvitationFormSchema>;

interface InviteUserDialogProps {
  clubId: number;
  trigger?: React.ReactNode;
}

export function InviteUserDialog({ clubId, trigger }: InviteUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [assignmentType, setAssignmentType] = useState<'none' | 'member' | 'player'>('none');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { roles, isLoading: rolesLoading } = useRoles();
  const { invalidateRelevantCache } = useNotificationTriggers();

  // Load members and players for assignment
  const { data: members = [], isLoading: membersLoading } = useQuery<any[]>({
    queryKey: [`/api/clubs/${clubId}/members`],
    enabled: open && assignmentType === 'member',
  });

  const { data: players = [], isLoading: playersLoading } = useQuery<any[]>({
    queryKey: [`/api/clubs/${clubId}/players`],
    enabled: open && assignmentType === 'player',
  });

  const form = useForm<InviteFormData>({
    resolver: zodResolver(emailInvitationFormSchema),
    defaultValues: {
      email: '',
      roleId: 1, // Member role ID
      personalMessage: '',
      memberId: undefined,
      playerId: undefined,
    },
  });

  const inviteUserMutation = useMutation({
    mutationFn: async (data: InviteFormData) => {
      return await apiRequest('POST', `/api/clubs/${clubId}/invitations/send`, data);
    },
    onSuccess: (_, variables) => {
      const roleDisplayName = roles?.find(r => r.id === variables.roleId)?.displayName || 'Mitglied';
      
      // Note: User invitation notifications can be implemented later
      
      toast({
        title: '✅ Einladung gesendet',
        description: 'Die E-Mail-Einladung wurde erfolgreich verschickt.',
      });
      form.reset();
      setAssignmentType('none');
      setOpen(false);
      
      // Smart cache invalidation
      invalidateRelevantCache('member', clubId);
      queryClient.invalidateQueries({ queryKey: [`/api/clubs/${clubId}/invitations`] });
    },
    onError: (error: any) => {
      const errorMessage = error.message || 'Fehler beim Senden der Einladung';
      toast({
        title: '❌ Fehler',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (data: InviteFormData) => {
    // Clear assignment fields based on assignment type
    const submitData = {
      ...data,
      memberId: assignmentType === 'member' ? data.memberId : undefined,
      playerId: assignmentType === 'player' ? data.playerId : undefined,
    };
    inviteUserMutation.mutate(submitData);
  };

  // Use roles from database instead of hardcoded options

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Benutzer einladen
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Neuen Benutzer einladen
          </DialogTitle>
          <DialogDescription>
            Senden Sie eine E-Mail-Einladung an eine neue Person, damit sie dem Verein beitreten kann.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-Mail-Adresse</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="beispiel@email.com"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Die E-Mail-Adresse der Person, die Sie einladen möchten.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="roleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rolle</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Rolle auswählen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {rolesLoading ? (
                        <SelectItem value="loading" disabled>
                          Lade Rollen...
                        </SelectItem>
                      ) : roles && roles.length > 0 ? (
                        roles.map((role) => (
                          <SelectItem key={role.id} value={role.id.toString()}>
                            {role.displayName}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-roles" disabled>
                          Keine Rollen verfügbar
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Die Rolle, die der neue Benutzer im Verein haben wird.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* User Assignment Section */}
            <div className="space-y-4 border-t pt-4">
              <div>
                <label className="text-sm font-medium">Account-Zuweisung</label>
                <p className="text-sm text-muted-foreground mb-3">
                  Weisen Sie den eingeladenen Benutzer direkt einem Mitglied oder Spieler zu
                </p>
                
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={assignmentType === 'none' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setAssignmentType('none');
                      form.setValue('memberId', undefined);
                      form.setValue('playerId', undefined);
                    }}
                  >
                    Keine Zuweisung
                  </Button>
                  <Button
                    type="button"
                    variant={assignmentType === 'member' ? 'default' : 'outline'}
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      setAssignmentType('member');
                      form.setValue('playerId', undefined);
                    }}
                  >
                    <User className="h-4 w-4" />
                    Mitglied
                  </Button>
                  <Button
                    type="button"
                    variant={assignmentType === 'player' ? 'default' : 'outline'}
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      setAssignmentType('player');
                      form.setValue('memberId', undefined);
                    }}
                  >
                    <Users className="h-4 w-4" />
                    Spieler
                  </Button>
                </div>
              </div>

              {/* Member Selection */}
              {assignmentType === 'member' && (
                <FormField
                  control={form.control}
                  name="memberId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mitglied auswählen</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                        value={field.value?.toString() || ''}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Mitglied auswählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {membersLoading ? (
                            <SelectItem value="loading" disabled>
                              Lade Mitglieder...
                            </SelectItem>
                          ) : members.length > 0 ? (
                            members
                              .sort((a: any, b: any) => a.lastName.localeCompare(b.lastName))
                              .map((member: any) => (
                                <SelectItem key={member.id} value={member.id.toString()}>
                                  {member.lastName}, {member.firstName}
                                </SelectItem>
                              ))
                          ) : (
                            <SelectItem value="no-members" disabled>
                              Keine Mitglieder verfügbar
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Das Mitglied, dem dieser Benutzer-Account zugewiesen wird
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Player Selection */}
              {assignmentType === 'player' && (
                <FormField
                  control={form.control}
                  name="playerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Spieler auswählen</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                        value={field.value?.toString() || ''}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Spieler auswählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {playersLoading ? (
                            <SelectItem value="loading" disabled>
                              Lade Spieler...
                            </SelectItem>
                          ) : players.length > 0 ? (
                            players
                              .sort((a: any, b: any) => a.lastName.localeCompare(b.lastName))
                              .map((player: any) => (
                                <SelectItem key={player.id} value={player.id.toString()}>
                                  {player.lastName}, {player.firstName}
                                </SelectItem>
                              ))
                          ) : (
                            <SelectItem value="no-players" disabled>
                              Keine Spieler verfügbar
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Der Spieler, dem dieser Benutzer-Account zugewiesen wird
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="personalMessage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Persönliche Nachricht (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Schreiben Sie eine persönliche Nachricht..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Eine optionale persönliche Nachricht, die in der Einladung enthalten ist.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={inviteUserMutation.isPending}
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                disabled={inviteUserMutation.isPending}
                className="gap-2"
              >
                {inviteUserMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Wird gesendet...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Einladung senden
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}