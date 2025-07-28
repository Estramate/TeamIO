import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Mail, Send, Loader2 } from 'lucide-react';
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
import { apiRequest } from '@/lib/queryClient';

type InviteFormData = z.infer<typeof emailInvitationFormSchema>;

interface InviteUserDialogProps {
  clubId: number;
  trigger?: React.ReactNode;
}

export function InviteUserDialog({ clubId, trigger }: InviteUserDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { roles, isLoading: rolesLoading } = useRoles();

  const form = useForm<InviteFormData>({
    resolver: zodResolver(emailInvitationFormSchema),
    defaultValues: {
      email: '',
      roleId: 1, // Member role ID
      personalMessage: '',
    },
  });

  const inviteUserMutation = useMutation({
    mutationFn: async (data: InviteFormData) => {
      return await apiRequest('POST', `/api/clubs/${clubId}/invitations/send`, data);
    },
    onSuccess: () => {
      toast({
        title: '✅ Einladung gesendet',
        description: 'Die E-Mail-Einladung wurde erfolgreich verschickt.',
      });
      form.reset();
      setOpen(false);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/clubs/${clubId}/invitations`] });
      queryClient.invalidateQueries({ queryKey: [`/api/clubs/${clubId}/members`] });
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
    inviteUserMutation.mutate(data);
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