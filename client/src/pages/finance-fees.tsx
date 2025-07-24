import { useState } from "react";
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
  BarChart3
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";

// Form schemas
const memberFeeFormSchema = z.object({
  memberId: z.string().min(1, "Mitglied ist erforderlich"),
  feeType: z.enum(['membership', 'training', 'registration', 'equipment']),
  amount: z.string().min(1, "Betrag ist erforderlich"),
  period: z.enum(['monthly', 'quarterly', 'yearly', 'one-time']),
  startDate: z.string().min(1, "Startdatum ist erforderlich"),
  endDate: z.string().optional(),
  description: z.string().optional(),
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

  // Form initialization
  const memberFeeForm = useForm({
    resolver: zodResolver(memberFeeFormSchema),
    defaultValues: {
      memberId: '',
      feeType: 'membership' as const,
      amount: '',
      period: 'monthly' as const,
      startDate: new Date().toISOString().split('T')[0],
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
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      targetType: 'team' as const,
      teamIds: [],
      playerIds: [],
    }
  });

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
      memberFeeForm.reset();
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
      trainingFeeForm.reset();
      toast({ title: "Trainingsbeitrag erstellt", description: "Der Beitrag wurde erfolgreich hinzugefügt." });
    },
    onError: (error: any) => {
      toast({ title: "Fehler", description: error?.message || "Fehler beim Erstellen des Beitrags", variant: "destructive" });
    }
  });

  // Helper functions
  const cleanDateField = (dateString: string) => {
    return dateString && dateString.trim() !== '' ? dateString : null;
  };

  const handleCreateMemberFee = (data: any) => {
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
                .reduce((sum: number, f: any) => sum + Number(f.amount), 0) || 0;
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
                  const multiplier = f.period === 'monthly' ? 12 : f.period === 'quarterly' ? 4 : f.period === 'one-time' ? 0 : 1;
                  return sum + (Number(f.amount) * multiplier);
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
            <div className="space-y-3 max-h-96 overflow-y-auto">
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
                          <p className="font-medium">{fee.member?.firstName} {fee.member?.lastName}</p>
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
                      <div className="text-right">
                        <p className="font-bold text-blue-600 text-lg">{Number(fee.amount).toLocaleString('de-DE')} €</p>
                        <p className="text-xs text-muted-foreground">
                          {fee.period === 'monthly' ? 'pro Monat' :
                           fee.period === 'quarterly' ? 'pro Quartal' :
                           fee.period === 'yearly' ? 'pro Jahr' : ''}
                        </p>
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
            <div className="space-y-3 max-h-96 overflow-y-auto">
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
                              Teams: {fee.teamIds?.map((teamId: number) => {
                                const team = teams?.find((t: any) => t.id === teamId);
                                return team?.name;
                              }).filter(Boolean).join(', ') || 'Keine'}
                            </div>
                          ) : null}
                          
                          {fee.targetType === 'player' || fee.targetType === 'both' ? (
                            <div>
                              Spieler: {fee.playerIds?.map((playerId: number) => {
                                const player = players?.find((p: any) => p.id === playerId);
                                return player ? `${player.firstName} ${player.lastName}` : null;
                              }).filter(Boolean).slice(0, 3).join(', ')}
                              {fee.playerIds?.length > 3 ? ` und ${fee.playerIds.length - 3} weitere` : ''}
                            </div>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(fee.startDate), 'dd.MM.yyyy', { locale: de })} 
                          {fee.endDate ? ` - ${format(new Date(fee.endDate), 'dd.MM.yyyy', { locale: de })}` : ' - unbegrenzt'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600 text-lg">{Number(fee.amount).toLocaleString('de-DE')} €</p>
                        <p className="text-xs text-muted-foreground">
                          {fee.period === 'monthly' ? 'pro Monat' :
                           fee.period === 'quarterly' ? 'pro Quartal' :
                           fee.period === 'yearly' ? 'pro Jahr' :
                           fee.period === 'one-time' ? 'einmalig' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
}