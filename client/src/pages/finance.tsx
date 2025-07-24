import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useClub } from "@/hooks/use-club";
import { usePage } from "@/contexts/PageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Euro, 
  Search, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Download,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Grid3x3,
  List,
  Filter,
  Calendar,
  Users,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  DollarSign,
  PiggyBank,
  Receipt,
  Banknote,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
  Wallet,
  Trophy,
  Building,
  BarChart3
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";

// Form schemas
const financeFormSchema = z.object({
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, "Kategorie ist erforderlich"),
  subcategory: z.string().optional(),
  amount: z.string().min(1, "Betrag ist erforderlich"),
  description: z.string().min(1, "Beschreibung ist erforderlich"),
  date: z.string().min(1, "Datum ist erforderlich"),
  dueDate: z.string().optional(),
  paymentMethod: z.string().optional(),
  status: z.enum(['pending', 'paid', 'overdue', 'cancelled']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  recurring: z.boolean().optional(),
  recurringInterval: z.enum(['monthly', 'quarterly', 'yearly']).optional().or(z.literal('')),
  notes: z.string().optional(),
  memberId: z.string().optional(),
  playerId: z.string().optional(),
  teamId: z.string().optional(),
});

const memberFeeFormSchema = z.object({
  memberId: z.string().min(1, "Mitglied ist erforderlich"),
  feeType: z.enum(['membership', 'training', 'registration', 'equipment']),
  amount: z.string().min(1, "Betrag ist erforderlich"),
  period: z.enum(['monthly', 'quarterly', 'yearly', 'one-time']),
  startDate: z.string().min(1, "Startdatum ist erforderlich"),
  endDate: z.string().optional(),
  notes: z.string().optional(),
});

const trainingFeeFormSchema = z.object({
  playerId: z.string().min(1, "Spieler ist erforderlich"),
  teamId: z.string().optional(),
  feeType: z.enum(['training', 'coaching', 'camp', 'equipment']),
  amount: z.string().min(1, "Betrag ist erforderlich"),
  period: z.enum(['monthly', 'quarterly', 'yearly', 'one-time']),
  startDate: z.string().min(1, "Startdatum ist erforderlich"),
  endDate: z.string().optional(),
  notes: z.string().optional(),
});

export default function Finance() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { selectedClub } = useClub();
  const { setPage } = usePage();
  const queryClient = useQueryClient();

  // Set page title
  useEffect(() => {
    setPage("Finanzen", "Umfassende Vereins-Finanzverwaltung");
  }, [setPage]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isMemberFeeDialogOpen, setIsMemberFeeDialogOpen] = useState(false);
  const [isTrainingFeeDialogOpen, setIsTrainingFeeDialogOpen] = useState(false);
  const [editingFinance, setEditingFinance] = useState<any>(null);
  const [selectedFinance, setSelectedFinance] = useState<any>(null);

  // Form initialization
  const financeForm = useForm({
    resolver: zodResolver(financeFormSchema),
    defaultValues: {
      type: 'income' as const,
      category: '',
      subcategory: '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      status: 'pending' as const,
      priority: 'normal' as const,
      paymentMethod: '',
      recurring: false,
      recurringInterval: '',
      notes: '',
      memberId: '',
      playerId: '',
      teamId: '',
    }
  });

  const editFinanceForm = useForm({
    resolver: zodResolver(financeFormSchema),
    defaultValues: {
      type: 'income' as const,
      category: '',
      subcategory: '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      status: 'pending' as const,
      priority: 'normal' as const,
      paymentMethod: '',
      recurring: false,
      recurringInterval: '',
      notes: '',
      memberId: '',
      playerId: '',
      teamId: '',
    }
  });

  const memberFeeForm = useForm({
    resolver: zodResolver(memberFeeFormSchema),
    defaultValues: {
      memberId: '',
      feeType: 'membership' as const,
      amount: '',
      period: 'monthly' as const,
      startDate: new Date().toISOString().split('T')[0],
    }
  });

  const trainingFeeForm = useForm({
    resolver: zodResolver(trainingFeeFormSchema),
    defaultValues: {
      playerId: '',
      feeType: 'training' as const,
      amount: '',
      period: 'monthly' as const,
      startDate: new Date().toISOString().split('T')[0],
    }
  });

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

  // Data fetching
  const { data: finances = [], isLoading: isFinancesLoading } = useQuery({
    queryKey: ['/api/clubs', selectedClub?.id, 'finances'],
    enabled: !!selectedClub?.id,
    retry: false,
  });

  const { data: memberFees = [] } = useQuery({
    queryKey: ['/api/clubs', selectedClub?.id, 'member-fees'],
    enabled: !!selectedClub?.id,
    retry: false,
  });

  const { data: trainingFees = [] } = useQuery({
    queryKey: ['/api/clubs', selectedClub?.id, 'training-fees'],
    enabled: !!selectedClub?.id,
    retry: false,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['/api/clubs', selectedClub?.id, 'members'],
    enabled: !!selectedClub?.id,
    retry: false,
  });

  const { data: players = [] } = useQuery({
    queryKey: ['/api/clubs', selectedClub?.id, 'players'],
    enabled: !!selectedClub?.id,
    retry: false,
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['/api/clubs', selectedClub?.id, 'teams'],
    enabled: !!selectedClub?.id,
    retry: false,
  });

  // Mutations
  const createFinanceMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', `/api/clubs/${selectedClub?.id}/finances`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'finances'] });
      setIsCreateDialogOpen(false);
      financeForm.reset({
        type: 'income' as const,
        category: '',
        subcategory: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        dueDate: '',
        status: 'pending' as const,
        priority: 'normal' as const,
        paymentMethod: '',
        recurring: false,
        recurringInterval: '',
        notes: '',
        memberId: '',
        playerId: '',
        teamId: '',
      });
      toast({ title: "Finanztransaktion erstellt", description: "Die Transaktion wurde erfolgreich hinzugefügt." });
    },
    onError: (error: any) => {
      toast({ title: "Fehler", description: error?.message || "Fehler beim Erstellen der Transaktion", variant: "destructive" });
    }
  });

  const updateFinanceMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => apiRequest('PATCH', `/api/clubs/${selectedClub?.id}/finances/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'finances'] });
      setEditingFinance(null);
      setIsEditDialogOpen(false);
      editFinanceForm.reset();
      toast({ title: "Transaktion aktualisiert", description: "Die Änderungen wurden gespeichert." });
    },
    onError: (error: any) => {
      toast({ title: "Fehler", description: error?.message || "Fehler beim Aktualisieren", variant: "destructive" });
    }
  });

  const deleteFinanceMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/clubs/${selectedClub?.id}/finances/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clubs', selectedClub?.id, 'finances'] });
      toast({ title: "Transaktion gelöscht", description: "Die Transaktion wurde entfernt." });
    },
    onError: (error: any) => {
      toast({ title: "Fehler", description: error?.message || "Fehler beim Löschen", variant: "destructive" });
    }
  });

  // Computed values
  const totalIncome = finances
    .filter((f: any) => f.type === 'income' && f.isActive)
    .reduce((sum: number, f: any) => sum + Number(f.amount), 0);

  const totalExpenses = finances
    .filter((f: any) => f.type === 'expense' && f.isActive)
    .reduce((sum: number, f: any) => sum + Number(f.amount), 0);

  const balance = totalIncome - totalExpenses;

  const pendingAmount = finances
    .filter((f: any) => f.status === 'pending' && f.isActive)
    .reduce((sum: number, f: any) => sum + Number(f.amount), 0);

  // Filtered finances
  const filteredFinances = finances.filter((finance: any) => {
    const matchesSearch = searchTerm === '' || 
      finance.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      finance.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || finance.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || finance.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Handler functions
  const handleDeleteFinance = async (id: number) => {
    if (window.confirm('Sind Sie sicher, dass Sie diese Transaktion löschen möchten?')) {
      deleteFinanceMutation.mutate(id);
    }
  };

  const toggleFinanceStatus = (finance: any) => {
    const newStatus = !finance.isActive;
    updateFinanceMutation.mutate({
      id: finance.id,
      data: { isActive: newStatus }
    });
  };

  // Modal handlers
  const handleViewDetails = (finance: any) => {
    setSelectedFinance(finance);
    setIsDetailsDialogOpen(true);
  };

  const handleEditFinance = (finance: any) => {
    setEditingFinance(finance);
    
    // Pre-populate edit form with existing data
    editFinanceForm.reset({
      type: finance.type,
      category: finance.category,
      subcategory: finance.subcategory || '',
      amount: finance.amount.toString(),
      description: finance.description,
      date: finance.date,
      dueDate: finance.dueDate || '',
      paymentMethod: finance.paymentMethod || '',
      status: finance.status,
      priority: finance.priority,
      recurring: finance.recurring || false,
      recurringInterval: finance.recurringInterval || '',
      notes: finance.notes || '',
      memberId: finance.memberId?.toString() || '',
      playerId: finance.playerId?.toString() || '',
      teamId: finance.teamId?.toString() || '',
    });
    
    setIsEditDialogOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsDialogOpen(false);
    setSelectedFinance(null);
  };

  const handleCloseEditModal = () => {
    setIsEditDialogOpen(false);
    setEditingFinance(null);
    editFinanceForm.reset();
  };

  const handleCloseCreateModal = () => {
    setIsCreateDialogOpen(false);
    financeForm.reset({
      type: 'income' as const,
      category: '',
      subcategory: '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      status: 'pending' as const,
      priority: 'normal' as const,
      paymentMethod: '',
      recurring: false,
      recurringInterval: '',
      notes: '',
      memberId: '',
      playerId: '',
      teamId: '',
    });
  };

  // Helper function for date cleaning
  const cleanDateField = (dateString: string) => {
    return dateString && dateString.trim() !== '' ? dateString : null;
  };

  // Form handlers
  const handleCreateFinance = (data: any) => {
    const cleanedData = {
      ...data,
      amount: data.amount,  // Keep as string for Zod validation
      date: cleanDateField(data.date),
      dueDate: cleanDateField(data.dueDate),
      clubId: selectedClub?.id,
      memberId: data.memberId || null,
      playerId: data.playerId || null,
      teamId: data.teamId || null,
      subcategory: data.subcategory || null,
      paymentMethod: data.paymentMethod || null,
      notes: data.notes || null,
      recurringInterval: data.recurringInterval || null,
    };
    
    // Remove empty string values and convert to appropriate types
    Object.keys(cleanedData).forEach(key => {
      if (cleanedData[key] === '') {
        cleanedData[key] = null;
      }
    });
    
    createFinanceMutation.mutate(cleanedData);
  };

  const handleUpdateFinance = (data: any) => {
    console.log('=== HANDLE UPDATE FINANCE CALLED ===');
    console.log('Update data received:', data);
    console.log('Editing finance:', editingFinance);
    
    if (!editingFinance) {
      console.log('ERROR: No editingFinance found!');
      return;
    }
    
    const cleanedData = {
      ...data,
      date: cleanDateField(data.date),
      dueDate: cleanDateField(data.dueDate),
      memberId: data.memberId || null,
      playerId: data.playerId || null,
      teamId: data.teamId || null,
      subcategory: data.subcategory || null,
      paymentMethod: data.paymentMethod || null,
      notes: data.notes || null,
      recurringInterval: data.recurringInterval || null,
    };
    
    // Remove empty string values
    Object.keys(cleanedData).forEach(key => {
      if (cleanedData[key] === '') {
        cleanedData[key] = null;
      }
    });
    
    console.log('Cleaned data for update:', cleanedData);
    console.log('About to call mutation with ID:', editingFinance.id);
    updateFinanceMutation.mutate({ id: editingFinance.id, data: cleanedData });
  };

  const handleCreateMemberFee = (data: any) => {
    const cleanedData = {
      ...data,
      amount: parseFloat(data.amount),
      startDate: cleanDateField(data.startDate),
      endDate: cleanDateField(data.endDate),
      clubId: selectedClub?.id,
      memberId: parseInt(data.memberId),
    };
    createMemberFeeMutation.mutate(cleanedData);
  };

  const handleCreateTrainingFee = (data: any) => {
    const cleanedData = {
      ...data,
      amount: parseFloat(data.amount),
      startDate: cleanDateField(data.startDate),
      endDate: cleanDateField(data.endDate),
      clubId: selectedClub?.id,
      playerId: parseInt(data.playerId),
      teamId: data.teamId ? parseInt(data.teamId) : null,
    };
    createTrainingFeeMutation.mutate(cleanedData);
  };

  const getStatusBadge = (status: string, isActive: boolean = true) => {
    if (!isActive) {
      return <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Inaktiv</Badge>;
    }
    
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Bezahlt</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Ausstehend</Badge>;
      case 'overdue':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Überfällig</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">Storniert</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Abgeschlossen</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'high':
        return <TrendingUp className="w-4 h-4 text-orange-500" />;
      case 'normal':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'low':
        return <TrendingDown className="w-4 h-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'mitgliedsbeitrag':
      case 'membership':
        return <Users className="w-4 h-4" />;
      case 'trainingsbeitrag':
      case 'training':
        return <Trophy className="w-4 h-4" />;
      case 'equipment':
      case 'ausrüstung':
        return <Receipt className="w-4 h-4" />;
      case 'facility':
      case 'anlage':
        return <Building className="w-4 h-4" />;
      default:
        return <Euro className="w-4 h-4" />;
    }
  };

  const translatePriority = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Dringend';
      case 'high': return 'Hoch';
      case 'normal': return 'Normal';
      case 'low': return 'Niedrig';
      default: return priority;
    }
  };

  const translatePaymentMethod = (method: string) => {
    switch (method) {
      case 'cash': return 'Bargeld';
      case 'bank': return 'Banküberweisung';
      case 'card': return 'Karte';
      case 'paypal': return 'PayPal';
      default: return method;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'dd.MM.yyyy', { locale: de });
  };

  if (!selectedClub) {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-950 p-6">
        <div className="text-center py-12">
          <Euro className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Kein Verein ausgewählt</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Bitte wählen Sie einen Verein aus, um Finanzen zu verwalten.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="p-4 sm:p-6">
        <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-muted p-1 rounded-lg h-auto">
            <TabsTrigger value="overview" className="rounded-md text-xs sm:text-sm py-2 sm:py-2.5">Übersicht</TabsTrigger>
            <TabsTrigger value="transactions" className="rounded-md text-xs sm:text-sm py-2 sm:py-2.5">Transaktionen</TabsTrigger>
            <TabsTrigger value="membership" className="rounded-md text-xs sm:text-sm py-2 sm:py-2.5">Beiträge</TabsTrigger>
            <TabsTrigger value="reports" className="rounded-md text-xs sm:text-sm py-2 sm:py-2.5">Berichte</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            {/* Modern Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">Einnahmen</p>
                      <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-1">
                        {formatCurrency(totalIncome)}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        +12% vs. Vormonat
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-200 dark:bg-green-800 rounded-xl flex items-center justify-center">
                      <TrendingUpIcon className="text-green-700 dark:text-green-300 w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-700 dark:text-red-300">Ausgaben</p>
                      <p className="text-3xl font-bold text-red-900 dark:text-red-100 mt-1">
                        {formatCurrency(totalExpenses)}
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center">
                        <TrendingDownIcon className="w-3 h-3 mr-1" />
                        +5% vs. Vormonat
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-red-200 dark:bg-red-800 rounded-xl flex items-center justify-center">
                      <TrendingDownIcon className="text-red-700 dark:text-red-300 w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={`border-0 shadow-lg ${balance >= 0 
                ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20' 
                : 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20'
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${balance >= 0 
                        ? 'text-blue-700 dark:text-blue-300' 
                        : 'text-orange-700 dark:text-orange-300'
                      }`}>Saldo</p>
                      <p className={`text-3xl font-bold mt-1 ${balance >= 0 
                        ? 'text-blue-900 dark:text-blue-100' 
                        : 'text-orange-900 dark:text-orange-100'
                      }`}>
                        {formatCurrency(balance)}
                      </p>
                      <p className={`text-sm mt-1 flex items-center ${balance >= 0 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-orange-600 dark:text-orange-400'
                      }`}>
                        <Wallet className="w-3 h-3 mr-1" />
                        {balance >= 0 ? 'Positiv' : 'Defizit'}
                      </p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${balance >= 0 
                      ? 'bg-blue-200 dark:bg-blue-800' 
                      : 'bg-orange-200 dark:bg-orange-800'
                    }`}>
                      <Euro className={`w-6 h-6 ${balance >= 0 
                        ? 'text-blue-700 dark:text-blue-300' 
                        : 'text-orange-700 dark:text-orange-300'
                      }`} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Ausstehend</p>
                      <p className="text-3xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                        {formatCurrency(pendingAmount)}
                      </p>
                      <p className="text-sm text-purple-600 dark:text-purple-400 mt-1 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {finances.filter(f => f.status === 'pending').length} Posten
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-200 dark:bg-purple-800 rounded-xl flex items-center justify-center">
                      <Clock className="text-purple-700 dark:text-purple-300 w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>



            {/* Recent Transactions Overview - Kompakt */}
            <div className="bg-card rounded-xl shadow-sm border p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Neueste Transaktionen
                </h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    // Direkter Tab-Wechsel zu Transaktionen
                    setActiveTab('transactions');
                  }}
                  className="text-xs"
                >
                  Alle anzeigen
                </Button>
              </div>
              <div className="space-y-3">
                {finances.slice(0, 5).map((finance: any) => (
                  <div key={finance.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors cursor-pointer"
                       onClick={() => handleViewDetails(finance)}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${finance.type === 'income' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                        {finance.type === 'income' ? (
                          <TrendingUpIcon className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDownIcon className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{finance.description}</p>
                        <p className="text-xs text-muted-foreground">{finance.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${finance.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {finance.type === 'income' ? '+' : '-'}{Number(finance.amount || 0).toLocaleString('de-DE')} €
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(finance.date), 'dd.MM.yyyy', { locale: de })}
                      </p>
                    </div>
                  </div>
                ))}
                {finances.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Noch keine Transaktionen vorhanden</p>
                    <p className="text-sm">Erstellen Sie Ihre erste Finanztransaktion</p>
                  </div>
                )}
              </div>
            </div>

            {/* Status Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  Ausstehende Zahlungen
                </h3>
                <div className="space-y-3">
                  {finances.filter((f: any) => f.status === 'pending' || f.status === 'overdue').slice(0, 3).map((finance: any) => (
                    <div key={finance.id} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{finance.description}</p>
                        <p className="text-xs text-muted-foreground">{finance.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-orange-600 text-sm">
                          {Number(finance.amount || 0).toLocaleString('de-DE')} €
                        </p>
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                          finance.status === 'overdue' 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        }`}>
                          {finance.status === 'pending' ? 'Ausstehend' : 
                           finance.status === 'overdue' ? 'Überfällig' : finance.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {finances.filter((f: any) => f.status === 'pending' || f.status === 'overdue').length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <p className="text-sm">Alle Zahlungen sind aktuell</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-card rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Monatliche Übersicht
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Einnahmen diesen Monat</p>
                      <p className="text-xs text-muted-foreground">
                        {finances.filter((f: any) => 
                          f.type === 'income' && 
                          new Date(f.date).getMonth() === new Date().getMonth()
                        ).length} Transaktionen
                      </p>
                    </div>
                    <p className="font-bold text-green-600">
                      {finances
                        .filter((f: any) => 
                          f.type === 'income' && 
                          new Date(f.date).getMonth() === new Date().getMonth()
                        )
                        .reduce((sum: number, f: any) => sum + Number(f.amount || 0), 0)
                        .toLocaleString('de-DE')} €
                    </p>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Ausgaben diesen Monat</p>
                      <p className="text-xs text-muted-foreground">
                        {finances.filter((f: any) => 
                          f.type === 'expense' && 
                          new Date(f.date).getMonth() === new Date().getMonth()
                        ).length} Transaktionen
                      </p>
                    </div>
                    <p className="font-bold text-red-600">
                      {finances
                        .filter((f: any) => 
                          f.type === 'expense' && 
                          new Date(f.date).getMonth() === new Date().getMonth()
                        )
                        .reduce((sum: number, f: any) => sum + Number(f.amount || 0), 0)
                        .toLocaleString('de-DE')} €
                    </p>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Netto diesen Monat</p>
                      <p className="text-xs text-muted-foreground">Einnahmen - Ausgaben</p>
                    </div>
                    <p className={`font-bold ${
                      (finances
                        .filter((f: any) => 
                          f.type === 'income' && 
                          new Date(f.date).getMonth() === new Date().getMonth()
                        )
                        .reduce((sum: number, f: any) => sum + Number(f.amount || 0), 0) -
                      finances
                        .filter((f: any) => 
                          f.type === 'expense' && 
                          new Date(f.date).getMonth() === new Date().getMonth()
                        )
                        .reduce((sum: number, f: any) => sum + Number(f.amount || 0), 0)) >= 0 
                        ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(finances
                        .filter((f: any) => 
                          f.type === 'income' && 
                          new Date(f.date).getMonth() === new Date().getMonth()
                        )
                        .reduce((sum: number, f: any) => sum + Number(f.amount || 0), 0) -
                      finances
                        .filter((f: any) => 
                          f.type === 'expense' && 
                          new Date(f.date).getMonth() === new Date().getMonth()
                        )
                        .reduce((sum: number, f: any) => sum + Number(f.amount || 0), 0))
                        .toLocaleString('de-DE')} €
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            {/* Header Section with Search, Filters and Add Button */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-4 sm:p-6 mb-6">
              <div className="flex flex-col gap-4">
                {/* First Row: Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Transaktionen durchsuchen..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-10 rounded-xl border bg-background"
                    />
                  </div>
                  
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full sm:w-48 h-10 rounded-xl border bg-background">
                      <SelectValue placeholder="Typ wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Typen</SelectItem>
                      <SelectItem value="income">Einnahmen</SelectItem>
                      <SelectItem value="expense">Ausgaben</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-48 h-10 rounded-xl border bg-background">
                      <SelectValue placeholder="Status wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Status</SelectItem>
                      <SelectItem value="pending">Ausstehend</SelectItem>
                      <SelectItem value="paid">Bezahlt</SelectItem>
                      <SelectItem value="overdue">Überfällig</SelectItem>
                      <SelectItem value="cancelled">Storniert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Second Row: View Toggle and Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  {/* View Toggle - Left */}
                  <div className="flex rounded-xl border bg-background p-1">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="h-8 px-3 rounded-lg flex-1 sm:flex-none"
                    >
                      <Grid3x3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="h-8 px-3 rounded-lg flex-1 sm:flex-none"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Export and Add Buttons - Right */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button variant="outline" size="sm" className="w-full sm:w-auto h-10 rounded-xl">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          className="w-full sm:w-auto h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Transaktion hinzufügen
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction Grid/List */}
            {isFinancesLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4 sm:p-6">
                      <div className="space-y-2 sm:space-y-3">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-6 bg-muted rounded w-1/2"></div>
                        <div className="h-3 bg-muted rounded w-full"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredFinances.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Receipt className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Keine Transaktionen gefunden</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' 
                      ? 'Versuchen Sie andere Filterkriterien.' 
                      : 'Erstellen Sie Ihre erste Finanztransaktion.'}
                  </p>
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Erste Transaktion erstellen
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </CardContent>
              </Card>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {filteredFinances.map((finance: any) => (
                  <Card key={finance.id} className="group hover:shadow-lg transition-all duration-200 border border-border min-w-0">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Header with Icon and Amount */}
                        <div className="flex items-start justify-between">
                          <div className={`p-2 rounded-lg ${
                            finance.type === 'income' 
                              ? 'bg-green-100 dark:bg-green-900/30' 
                              : 'bg-red-100 dark:bg-red-900/30'
                          }`}>
                            {getCategoryIcon(finance.category)}
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${
                              finance.type === 'income' 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {finance.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(finance.amount))}
                            </p>
                          </div>
                        </div>
                        
                        {/* Description and Priority */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-foreground text-base leading-tight">{finance.description}</h3>
                            {getPriorityIcon(finance.priority)}
                          </div>
                          <p className="text-sm text-muted-foreground">{finance.category}</p>
                        </div>
                        
                        {/* Date and Status */}
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center text-muted-foreground">
                            <Calendar className="w-4 h-4 mr-2" />
                            {formatDate(finance.date)}
                          </span>
                          {getStatusBadge(finance.status, finance.isActive)}
                        </div>
                        
                        {/* Actions */}
                        <div className="flex justify-end pt-2 border-t border-border">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem 
                                onClick={() => handleViewDetails(finance)}
                                className="flex items-center"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Details anzeigen
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleEditFinance(finance)}
                                className="flex items-center"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Bearbeiten
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => toggleFinanceStatus(finance)}
                                className={`flex items-center ${
                                  finance.isActive 
                                    ? 'text-orange-600 dark:text-orange-400' 
                                    : 'text-green-600 dark:text-green-400'
                                }`}
                              >
                                {finance.isActive ? (
                                  <>
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Deaktivieren
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Aktivieren
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteFinance(finance.id)}
                                className="flex items-center text-red-600 dark:text-red-400"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Löschen
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              // Table/List View
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="text-left p-4 font-medium text-muted-foreground">Typ</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Beschreibung</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Kategorie</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Datum</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                        <th className="text-right p-4 font-medium text-muted-foreground">Betrag</th>
                        <th className="text-center p-4 font-medium text-muted-foreground w-20">Aktionen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredFinances.map((finance: any) => (
                        <tr key={finance.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <div className={`p-1.5 rounded-md ${
                                finance.type === 'income' 
                                  ? 'bg-green-100 dark:bg-green-900/30' 
                                  : 'bg-red-100 dark:bg-red-900/30'
                              }`}>
                                {finance.type === 'income' ? (
                                  <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" />
                                ) : (
                                  <TrendingDown className="w-3 h-3 text-red-600 dark:text-red-400" />
                                )}
                              </div>
                              <span className="text-sm font-medium">
                                {finance.type === 'income' ? 'Einnahme' : 'Ausgabe'}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-foreground">{finance.description}</span>
                              {getPriorityIcon(finance.priority)}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              {getCategoryIcon(finance.category)}
                              <span className="text-sm text-muted-foreground">{finance.category}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-sm text-muted-foreground">
                              {formatDate(finance.date)}
                            </span>
                          </td>
                          <td className="p-4">
                            {getStatusBadge(finance.status, finance.isActive)}
                          </td>
                          <td className="p-4 text-right">
                            <span className={`font-bold ${
                              finance.type === 'income' 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {finance.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(finance.amount))}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex justify-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem 
                                    onClick={() => handleViewDetails(finance)}
                                    className="flex items-center"
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    Details anzeigen
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleEditFinance(finance)}
                                    className="flex items-center"
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Bearbeiten
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => toggleFinanceStatus(finance)}
                                    className={`flex items-center ${
                                      finance.isActive 
                                        ? 'text-orange-600 dark:text-orange-400' 
                                        : 'text-green-600 dark:text-green-400'
                                    }`}
                                  >
                                    {finance.isActive ? (
                                      <>
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Deaktivieren
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Aktivieren
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteFinance(finance.id)}
                                    className="flex items-center text-red-600 dark:text-red-400"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Löschen
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="membership" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Mitgliedsbeiträge
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Dialog open={isMemberFeeDialogOpen} onOpenChange={setIsMemberFeeDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full">
                          <Plus className="w-4 h-4 mr-2" />
                          Mitgliedsbeitrag hinzufügen
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                    
                    {memberFees.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">Keine Mitgliedsbeiträge definiert</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {memberFees.map((fee: any) => (
                          <div key={fee.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                            <div>
                              <p className="font-medium">{fee.feeType}</p>
                              <p className="text-sm text-muted-foreground">{formatCurrency(fee.amount)} / {fee.period}</p>
                            </div>
                            {getStatusBadge(fee.status)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Trophy className="w-5 h-5 mr-2" />
                    Trainingsbeiträge
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Dialog open={isTrainingFeeDialogOpen} onOpenChange={setIsTrainingFeeDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full">
                          <Plus className="w-4 h-4 mr-2" />
                          Trainingsbeitrag hinzufügen
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                    
                    {trainingFees.length === 0 ? (
                      <div className="text-center py-8">
                        <Trophy className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">Keine Trainingsbeiträge definiert</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {trainingFees.map((fee: any) => (
                          <div key={fee.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                            <div>
                              <p className="font-medium">{fee.feeType}</p>
                              <p className="text-sm text-muted-foreground">{formatCurrency(fee.amount)} / {fee.period}</p>
                            </div>
                            {getStatusBadge(fee.status)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Finanzberichte</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Berichte kommen bald</h3>
                  <p className="text-muted-foreground">
                    Detaillierte Finanzberichte und Analysen werden in einer zukünftigen Version verfügbar sein.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Details Modal */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={handleCloseDetailsModal}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Eye className="w-5 h-5 mr-2" />
                Transaktionsdetails
              </DialogTitle>
              <DialogDescription>
                Vollständige Informationen zur ausgewählten Finanztransaktion
              </DialogDescription>
            </DialogHeader>

            {selectedFinance && (
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Typ</Label>
                    <div className="flex items-center space-x-2">
                      <div className={`p-2 rounded-lg ${
                        selectedFinance.type === 'income' 
                          ? 'bg-green-100 dark:bg-green-900/30' 
                          : 'bg-red-100 dark:bg-red-900/30'
                      }`}>
                        {selectedFinance.type === 'income' ? (
                          <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <span className="font-medium">
                        {selectedFinance.type === 'income' ? 'Einnahme' : 'Ausgabe'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Betrag</Label>
                    <p className={`text-2xl font-bold ${
                      selectedFinance.type === 'income' 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {selectedFinance.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(selectedFinance.amount))}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Beschreibung</Label>
                    <p className="text-foreground">{selectedFinance.description}</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Kategorie</Label>
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(selectedFinance.category)}
                      <span>{selectedFinance.category}</span>
                      {selectedFinance.subcategory && (
                        <Badge variant="outline">{selectedFinance.subcategory}</Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Datum</Label>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{formatDate(selectedFinance.date)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(selectedFinance.status, selectedFinance.isActive)}
                      <div className="flex items-center space-x-1">
                        {getPriorityIcon(selectedFinance.priority)}
                        <span className="text-sm text-muted-foreground capitalize">{translatePriority(selectedFinance.priority)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                {(selectedFinance.dueDate || selectedFinance.paymentMethod || selectedFinance.recurring) && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Zusätzliche Informationen</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedFinance.dueDate && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">Fälligkeitsdatum</Label>
                          <p>{formatDate(selectedFinance.dueDate)}</p>
                        </div>
                      )}

                      {selectedFinance.paymentMethod && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">Zahlungsmethode</Label>
                          <p>{translatePaymentMethod(selectedFinance.paymentMethod)}</p>
                        </div>
                      )}

                      {selectedFinance.recurring && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">Wiederkehrend</Label>
                          <div className="flex items-center space-x-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span>{selectedFinance.recurringInterval || 'Ja'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedFinance.notes && (
                  <div className="border-t pt-4">
                    <Label className="text-sm font-medium text-muted-foreground">Notizen</Label>
                    <p className="mt-2 text-foreground whitespace-pre-wrap">{selectedFinance.notes}</p>
                  </div>
                )}

                {/* Metadata */}
                <div className="border-t pt-4 text-sm text-muted-foreground">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">Erstellt:</span> {formatDate(selectedFinance.createdAt)}
                    </div>
                    {selectedFinance.updatedAt !== selectedFinance.createdAt && (
                      <div>
                        <span className="font-medium">Aktualisiert:</span> {formatDate(selectedFinance.updatedAt)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Modal */}
        <Dialog open={isEditDialogOpen} onOpenChange={handleCloseEditModal}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Edit className="w-5 h-5 mr-2" />
                Transaktion bearbeiten
              </DialogTitle>
              <DialogDescription>
                Ändern Sie die Details der ausgewählten Finanztransaktion
              </DialogDescription>
            </DialogHeader>

            <Form {...editFinanceForm}>
              <form 
                onSubmit={(e) => {
                  console.log('=== FORM SUBMIT EVENT ===');
                  console.log('Form event:', e);
                  console.log('Form values before submit:', editFinanceForm.getValues());
                  console.log('Form errors before submit:', editFinanceForm.formState.errors);
                  
                  const handleSubmit = editFinanceForm.handleSubmit(
                    (data) => {
                      console.log('=== FORM VALIDATION PASSED ===');
                      handleUpdateFinance(data);
                    },
                    (errors) => {
                      console.log('=== FORM VALIDATION FAILED ===');
                      console.log('Validation errors:', errors);
                    }
                  );
                  
                  return handleSubmit(e);
                }} 
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={editFinanceForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Typ</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Typ wählen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="income">Einnahme</SelectItem>
                            <SelectItem value="expense">Ausgabe</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editFinanceForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Betrag (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editFinanceForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Beschreibung</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Beschreibung der Transaktion"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editFinanceForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kategorie</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Kategorie wählen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Mitgliedsbeitrag">Mitgliedsbeitrag</SelectItem>
                            <SelectItem value="Trainingsbeitrag">Trainingsbeitrag</SelectItem>
                            <SelectItem value="Ausrüstung">Ausrüstung</SelectItem>
                            <SelectItem value="Anlage">Anlage</SelectItem>
                            <SelectItem value="Veranstaltung">Veranstaltung</SelectItem>
                            <SelectItem value="Sonstiges">Sonstiges</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editFinanceForm.control}
                    name="subcategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unterkategorie (optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Unterkategorie"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editFinanceForm.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Datum</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editFinanceForm.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fälligkeitsdatum (optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editFinanceForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Status wählen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Ausstehend</SelectItem>
                            <SelectItem value="paid">Bezahlt</SelectItem>
                            <SelectItem value="overdue">Überfällig</SelectItem>
                            <SelectItem value="cancelled">Storniert</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editFinanceForm.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priorität</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Priorität wählen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Niedrig</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="high">Hoch</SelectItem>
                            <SelectItem value="urgent">Dringend</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editFinanceForm.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zahlungsmethode (optional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Zahlungsmethode wählen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cash">Bargeld</SelectItem>
                            <SelectItem value="bank_transfer">Banküberweisung</SelectItem>
                            <SelectItem value="card">Karte</SelectItem>
                            <SelectItem value="paypal">PayPal</SelectItem>
                            <SelectItem value="other">Sonstiges</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editFinanceForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Notizen (optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Zusätzliche Notizen zur Transaktion"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseEditModal}
                  >
                    Abbrechen
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateFinanceMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      console.log('=== EDIT BUTTON CLICKED ===');
                      console.log('editingFinance:', editingFinance);
                      console.log('editFinanceForm values:', editFinanceForm.getValues());
                      console.log('editFinanceForm errors:', editFinanceForm.formState.errors);
                    }}
                  >
                    {updateFinanceMutation.isPending ? 'Speichern...' : 'Änderungen speichern'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Create Modal */}
        <Dialog open={isCreateDialogOpen} onOpenChange={handleCloseCreateModal}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                Neue Transaktion erstellen
              </DialogTitle>
              <DialogDescription>
                Fügen Sie eine neue Finanztransaktion zu Ihrem Verein hinzu
              </DialogDescription>
            </DialogHeader>

            <Form {...financeForm}>
              <form onSubmit={financeForm.handleSubmit(handleCreateFinance)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={editFinanceForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Typ</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Typ wählen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="income">Einnahme</SelectItem>
                            <SelectItem value="expense">Ausgabe</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editFinanceForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Betrag (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editFinanceForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Beschreibung</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Beschreibung der Transaktion"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editFinanceForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kategorie</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Kategorie wählen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Mitgliedsbeitrag">Mitgliedsbeitrag</SelectItem>
                            <SelectItem value="Trainingsbeitrag">Trainingsbeitrag</SelectItem>
                            <SelectItem value="Ausrüstung">Ausrüstung</SelectItem>
                            <SelectItem value="Anlage">Anlage</SelectItem>
                            <SelectItem value="Veranstaltung">Veranstaltung</SelectItem>
                            <SelectItem value="Sonstiges">Sonstiges</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editFinanceForm.control}
                    name="subcategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unterkategorie (optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Unterkategorie"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editFinanceForm.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Datum</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editFinanceForm.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fälligkeitsdatum (optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editFinanceForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Status wählen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Ausstehend</SelectItem>
                            <SelectItem value="paid">Bezahlt</SelectItem>
                            <SelectItem value="overdue">Überfällig</SelectItem>
                            <SelectItem value="cancelled">Storniert</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editFinanceForm.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priorität</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Priorität wählen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Niedrig</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="high">Hoch</SelectItem>
                            <SelectItem value="urgent">Dringend</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editFinanceForm.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zahlungsmethode (optional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Zahlungsmethode wählen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cash">Bargeld</SelectItem>
                            <SelectItem value="bank_transfer">Banküberweisung</SelectItem>
                            <SelectItem value="card">Karte</SelectItem>
                            <SelectItem value="paypal">PayPal</SelectItem>
                            <SelectItem value="other">Sonstiges</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editFinanceForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Notizen (optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Zusätzliche Notizen zur Transaktion"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseCreateModal}
                  >
                    Abbrechen
                  </Button>
                  <Button
                    type="submit"
                    disabled={createFinanceMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {createFinanceMutation.isPending ? 'Erstellen...' : 'Transaktion erstellen'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
