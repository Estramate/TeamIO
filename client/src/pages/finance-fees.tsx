import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useClub } from "@/hooks/use-club";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Users,
  Plus,
  Dumbbell,
  BarChart3,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";

// Form schemas mit Datumsvalidierung
const memberFeeFormSchema = z.object({
  memberId: z.string().min(1, "Mitglied ist erforderlich"),
  feeType: z.enum(['membership', 'training', 'registration', 'equipment']),
  amount: z.string().min(1, "Betrag ist erforderlich"),
  period: z.enum(['monthly', 'quarterly', 'yearly', 'one-time']),
  startDate: z.string().min(1, "Startdatum ist erforderlich"),
  endDate: z.string().optional(),
  description: z.string().optional(),
}).refine((data) => {
  // Prüfe dass Enddatum nicht vor Startdatum liegt
  if (data.endDate && data.startDate) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    return endDate >= startDate;
  }
  return true;
}, {
  message: "Enddatum darf nicht vor dem Startdatum liegen",
  path: ["endDate"]
});

const trainingFeeFormSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  description: z.string().optional(),
  feeType: z.enum(['training', 'coaching', 'camp', 'equipment']),
  amount: z.string().min(1, "Betrag ist erforderlich"),
  period: z.enum(['monthly', 'quarterly', 'yearly', 'one-time']),
  startDate: z.string().min(1, "Startdatum ist erforderlich"),
  endDate: z.string().optional(),
  targetType: z.enum(['team', 'player', 'both']),
  teamIds: z.array(z.string()).optional(),
  playerIds: z.array(z.string()).optional(),
}).refine((data) => {
  // Prüfe dass Enddatum nicht vor Startdatum liegt
  if (data.endDate && data.startDate) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    return endDate >= startDate;
  }
  return true;
}, {
  message: "Enddatum darf nicht vor dem Startdatum liegen",
  path: ["endDate"]
});

interface FeesTabContentProps {
  className?: string;
}

export function FeesTabContent({ className }: FeesTabContentProps) {
  const { toast } = useToast();
  const { selectedClub } = useClub();
  const queryClient = useQueryClient();

  const [isMemberFeeDialogOpen, setIsMemberFeeDialogOpen] = useState(false);
  const [isTrainingFeeDialogOpen, setIsTrainingFeeDialogOpen] = useState(false);
  const [editingMemberFee, setEditingMemberFee] = useState<any>(null);
  const [editingTrainingFee, setEditingTrainingFee] = useState<any>(null);
  const [viewingFee, setViewingFee] = useState<any>(null);
  const [selectedChartYear, setSelectedChartYear] = useState<number>(new Date().getFullYear());

  // Form hooks definiert NACH dem useState
  const memberFeeForm = useForm({
    resolver: zodResolver(memberFeeFormSchema),
    defaultValues: {
      memberId: '',
      feeType: 'membership' as const,
      amount: '',
      period: 'monthly' as const,
      startDate: '',
      endDate: '',
      description: '',
    }
  });

  const trainingFeeForm = useForm({
    resolver: zodResolver(trainingFeeFormSchema),
    defaultValues: {
      name: '',
      description: '',
      feeType: 'training' as const,
      amount: '',
      period: 'monthly' as const,
      startDate: '',
      endDate: '',
      targetType: 'team' as const,
      teamIds: [],
      playerIds: [],
    }
  });

  // Reset und vorbelegen der Formulare beim Öffnen der Edit-Modals
  React.useEffect(() => {
    if (editingMemberFee) {
      memberFeeForm.reset({
        memberId: editingMemberFee.memberId?.toString() || '',
        feeType: 'membership',
        amount: editingMemberFee.amount?.toString() || '',
        period: editingMemberFee.period || 'monthly',
        startDate: editingMemberFee.startDate?.split('T')[0] || '',
        endDate: editingMemberFee.endDate?.split('T')[0] || '',
        description: editingMemberFee.description || '',
      });
    }
  }, [editingMemberFee, memberFeeForm]);

  React.useEffect(() => {
    if (editingTrainingFee) {
      // Parse teamIds und playerIds falls sie als JSON gespeichert sind
      let teamIds = [];
      let playerIds = [];
      
      try {
        if (Array.isArray(editingTrainingFee.teamIds)) {
          teamIds = editingTrainingFee.teamIds.map((id: any) => typeof id === 'string' ? parseInt(id) : id);
        } else if (typeof editingTrainingFee.teamIds === 'string') {
          const parsed = JSON.parse(editingTrainingFee.teamIds || '[]');
          teamIds = Array.isArray(parsed) ? parsed.map((id: any) => typeof id === 'string' ? parseInt(id) : id) : [];
        }
      } catch (e) {
        
        teamIds = [];
      }
      
      try {
        if (Array.isArray(editingTrainingFee.playerIds)) {
          playerIds = editingTrainingFee.playerIds.map((id: any) => typeof id === 'string' ? parseInt(id) : id);
        } else if (typeof editingTrainingFee.playerIds === 'string') {
          const parsed = JSON.parse(editingTrainingFee.playerIds || '[]');
          playerIds = Array.isArray(parsed) ? parsed.map((id: any) => typeof id === 'string' ? parseInt(id) : id) : [];
        }
      } catch (e) {
        
        playerIds = [];
      }

      trainingFeeForm.reset({
        name: editingTrainingFee.name || '',
        description: editingTrainingFee.description || '',
        feeType: 'training',
        amount: editingTrainingFee.amount?.toString() || '',
        period: editingTrainingFee.period || 'monthly',
        startDate: editingTrainingFee.startDate?.split('T')[0] || '',
        endDate: editingTrainingFee.endDate?.split('T')[0] || '',
        targetType: editingTrainingFee.targetType || 'team',
        teamIds: teamIds,
        playerIds: playerIds,
      });
    }
  }, [editingTrainingFee, trainingFeeForm]);

  // Data fetching
  const memberFeesQuery = useQuery({
    queryKey: ['/api/clubs', selectedClub?.id, 'member-fees'],
    enabled: !!selectedClub?.id,
  });

  const trainingFeesQuery = useQuery({
    queryKey: ['/api/clubs', selectedClub?.id, 'training-fees'],
    enabled: !!selectedClub?.id,
  });

  const memberFees = memberFeesQuery.data || [];
  const trainingFees = trainingFeesQuery.data || [];

  const membersQuery = useQuery({
    queryKey: ['/api/clubs', selectedClub?.id, 'members'],
    enabled: !!selectedClub?.id,
  });

  const playersQuery = useQuery({
    queryKey: ['/api/clubs', selectedClub?.id, 'players'],
    enabled: !!selectedClub?.id,
  });

  const teamsQuery = useQuery({
    queryKey: ['/api/clubs', selectedClub?.id, 'teams'],
    enabled: !!selectedClub?.id,
  });

  const members = membersQuery.data || [];
  const players = playersQuery.data || [];
  const teams = teamsQuery.data || [];

  // Mutations
  const createMemberFeeMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', `/api/clubs/${selectedClub?.id}/member-fees`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'member-fees'] });
      setIsMemberFeeDialogOpen(false);
      // Formular komplett zurücksetzen mit Standardwerten
      memberFeeForm.reset({
        memberId: '',
        feeType: 'membership',
        amount: '',
        period: 'monthly',
        startDate: '',
        endDate: '',
        description: '',
      });
      toast({ title: "Mitgliedsbeitrag erstellt", description: "Der Beitrag wurde erfolgreich hinzugefügt." });
    },
    onError: (error: any) => {
      toast({ title: "Fehler", description: error?.message || "Fehler beim Erstellen des Beitrags", variant: "destructive" });
    }
  });

  const createTrainingFeeMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', `/api/clubs/${selectedClub?.id}/training-fees`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'training-fees'] });
      setIsTrainingFeeDialogOpen(false);
      // Formular komplett zurücksetzen mit Standardwerten
      trainingFeeForm.reset({
        name: '',
        description: '',
        feeType: 'training',
        amount: '',
        period: 'monthly',
        startDate: '',
        endDate: '',
        targetType: 'team',
        teamIds: [],
        playerIds: [],
      });
      toast({ title: "Trainingsbeitrag erstellt", description: "Der Beitrag wurde erfolgreich hinzugefügt." });
    },
    onError: (error: any) => {
      toast({ title: "Fehler", description: error?.message || "Fehler beim Erstellen des Beitrags", variant: "destructive" });
    }
  });

  const deleteMemberFeeMutation = useMutation({
    mutationFn: (feeId: number) => apiRequest('DELETE', `/api/clubs/${selectedClub?.id}/member-fees/${feeId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'member-fees'] });
      toast({ title: "Mitgliedsbeitrag gelöscht", description: "Der Beitrag wurde erfolgreich entfernt." });
    },
    onError: (error: any) => {
      toast({ title: "Fehler", description: error?.message || "Fehler beim Löschen des Beitrags", variant: "destructive" });
    }
  });

  const deleteTrainingFeeMutation = useMutation({
    mutationFn: (feeId: number) => apiRequest('DELETE', `/api/clubs/${selectedClub?.id}/training-fees/${feeId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'training-fees'] });
      toast({ title: "Trainingsbeitrag gelöscht", description: "Der Beitrag wurde erfolgreich entfernt." });
    },
    onError: (error: any) => {
      toast({ title: "Fehler", description: error?.message || "Fehler beim Löschen des Beitrags", variant: "destructive" });
    }
  });

  const updateMemberFeeMutation = useMutation({
    mutationFn: ({ feeId, data }: { feeId: number, data: any }) => 
      apiRequest('PATCH', `/api/clubs/${selectedClub?.id}/member-fees/${feeId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'member-fees'] });
      setEditingMemberFee(null);
      toast({ title: "Mitgliedsbeitrag aktualisiert", description: "Die Änderungen wurden gespeichert." });
    },
    onError: (error: any) => {
      toast({ title: "Fehler", description: error?.message || "Fehler beim Aktualisieren", variant: "destructive" });
    }
  });

  const updateTrainingFeeMutation = useMutation({
    mutationFn: ({ feeId, data }: { feeId: number, data: any }) => 
      apiRequest('PATCH', `/api/clubs/${selectedClub?.id}/training-fees/${feeId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'training-fees'] });
      setEditingTrainingFee(null);
      toast({ title: "Trainingsbeitrag aktualisiert", description: "Die Änderungen wurden gespeichert." });
    },
    onError: (error: any) => {
      toast({ title: "Fehler", description: error?.message || "Fehler beim Aktualisieren", variant: "destructive" });
    }
  });

  // Helper functions
  const cleanDateField = (dateString: string) => {
    return dateString && dateString.trim() !== '' ? dateString : null;
  };

  const handleCreateMemberFee = (data: any) => {
    // Vollständigkeitsprüfung
    if (!data.memberId) {
      toast({ title: "Unvollständige Eingabe", description: "Bitte wählen Sie ein Mitglied aus.", variant: "destructive" });
      return;
    }
    if (!data.amount || parseFloat(data.amount) <= 0) {
      toast({ title: "Unvollständige Eingabe", description: "Bitte geben Sie einen gültigen Betrag ein.", variant: "destructive" });
      return;
    }
    if (!data.startDate) {
      toast({ title: "Unvollständige Eingabe", description: "Bitte wählen Sie ein Startdatum.", variant: "destructive" });
      return;
    }

    const cleanedData = {
      ...data,
      amount: String(data.amount),
      startDate: cleanDateField(data.startDate),
      endDate: cleanDateField(data.endDate),
      status: 'active',
      autoGenerate: true,
    };
    createMemberFeeMutation.mutate(cleanedData);
  };

  const handleCreateTrainingFee = (data: any) => {
    // Vollständigkeitsprüfung
    if (!data.name || data.name.trim() === '') {
      toast({ title: "Unvollständige Eingabe", description: "Bitte geben Sie einen Namen für den Beitrag ein.", variant: "destructive" });
      return;
    }
    if (!data.amount || parseFloat(data.amount) <= 0) {
      toast({ title: "Unvollständige Eingabe", description: "Bitte geben Sie einen gültigen Betrag ein.", variant: "destructive" });
      return;
    }
    if (!data.startDate) {
      toast({ title: "Unvollständige Eingabe", description: "Bitte wählen Sie ein Startdatum.", variant: "destructive" });
      return;
    }
    if (data.targetType === 'team' && (!data.teamIds || data.teamIds.length === 0)) {
      toast({ title: "Unvollständige Eingabe", description: "Bitte wählen Sie mindestens ein Team aus.", variant: "destructive" });
      return;
    }
    if (data.targetType === 'player' && (!data.playerIds || data.playerIds.length === 0)) {
      toast({ title: "Unvollständige Eingabe", description: "Bitte wählen Sie mindestens einen Spieler aus.", variant: "destructive" });
      return;
    }
    if (data.targetType === 'both' && 
        (!data.teamIds || data.teamIds.length === 0) && 
        (!data.playerIds || data.playerIds.length === 0)) {
      toast({ title: "Unvollständige Eingabe", description: "Bitte wählen Sie mindestens ein Team oder einen Spieler aus.", variant: "destructive" });
      return;
    }

    const cleanedData = {
      ...data,
      amount: String(data.amount),
      startDate: cleanDateField(data.startDate),
      endDate: cleanDateField(data.endDate),
      status: 'active',
      autoGenerate: true,
      teamIds: data.teamIds?.length > 0 ? data.teamIds : null,
      playerIds: data.playerIds?.length > 0 ? data.playerIds : null,
    };
    createTrainingFeeMutation.mutate(cleanedData);
  };

  return (
    <TabsContent value="membership" className={`space-y-6 ${className}`}>
      {/* Beiträge-Übersicht */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Aktive Mitgliedsbeiträge</p>
          <p className="text-2xl font-bold text-blue-600">
            {memberFees.filter((f: any) => f.status === 'active').length || 0}
          </p>
        </div>
        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-sm font-medium text-green-700 dark:text-green-300">Aktive Trainingsbeiträge</p>
          <p className="text-2xl font-bold text-green-600">
            {trainingFees.filter((f: any) => f.status === 'active').length || 0}
          </p>
        </div>
        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Monatliche Einnahmen</p>
          <p className="text-2xl font-bold text-purple-600">
            {(() => {
              const memberMonthly = memberFees.filter((f: any) => f.status === 'active' && f.period === 'monthly')
                .reduce((sum: number, f: any) => sum + Number(f.amount), 0) || 0;
              
              const trainingMonthly = trainingFees.filter((f: any) => f.status === 'active' && f.period === 'monthly')
                .reduce((sum: number, f: any) => {
                  const amount = Number(f.amount);
                  let teamCount = 0;
                  let playerCount = 0;
                  
                  // Parse team/player IDs from JSONB
                  if (f.targetType === 'team' || f.targetType === 'both') {
                    const teamIds = Array.isArray(f.teamIds) ? f.teamIds : 
                                   typeof f.teamIds === 'string' ? JSON.parse(f.teamIds) : [];
                    teamCount = teamIds.length;
                  }
                  if (f.targetType === 'player' || f.targetType === 'both') {
                    const playerIds = Array.isArray(f.playerIds) ? f.playerIds : 
                                     typeof f.playerIds === 'string' ? JSON.parse(f.playerIds) : [];
                    playerCount = playerIds.length;
                  }
                  
                  const totalTargets = teamCount + playerCount;
                  return sum + (amount * Math.max(1, totalTargets));
                }, 0) || 0;
              
              return (memberMonthly + trainingMonthly).toLocaleString('de-DE');
            })()} €
          </p>
        </div>
        <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
          <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Jährliche Einnahmen</p>
          <p className="text-2xl font-bold text-orange-600">
            {(() => {
              const memberYearly = memberFees.filter((f: any) => f.status === 'active')
                .reduce((sum: number, f: any) => {
                  const multiplier = f.period === 'monthly' ? 12 : f.period === 'quarterly' ? 4 : 1;
                  return sum + (Number(f.amount) * multiplier);
                }, 0) || 0;
              
              const trainingYearly = trainingFees.filter((f: any) => f.status === 'active')
                .reduce((sum: number, f: any) => {
                  const amount = Number(f.amount);
                  const multiplier = f.period === 'monthly' ? 12 : f.period === 'quarterly' ? 4 : f.period === 'one-time' ? 1 : 1;
                  
                  let teamCount = 0;
                  let playerCount = 0;
                  
                  if (f.targetType === 'team' || f.targetType === 'both') {
                    const teamIds = Array.isArray(f.teamIds) ? f.teamIds : 
                                   typeof f.teamIds === 'string' ? JSON.parse(f.teamIds) : [];
                    teamCount = teamIds.length;
                  }
                  if (f.targetType === 'player' || f.targetType === 'both') {
                    const playerIds = Array.isArray(f.playerIds) ? f.playerIds : 
                                     typeof f.playerIds === 'string' ? JSON.parse(f.playerIds) : [];
                    playerCount = playerIds.length;
                  }
                  
                  const totalTargets = teamCount + playerCount;
                  return sum + (amount * multiplier * Math.max(1, totalTargets));
                }, 0) || 0;
              
              return (memberYearly + trainingYearly).toLocaleString('de-DE');
            })()} €
          </p>
        </div>
      </div>

      {/* Beiträge-Verwaltung */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mitgliedsbeiträge */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-600" />
                Mitgliedsbeiträge
              </span>
              <Dialog open={isMemberFeeDialogOpen} onOpenChange={setIsMemberFeeDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Hinzufügen
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Mitgliedsbeitrag hinzufügen</DialogTitle>
                    <DialogDescription>
                      Erstellen Sie einen automatischen Beitrag für ein Mitglied
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...memberFeeForm}>
                    <form onSubmit={memberFeeForm.handleSubmit(handleCreateMemberFee)} className="space-y-4">
                      <FormField
                        control={memberFeeForm.control}
                        name="memberId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mitglied *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Mitglied auswählen" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {members?.filter((m: any) => m.paysMembershipFee).map((member: any) => (
                                  <SelectItem key={member.id} value={member.id.toString()}>
                                    {member.firstName} {member.lastName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={memberFeeForm.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Betrag (€) *</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={memberFeeForm.control}
                          name="period"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Intervall *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="monthly">Monatlich</SelectItem>
                                  <SelectItem value="quarterly">Vierteljährlich</SelectItem>
                                  <SelectItem value="yearly">Jährlich</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={memberFeeForm.control}
                          name="startDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Von (Startdatum) *</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={memberFeeForm.control}
                          name="endDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bis (Enddatum)</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                              <p className="text-xs text-muted-foreground mt-1">
                                Optional: Leer lassen für unbegrenzten Zeitraum
                              </p>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsMemberFeeDialogOpen(false)}
                        >
                          Abbrechen
                        </Button>
                        <Button
                          type="submit"
                          disabled={createMemberFeeMutation.isPending}
                        >
                          {createMemberFeeMutation.isPending ? 'Speichern...' : 'Speichern'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {memberFeesQuery.isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-muted rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : memberFees.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Keine Mitgliedsbeiträge definiert</p>
                  <p className="text-sm mt-2">Erstellen Sie automatische Beitragszahlungen für Mitglieder</p>
                </div>
              ) : (
                memberFees.map((fee: any) => (
                  <div key={fee.id} className="p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">
                            {(() => {
                              const member = members?.find((m: any) => m.id === fee.memberId);
                              return member ? `${member.firstName} ${member.lastName}` : 'Unbekanntes Mitglied';
                            })()}
                          </p>
                          <Badge variant={fee.status === 'active' ? 'default' : 'secondary'}>
                            {fee.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {fee.feeType === 'membership' ? 'Mitgliedsbeitrag' : fee.feeType} - {
                            fee.period === 'monthly' ? 'Monatlich' :
                            fee.period === 'quarterly' ? 'Vierteljährlich' :
                            fee.period === 'yearly' ? 'Jährlich' : fee.period
                          }
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(fee.startDate), 'dd.MM.yyyy', { locale: de })} 
                          {fee.endDate ? ` - ${format(new Date(fee.endDate), 'dd.MM.yyyy', { locale: de })}` : ' - unbegrenzt'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="font-bold text-blue-600 text-lg">{Number(fee.amount).toLocaleString('de-DE')} €</p>
                          <p className="text-xs text-muted-foreground">
                            {fee.period === 'monthly' ? 'pro Monat' :
                             fee.period === 'quarterly' ? 'pro Quartal' :
                             fee.period === 'yearly' ? 'pro Jahr' : ''}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewingFee(fee)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Details anzeigen
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditingMemberFee(fee)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Bearbeiten
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => deleteMemberFeeMutation.mutate(fee.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Löschen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Trainingsbeiträge */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Dumbbell className="w-5 h-5 mr-2 text-green-600" />
                Trainingsbeiträge
              </span>
              <Dialog open={isTrainingFeeDialogOpen} onOpenChange={setIsTrainingFeeDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Hinzufügen
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Trainingsbeitrag hinzufügen</DialogTitle>
                    <DialogDescription>
                      Erstellen Sie einen automatischen Trainingsbeitrag für Teams oder Spieler
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...trainingFeeForm}>
                    <form onSubmit={trainingFeeForm.handleSubmit(handleCreateTrainingFee)} className="space-y-4">
                      <FormField
                        control={trainingFeeForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name des Beitrags *</FormLabel>
                            <FormControl>
                              <Input placeholder="z.B. Trainingsgebühr U15" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={trainingFeeForm.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Betrag (€) *</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={trainingFeeForm.control}
                          name="period"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Intervall *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="monthly">Monatlich</SelectItem>
                                  <SelectItem value="quarterly">Vierteljährlich</SelectItem>
                                  <SelectItem value="yearly">Jährlich</SelectItem>
                                  <SelectItem value="one-time">Einmalig</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={trainingFeeForm.control}
                        name="targetType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Zielgruppe *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="team">Teams</SelectItem>
                                <SelectItem value="player">Spieler</SelectItem>
                                <SelectItem value="both">Teams und Spieler</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Teams auswählen */}
                      {(trainingFeeForm.watch('targetType') === 'team' || trainingFeeForm.watch('targetType') === 'both') && (
                        <FormField
                          control={trainingFeeForm.control}
                          name="teamIds"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Teams auswählen *</FormLabel>
                              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-2">
                                {teams?.map((team: any) => (
                                  <div key={team.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`team-${team.id}`}
                                      checked={field.value?.includes(team.id.toString())}
                                      onCheckedChange={(checked) => {
                                        const currentIds = field.value || [];
                                        if (checked) {
                                          field.onChange([...currentIds, team.id.toString()]);
                                        } else {
                                          field.onChange(currentIds.filter((id: string) => id !== team.id.toString()));
                                        }
                                      }}
                                    />
                                    <label htmlFor={`team-${team.id}`} className="text-sm">
                                      {team.name}
                                    </label>
                                  </div>
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {/* Spieler auswählen */}
                      {(trainingFeeForm.watch('targetType') === 'player' || trainingFeeForm.watch('targetType') === 'both') && (
                        <FormField
                          control={trainingFeeForm.control}
                          name="playerIds"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Spieler auswählen *</FormLabel>
                              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded p-2">
                                {players?.map((player: any) => (
                                  <div key={player.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`player-${player.id}`}
                                      checked={field.value?.includes(player.id.toString())}
                                      onCheckedChange={(checked) => {
                                        const currentIds = field.value || [];
                                        if (checked) {
                                          field.onChange([...currentIds, player.id.toString()]);
                                        } else {
                                          field.onChange(currentIds.filter((id: string) => id !== player.id.toString()));
                                        }
                                      }}
                                    />
                                    <label htmlFor={`player-${player.id}`} className="text-sm">
                                      {player.firstName} {player.lastName}
                                    </label>
                                  </div>
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={trainingFeeForm.control}
                          name="startDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Von (Startdatum) *</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={trainingFeeForm.control}
                          name="endDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bis (Enddatum)</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                              <p className="text-xs text-muted-foreground mt-1">
                                Optional: Leer lassen für unbegrenzten Zeitraum
                              </p>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsTrainingFeeDialogOpen(false)}
                        >
                          Abbrechen
                        </Button>
                        <Button
                          type="submit"
                          disabled={createTrainingFeeMutation.isPending}
                        >
                          {createTrainingFeeMutation.isPending ? 'Speichern...' : 'Speichern'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {trainingFeesQuery.isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-muted rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : trainingFees.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Dumbbell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Keine Trainingsbeiträge definiert</p>
                  <p className="text-sm mt-2">Erstellen Sie automatische Trainingsbeiträge für Spieler</p>
                </div>
              ) : (
                trainingFees.map((fee: any) => (
                  <div key={fee.id} className="p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{fee.name}</p>
                          <Badge variant={fee.status === 'active' ? 'default' : 'secondary'}>
                            {fee.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {fee.feeType === 'training' ? 'Trainingsbeitrag' : fee.feeType} - {
                            fee.period === 'monthly' ? 'Monatlich' :
                            fee.period === 'quarterly' ? 'Vierteljährlich' :
                            fee.period === 'yearly' ? 'Jährlich' :
                            fee.period === 'one-time' ? 'Einmalig' : fee.period
                          }
                        </p>
                        <div className="text-xs text-muted-foreground mb-1 space-y-1">
                          {fee.targetType === 'team' || fee.targetType === 'both' ? (
                            <div>
                              Teams: {(() => {
                                const teamIds = Array.isArray(fee.teamIds) ? fee.teamIds : 
                                               typeof fee.teamIds === 'string' ? JSON.parse(fee.teamIds) : [];
                                return teamIds.map((teamId: any) => {
                                  const id = typeof teamId === 'string' ? parseInt(teamId) : teamId;
                                  const team = teams?.find((t: any) => t.id === id);
                                  return team?.name;
                                }).filter(Boolean).join(', ') || 'Keine';
                              })()}
                            </div>
                          ) : null}
                          
                          {fee.targetType === 'player' || fee.targetType === 'both' ? (
                            <div>
                              Spieler: {(() => {
                                const playerIds = Array.isArray(fee.playerIds) ? fee.playerIds : 
                                                 typeof fee.playerIds === 'string' ? JSON.parse(fee.playerIds) : [];
                                return playerIds.map((playerId: any) => {
                                  const id = typeof playerId === 'string' ? parseInt(playerId) : playerId;
                                  const player = players?.find((p: any) => p.id === id);
                                  return player ? `${player.firstName} ${player.lastName}` : null;
                                }).filter(Boolean).slice(0, 3).join(', ');
                              })()}
                              {(() => {
                                const playerIds = Array.isArray(fee.playerIds) ? fee.playerIds : 
                                                 typeof fee.playerIds === 'string' ? JSON.parse(fee.playerIds) : [];
                                return playerIds.length > 3 ? ` und ${playerIds.length - 3} weitere` : '';
                              })()}
                            </div>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(fee.startDate), 'dd.MM.yyyy', { locale: de })} 
                          {fee.endDate ? ` - ${format(new Date(fee.endDate), 'dd.MM.yyyy', { locale: de })}` : ' - unbegrenzt'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="font-bold text-green-600 text-lg">{Number(fee.amount).toLocaleString('de-DE')} €</p>
                          <p className="text-xs text-muted-foreground">
                            {fee.period === 'monthly' ? 'pro Monat' :
                             fee.period === 'quarterly' ? 'pro Quartal' :
                             fee.period === 'yearly' ? 'pro Jahr' :
                             fee.period === 'one-time' ? 'einmalig' : ''}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewingFee(fee)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Details anzeigen
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditingTrainingFee(fee)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Bearbeiten
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => deleteTrainingFeeMutation.mutate(fee.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Löschen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Beiträge-Verlauf Grafik */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Beiträge-Verlauf
            </CardTitle>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Jahr:</label>
              <Select value={selectedChartYear.toString()} onValueChange={(value) => setSelectedChartYear(parseInt(value))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    const currentYear = new Date().getFullYear();
                    const years = [];
                    for (let year = currentYear - 3; year <= currentYear + 1; year++) {
                      years.push(year);
                    }
                    return years.map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ));
                  })()}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(() => {
                  
                  
                  
                  // Sichere Datenverarbeitung
                  const safeMemberFees = Array.isArray(memberFees) ? memberFees : [];
                  const safeTrainingFees = Array.isArray(trainingFees) ? trainingFees : [];
                  
                  
                  
                  
                  
                  
                  // Generiere Daten für das ausgewählte Jahr
                  const data = [];
                  const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
                  
                  // Generiere alle 12 Monate für das ausgewählte Jahr
                  for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
                    // WICHTIG: Datum für die MITTE des Monats verwenden, um Zeitzone-Probleme zu vermeiden
                    const date = new Date(selectedChartYear, monthIndex, 15);
                    const month = months[monthIndex];
                    const monthKey = `${month} ${selectedChartYear}`;
                    
                    
                    
                    
                    // Berechne Mitgliedsbeiträge für diesen Monat
                    let memberRevenue = 0;
                    
                    
                    safeMemberFees.forEach((fee: any, index: number) => {
                      
                      if (fee && fee.status === 'active') {
                        try {
                          const startDate = new Date(fee.startDate);
                          const endDate = fee.endDate ? new Date(fee.endDate) : null;
                          
                          
                          
                          // Prüfe ob der Monat im gültigen Zeitraum liegt
                          const isInRange = date >= startDate && (!endDate || date <= endDate);
                          
                          
                          if (isInRange) {
                            const amount = Number(fee.amount) || 0;
                            let addAmount = 0;
                            
                            // Berechnung basierend auf Periode
                            if (fee.period === 'monthly') {
                              addAmount = amount;
                              
                            } else if (fee.period === 'quarterly' && monthIndex % 3 === 0) {
                              addAmount = amount;
                              
                            } else if (fee.period === 'yearly' && monthIndex === 0) {
                              addAmount = amount;
                              
                            } else if (fee.period === 'one-time') {
                              const feeStartDate = new Date(fee.startDate);
                              if (date.getMonth() === feeStartDate.getMonth() && date.getFullYear() === feeStartDate.getFullYear()) {
                                addAmount = amount;
                                
                              }
                            }
                            
                            memberRevenue += addAmount;
                            
                          }
                        } catch (e) {
                          
                        }
                      } else {
                        
                      }
                    });
                    
                    // Berechne Trainingsbeiträge für diesen Monat
                    let trainingRevenue = 0;
                    
                    
                    safeTrainingFees.forEach((fee: any, index: number) => {
                      
                      if (fee && fee.status === 'active') {
                        try {
                          const startDate = new Date(fee.startDate);
                          const endDate = fee.endDate ? new Date(fee.endDate) : null;
                          
                          
                          
                          // Prüfe ob der Monat im gültigen Zeitraum liegt
                          const isInRange = date >= startDate && (!endDate || date <= endDate);
                          
                          
                          if (isInRange) {
                            const amount = Number(fee.amount) || 0;
                            
                            // Berechne Multiplikator basierend auf Targets
                            let multiplier = 1;
                            try {
                              if (fee.targetType === 'team' || fee.targetType === 'both') {
                                const teamIds = Array.isArray(fee.teamIds) ? fee.teamIds : 
                                               typeof fee.teamIds === 'string' ? JSON.parse(fee.teamIds || '[]') : [];
                                multiplier = Math.max(multiplier, teamIds.length);
                                
                              }
                              if (fee.targetType === 'player' || fee.targetType === 'both') {
                                const playerIds = Array.isArray(fee.playerIds) ? fee.playerIds : 
                                                 typeof fee.playerIds === 'string' ? JSON.parse(fee.playerIds || '[]') : [];
                                multiplier += playerIds.length;
                                
                              }
                            } catch (e) {
                              
                              multiplier = 1;
                            }
                            
                            
                            
                            let addAmount = 0;
                            // Berechnung basierend auf Periode
                            if (fee.period === 'monthly') {
                              addAmount = amount * multiplier;
                              
                            } else if (fee.period === 'quarterly' && monthIndex % 3 === 0) {
                              addAmount = amount * multiplier;
                              
                            } else if (fee.period === 'yearly' && monthIndex === 0) {
                              addAmount = amount * multiplier;
                              
                            } else if (fee.period === 'one-time') {
                              const feeStartDate = new Date(fee.startDate);
                              if (date.getMonth() === feeStartDate.getMonth() && date.getFullYear() === feeStartDate.getFullYear()) {
                                addAmount = amount * multiplier;
                                
                              }
                            }
                            
                            trainingRevenue += addAmount;
                            
                          }
                        } catch (e) {
                          
                        }
                      } else {
                        
                      }
                    });
                    
                    // Füge Datenpunkt hinzu (auch bei 0-Werten für bessere Visualisierung)
                    const dataPoint = {
                      month: monthKey,
                      mitgliedsbeiträge: Math.round(memberRevenue * 100) / 100,
                      trainingsbeiträge: Math.round(trainingRevenue * 100) / 100,
                      gesamt: Math.round((memberRevenue + trainingRevenue) * 100) / 100
                    };
                    
                    
                    data.push(dataPoint);
                  }
                  
                  
                  
                  
                  
                  
                  
                  // Ensure all data values are numbers
                  const cleanedData = data.map(item => ({
                    month: item.month,
                    mitgliedsbeiträge: Number(item.mitgliedsbeiträge) || 0,
                    trainingsbeiträge: Number(item.trainingsbeiträge) || 0,
                    gesamt: Number(item.gesamt) || 0
                  }));
                  
                  
                  return cleanedData;
                })()}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `€${value}`}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                            <p className="font-medium">{label}</p>
                            {payload.map((entry, index) => (
                              <p key={index} style={{ color: entry.color }}>
                                {entry.name}: €{Number(entry.value).toLocaleString('de-DE')}
                              </p>
                            ))}
                            <p className="font-medium border-t border-border pt-1 mt-1">
                              Gesamt: €{payload.reduce((sum, entry) => sum + Number(entry.value), 0).toLocaleString('de-DE')}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="mitgliedsbeiträge" 
                    fill="#3b82f6" 
                    name="Mitgliedsbeiträge"
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar 
                    dataKey="trainingsbeiträge" 
                    fill="#10b981" 
                    name="Trainingsbeiträge"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={!!viewingFee} onOpenChange={() => setViewingFee(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Beitrags-Details</DialogTitle>
          </DialogHeader>
          {viewingFee && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name:</label>
                <p className="text-sm">{viewingFee.name || (() => {
                  const member = members?.find((m: any) => m.id === viewingFee.memberId);
                  return member ? `${member.firstName} ${member.lastName}` : 'N/A';
                })()}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Betrag:</label>
                <p className="text-sm">{Number(viewingFee.amount).toLocaleString('de-DE')} € {
                  viewingFee.period === 'monthly' ? 'pro Monat' :
                  viewingFee.period === 'quarterly' ? 'pro Quartal' :
                  viewingFee.period === 'yearly' ? 'pro Jahr' :
                  viewingFee.period === 'one-time' ? 'einmalig' : ''
                }</p>
              </div>
              <div>
                <label className="text-sm font-medium">Zeitraum:</label>
                <p className="text-sm">
                  {format(new Date(viewingFee.startDate), 'dd.MM.yyyy', { locale: de })} 
                  {viewingFee.endDate ? ` - ${format(new Date(viewingFee.endDate), 'dd.MM.yyyy', { locale: de })}` : ' - unbegrenzt'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Status:</label>
                <p className="text-sm">{viewingFee.status === 'active' ? 'Aktiv' : 'Inaktiv'}</p>
              </div>
              {viewingFee.description && (
                <div>
                  <label className="text-sm font-medium">Beschreibung:</label>
                  <p className="text-sm">{viewingFee.description}</p>
                </div>
              )}
              {viewingFee.targetType && (
                <div>
                  <label className="text-sm font-medium">Zuweisung:</label>
                  <div className="text-sm space-y-1">
                    {(viewingFee.targetType === 'team' || viewingFee.targetType === 'both') && (
                      <div>
                        <span className="font-medium">Teams:</span> {(() => {
                          const teamIds = Array.isArray(viewingFee.teamIds) ? viewingFee.teamIds : 
                                         typeof viewingFee.teamIds === 'string' ? JSON.parse(viewingFee.teamIds || '[]') : [];
                          return teamIds.map((teamId: any) => {
                            const id = typeof teamId === 'string' ? parseInt(teamId) : teamId;
                            const team = teams?.find((t: any) => t.id === id);
                            return team?.name;
                          }).filter(Boolean).join(', ') || 'Keine';
                        })()}
                      </div>
                    )}
                    {(viewingFee.targetType === 'player' || viewingFee.targetType === 'both') && (
                      <div>
                        <span className="font-medium">Spieler:</span> {(() => {
                          const playerIds = Array.isArray(viewingFee.playerIds) ? viewingFee.playerIds : 
                                           typeof viewingFee.playerIds === 'string' ? JSON.parse(viewingFee.playerIds || '[]') : [];
                          return playerIds.map((playerId: any) => {
                            const id = typeof playerId === 'string' ? parseInt(playerId) : playerId;
                            const player = players?.find((p: any) => p.id === id);
                            return player ? `${player.firstName} ${player.lastName}` : null;
                          }).filter(Boolean).join(', ') || 'Keine';
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Member Fee Modal */}
      <Dialog open={!!editingMemberFee} onOpenChange={() => setEditingMemberFee(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Mitgliedsbeitrag bearbeiten</DialogTitle>
          </DialogHeader>
          {editingMemberFee && (
            <Form {...memberFeeForm}>
              <form onSubmit={memberFeeForm.handleSubmit((data) => {
                updateMemberFeeMutation.mutate({
                  feeId: editingMemberFee.id,
                  data: {
                    ...data,
                    amount: parseFloat(data.amount),
                    endDate: data.endDate || null
                  }
                });
              })} className="space-y-4">
                <FormField
                  control={memberFeeForm.control}
                  name="memberId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mitglied</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={editingMemberFee.memberId?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Mitglied wählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {members?.map((member: any) => (
                            <SelectItem key={member.id} value={member.id.toString()}>
                              {member.firstName} {member.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={memberFeeForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Betrag (€)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="25.00" 
                          {...field} 
                          value={field.value || editingMemberFee.amount}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={memberFeeForm.control}
                  name="period"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zahlungsrhythmus</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={editingMemberFee.period}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="monthly">Monatlich</SelectItem>
                          <SelectItem value="quarterly">Vierteljährlich</SelectItem>
                          <SelectItem value="yearly">Jährlich</SelectItem>
                          <SelectItem value="one-time">Einmalig</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={memberFeeForm.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Startdatum</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            value={field.value || editingMemberFee.startDate?.split('T')[0]} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={memberFeeForm.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Enddatum (optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            value={field.value || editingMemberFee.endDate?.split('T')[0] || ''} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingMemberFee(null)}
                  >
                    Abbrechen
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateMemberFeeMutation.isPending}
                  >
                    {updateMemberFeeMutation.isPending ? 'Speichern...' : 'Speichern'}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Training Fee Modal */}
      <Dialog open={!!editingTrainingFee} onOpenChange={() => setEditingTrainingFee(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Trainingsbeitrag bearbeiten</DialogTitle>
          </DialogHeader>
          {editingTrainingFee && (
            <Form {...trainingFeeForm}>
              <form onSubmit={trainingFeeForm.handleSubmit((data) => {
                updateTrainingFeeMutation.mutate({
                  feeId: editingTrainingFee.id,
                  data: {
                    ...data,
                    amount: parseFloat(data.amount),
                    endDate: data.endDate || null,
                    teamIds: data.targetType === 'team' || data.targetType === 'both' ? data.teamIds : [],
                    playerIds: data.targetType === 'player' || data.targetType === 'both' ? data.playerIds : []
                  }
                });
              })} className="space-y-4">
                <FormField
                  control={trainingFeeForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="z.B. Ausbildungsbeitrag" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={trainingFeeForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Beschreibung (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Zusätzliche Details..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={trainingFeeForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Betrag pro Ziel (€)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="25.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={trainingFeeForm.control}
                  name="period"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zahlungsrhythmus</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Rhythmus wählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="monthly">Monatlich</SelectItem>
                          <SelectItem value="quarterly">Vierteljährlich</SelectItem>
                          <SelectItem value="yearly">Jährlich</SelectItem>
                          <SelectItem value="one-time">Einmalig</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={trainingFeeForm.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Startdatum</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={trainingFeeForm.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Enddatum (optional)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={trainingFeeForm.control}
                  name="targetType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zielgruppe</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Zielgruppe wählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="team">Teams</SelectItem>
                          <SelectItem value="player">Einzelne Spieler</SelectItem>
                          <SelectItem value="both">Teams und Spieler</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Team Auswahl */}
                {(trainingFeeForm.watch('targetType') === 'team' || trainingFeeForm.watch('targetType') === 'both') && (
                  <FormField
                    control={trainingFeeForm.control}
                    name="teamIds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teams auswählen</FormLabel>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                          {teams?.map((team: any) => (
                            <div key={team.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`team-${team.id}`}
                                checked={field.value?.includes(team.id) || false}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.onChange([...(field.value || []), team.id]);
                                  } else {
                                    field.onChange((field.value || []).filter((id: number) => id !== team.id));
                                  }
                                }}
                              />
                              <label htmlFor={`team-${team.id}`} className="text-sm font-medium">
                                {team.name}
                              </label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Spieler Auswahl */}
                {(trainingFeeForm.watch('targetType') === 'player' || trainingFeeForm.watch('targetType') === 'both') && (
                  <FormField
                    control={trainingFeeForm.control}
                    name="playerIds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Spieler auswählen</FormLabel>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                          {players?.map((player: any) => (
                            <div key={player.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`player-${player.id}`}
                                checked={field.value?.includes(player.id) || false}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.onChange([...(field.value || []), player.id]);
                                  } else {
                                    field.onChange((field.value || []).filter((id: number) => id !== player.id));
                                  }
                                }}
                              />
                              <label htmlFor={`player-${player.id}`} className="text-sm font-medium">
                                {player.firstName} {player.lastName}
                              </label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingTrainingFee(null)}
                  >
                    Abbrechen
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateTrainingFeeMutation.isPending}
                  >
                    {updateTrainingFeeMutation.isPending ? 'Speichern...' : 'Speichern'}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </TabsContent>
  );
}