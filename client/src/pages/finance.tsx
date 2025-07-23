import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useClub } from "@/hooks/use-club";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Euro, Search, Plus, TrendingUp, TrendingDown, Download } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function Finance() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { selectedClub } = useClub();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

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

  const { data: finances = [], isLoading: isFinancesLoading } = useQuery({
    queryKey: ['/api/clubs', selectedClub?.id, 'finances'],
    enabled: !!selectedClub?.id,
    retry: false,
  });

  const filteredFinances = finances.filter((finance: any) => {
    const matchesSearch = 
      finance.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      finance.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || finance.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || finance.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || finance.status === statusFilter;
    
    return matchesSearch && matchesType && matchesCategory && matchesStatus;
  });

  // Calculate statistics
  const totalIncome = finances
    .filter((f: any) => f.type === 'income')
    .reduce((sum: number, f: any) => sum + Number(f.amount), 0);
  
  const totalExpenses = finances
    .filter((f: any) => f.type === 'expense')
    .reduce((sum: number, f: any) => sum + Number(f.amount), 0);
  
  const balance = totalIncome - totalExpenses;
  
  const pendingAmount = finances
    .filter((f: any) => f.status === 'pending')
    .reduce((sum: number, f: any) => sum + Number(f.amount), 0);

  if (!selectedClub) {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="text-center py-12">
          <Euro className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Kein Verein ausgewählt</h3>
          <p className="mt-1 text-sm text-gray-500">
            Bitte wählen Sie einen Verein aus, um Finanzen zu verwalten.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6">
      <div className="mb-6">
        <div className="flex items-center justify-end space-x-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Transaktion hinzufügen
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="transactions">Transaktionen</TabsTrigger>
          <TabsTrigger value="membership">Mitgliedsbeiträge</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="reports">Berichte</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Einnahmen</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      €{totalIncome.toLocaleString('de-DE')}
                    </p>
                    <p className="text-sm text-green-500 mt-1 flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +12% vs. Vormonat
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="text-green-500 text-lg" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Ausgaben</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      €{totalExpenses.toLocaleString('de-DE')}
                    </p>
                    <p className="text-sm text-red-500 mt-1 flex items-center">
                      <TrendingDown className="w-3 h-3 mr-1" />
                      +5% vs. Vormonat
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <TrendingDown className="text-red-500 text-lg" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Saldo</p>
                    <p className={`text-3xl font-bold mt-1 ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      €{balance.toLocaleString('de-DE')}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Aktueller Stand
                    </p>
                  </div>
                  <div className={`w-12 h-12 ${balance >= 0 ? 'bg-green-100' : 'bg-red-100'} rounded-lg flex items-center justify-center`}>
                    <Euro className={`text-lg ${balance >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Ausstehend</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      €{pendingAmount.toLocaleString('de-DE')}
                    </p>
                    <p className="text-sm text-orange-500 mt-1">
                      Zu bearbeiten
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Euro className="text-orange-500 text-lg" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Neueste Transaktionen</CardTitle>
            </CardHeader>
            <CardContent>
              {isFinancesLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center space-x-4">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : finances.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Noch keine Transaktionen vorhanden</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {finances.slice(0, 5).map((finance: any) => (
                    <div key={finance.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          finance.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {finance.type === 'income' ? (
                            <TrendingUp className={`w-4 h-4 text-green-500`} />
                          ) : (
                            <TrendingDown className={`w-4 h-4 text-red-500`} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{finance.description}</p>
                          <p className="text-xs text-gray-500">
                            {finance.category} • {format(new Date(finance.date), 'dd.MM.yyyy', { locale: de })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${
                          finance.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {finance.type === 'income' ? '+' : '-'}€{Number(finance.amount).toLocaleString('de-DE')}
                        </p>
                        <Badge variant={finance.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                          {finance.status === 'completed' ? 'Abgeschlossen' : 'Ausstehend'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Transaktionen suchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Typ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Typen</SelectItem>
                    <SelectItem value="income">Einnahmen</SelectItem>
                    <SelectItem value="expense">Ausgaben</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Status</SelectItem>
                    <SelectItem value="completed">Abgeschlossen</SelectItem>
                    <SelectItem value="pending">Ausstehend</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Transactions List */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Beschreibung
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kategorie
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Datum
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Betrag
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aktionen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredFinances.map((finance: any) => (
                      <tr key={finance.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                              finance.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                              {finance.type === 'income' ? (
                                <TrendingUp className={`w-4 h-4 text-green-500`} />
                              ) : (
                                <TrendingDown className={`w-4 h-4 text-red-500`} />
                              )}
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {finance.description}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {finance.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(finance.date), 'dd.MM.yyyy', { locale: de })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-semibold ${
                            finance.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {finance.type === 'income' ? '+' : '-'}€{Number(finance.amount).toLocaleString('de-DE')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={finance.status === 'completed' ? 'default' : 'secondary'}>
                            {finance.status === 'completed' ? 'Abgeschlossen' : 'Ausstehend'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button variant="outline" size="sm">
                            Bearbeiten
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="membership">
          <Card>
            <CardHeader>
              <CardTitle>Mitgliedsbeiträge</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-gray-500">Mitgliedsbeiträge-Verwaltung wird hier implementiert</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget">
          <Card>
            <CardHeader>
              <CardTitle>Budget-Planung</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-gray-500">Budget-Planung wird hier implementiert</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Finanzberichte</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-gray-500">Finanzberichte werden hier implementiert</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
