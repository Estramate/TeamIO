import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Download, FileText, TrendingUp, Users, Euro, Settings, Play, CheckCircle, AlertCircle } from "lucide-react";
import { useClub } from "@/hooks/use-club";
import { usePage } from "@/contexts/PageContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ReportsPage() {
  const { toast } = useToast();
  const { selectedClub } = useClub();
  const queryClient = useQueryClient();
  
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<Record<string, 'pending' | 'success' | 'error'>>({});

  // Set page info
  const { setPage } = usePage();
  
  useEffect(() => {
    setPage("Berichte", "Automatische Berichte und Analysen");
  }, [setPage]);

  // Data queries
  const { data: members } = useQuery({
    queryKey: ['/api/clubs', selectedClub?.id, 'members'],
    enabled: !!selectedClub?.id,
  });

  const { data: teams } = useQuery({
    queryKey: ['/api/clubs', selectedClub?.id, 'teams'],
    enabled: !!selectedClub?.id,
  });

  const { data: finances } = useQuery({
    queryKey: ['/api/clubs', selectedClub?.id, 'finances'],
    enabled: !!selectedClub?.id,
  });

  const { data: memberFees } = useQuery({
    queryKey: ['/api/clubs', selectedClub?.id, 'member-fees'],
    enabled: !!selectedClub?.id,
  });

  const { data: trainingFees } = useQuery({
    queryKey: ['/api/clubs', selectedClub?.id, 'training-fees'],
    enabled: !!selectedClub?.id,
  });

  // Report types configuration
  const reportTypes = [
    {
      id: 'financial-overview',
      title: 'Finanzübersicht',
      description: 'Einnahmen, Ausgaben und Beitragsanalyse',
      icon: Euro,
      category: 'finance'
    },
    {
      id: 'member-statistics',
      title: 'Mitgliederstatistik',
      description: 'Mitgliederentwicklung und Altersstruktur',
      icon: Users,
      category: 'members'
    },
    {
      id: 'fee-analysis',
      title: 'Beitragsanalyse',
      description: 'Mitgliedsbeiträge und Trainingsbeiträge',
      icon: TrendingUp,
      category: 'finance'
    },
    {
      id: 'team-overview',
      title: 'Team-Übersicht',
      description: 'Teams, Spieler und Trainer',
      icon: Users,
      category: 'teams'
    }
  ];

  // Generate single report
  const generateSingleReport = async (reportType: string) => {
    setGenerationStatus(prev => ({ ...prev, [reportType]: 'pending' }));
    
    try {
      const reportData = await generateReportData(reportType);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setGenerationStatus(prev => ({ ...prev, [reportType]: 'success' }));
      
      // Download the report
      downloadReport(reportType, reportData);
      
      toast({
        title: "PDF-Bericht erstellt",
        description: `${reportTypes.find(r => r.id === reportType)?.title} wurde als PDF heruntergeladen.`
      });
    } catch (error) {
      setGenerationStatus(prev => ({ ...prev, [reportType]: 'error' }));
      toast({
        title: "Fehler",
        description: "Fehler beim Generieren des Berichts",
        variant: "destructive"
      });
    }
  };

  // Generate all reports
  const generateAllReports = async () => {
    setIsGeneratingAll(true);
    setGenerationStatus({});
    
    try {
      for (const report of reportTypes) {
        await generateSingleReport(report.id);
        // Small delay between reports
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      toast({
        title: "Alle PDF-Berichte erstellt",
        description: `${reportTypes.length} PDF-Berichte wurden erfolgreich generiert und heruntergeladen.`
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Fehler beim Generieren der Berichte",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingAll(false);
    }
  };

  // Generate report data based on type
  const generateReportData = async (reportType: string) => {
    const currentDate = new Date();
    const reportTitle = reportTypes.find(r => r.id === reportType)?.title || 'Bericht';
    
    switch (reportType) {
      case 'financial-overview':
        return generateFinancialOverview();
      case 'member-statistics':
        return generateMemberStatistics();
      case 'fee-analysis':
        return generateFeeAnalysis();
      case 'team-overview':
        return generateTeamOverview();
      default:
        return { title: reportTitle, data: [] };
    }
  };

  // Financial overview report
  const generateFinancialOverview = () => {
    const currentYear = selectedYear;
    const yearFinances = (finances as any[])?.filter((f: any) => 
      new Date(f.date).getFullYear() === currentYear
    ) || [];

    const totalIncome = yearFinances
      .filter((f: any) => f.type === 'income')
      .reduce((sum: number, f: any) => sum + Number(f.amount), 0);

    const totalExpenses = yearFinances
      .filter((f: any) => f.type === 'expense')
      .reduce((sum: number, f: any) => sum + Number(f.amount), 0);

    const balance = totalIncome - totalExpenses;

    // Monthly breakdown
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const monthFinances = yearFinances.filter((f: any) => 
        new Date(f.date).getMonth() + 1 === month
      );
      
      const income = monthFinances
        .filter((f: any) => f.type === 'income')
        .reduce((sum: number, f: any) => sum + Number(f.amount), 0);
        
      const expenses = monthFinances
        .filter((f: any) => f.type === 'expense')
        .reduce((sum: number, f: any) => sum + Number(f.amount), 0);

      return {
        month: format(new Date(currentYear, i, 1), 'MMM yyyy', { locale: de }),
        income,
        expenses,
        balance: income - expenses
      };
    });

    return {
      title: `Finanzübersicht ${currentYear}`,
      period: `Jahr ${currentYear}`,
      summary: {
        totalIncome: totalIncome.toLocaleString('de-DE'),
        totalExpenses: totalExpenses.toLocaleString('de-DE'),
        balance: balance.toLocaleString('de-DE'),
        balanceStatus: balance >= 0 ? 'positive' : 'negative'
      },
      monthlyData,
      categories: generateCategoryBreakdown(yearFinances)
    };
  };

  // Member statistics report
  const generateMemberStatistics = () => {
    const totalMembers = (members as any[])?.length || 0;
    const activeMembers = (members as any[])?.filter((m: any) => m.status === 'active').length || 0;
    const payingMembers = (members as any[])?.filter((m: any) => m.paysMembershipFee).length || 0;

    // Age distribution
    const ageGroups = {
      'unter 18': 0,
      '18-30': 0,
      '31-50': 0,
      'über 50': 0
    };

    (members as any[])?.forEach((member: any) => {
      if (member.birthDate) {
        const age = new Date().getFullYear() - new Date(member.birthDate).getFullYear();
        if (age < 18) ageGroups['unter 18']++;
        else if (age <= 30) ageGroups['18-30']++;
        else if (age <= 50) ageGroups['31-50']++;
        else ageGroups['über 50']++;
      }
    });

    return {
      title: `Mitgliederstatistik ${selectedYear}`,
      period: `Stand: ${format(new Date(), 'dd.MM.yyyy', { locale: de })}`,
      summary: {
        totalMembers,
        activeMembers,
        payingMembers,
        inactiveMembers: totalMembers - activeMembers
      },
      ageDistribution: ageGroups,
      membershipTrend: generateMembershipTrend()
    };
  };

  // Fee analysis report
  const generateFeeAnalysis = () => {
    const activeMemberFees = (memberFees as any[])?.filter((f: any) => f.status === 'active') || [];
    const activeTrainingFees = (trainingFees as any[])?.filter((f: any) => f.status === 'active') || [];

    const memberFeeRevenue = activeMemberFees.reduce((sum: number, f: any) => {
      const multiplier = f.period === 'monthly' ? 12 : f.period === 'quarterly' ? 4 : 1;
      return sum + (Number(f.amount) * multiplier);
    }, 0);

    const trainingFeeRevenue = activeTrainingFees.reduce((sum: number, f: any) => {
      const multiplier = f.period === 'monthly' ? 12 : f.period === 'quarterly' ? 4 : 1;
      const amount = Number(f.amount);
      
      let targets = 1;
      try {
        if (f.teamIds && f.teamIds !== '[]') {
          const teamIds = Array.isArray(f.teamIds) ? f.teamIds : JSON.parse(f.teamIds);
          targets = teamIds.length;
        }
        if (f.playerIds && f.playerIds !== '[]') {
          const playerIds = Array.isArray(f.playerIds) ? f.playerIds : JSON.parse(f.playerIds);
          targets += playerIds.length;
        }
      } catch (error) {
        console.error('Error parsing fee targets:', error);
        targets = 1;
      }
      
      return sum + (amount * multiplier * Math.max(1, targets));
    }, 0);

    return {
      title: `Beitragsanalyse ${selectedYear}`,
      period: `Jährliche Hochrechnung`,
      summary: {
        memberFeeRevenue: memberFeeRevenue.toLocaleString('de-DE'),
        trainingFeeRevenue: trainingFeeRevenue.toLocaleString('de-DE'),
        totalFeeRevenue: (memberFeeRevenue + trainingFeeRevenue).toLocaleString('de-DE'),
        activeMemberFees: activeMemberFees.length,
        activeTrainingFees: activeTrainingFees.length
      },
      feeBreakdown: {
        memberFees: activeMemberFees.map((f: any) => ({
          member: (members as any[])?.find((m: any) => m.id === f.memberId)?.firstName + ' ' + 
                  (members as any[])?.find((m: any) => m.id === f.memberId)?.lastName,
          amount: Number(f.amount),
          period: f.period,
          annualAmount: Number(f.amount) * (f.period === 'monthly' ? 12 : f.period === 'quarterly' ? 4 : 1)
        })),
        trainingFees: activeTrainingFees.map((f: any) => {
          let targets = 1;
          try {
            if (f.teamIds && f.teamIds !== '[]') {
              const teamIds = Array.isArray(f.teamIds) ? f.teamIds : JSON.parse(f.teamIds);
              targets = teamIds.length;
            }
            if (f.playerIds && f.playerIds !== '[]') {
              const playerIds = Array.isArray(f.playerIds) ? f.playerIds : JSON.parse(f.playerIds);
              targets += playerIds.length;
            }
          } catch (error) {
            console.error('Error parsing fee targets:', error);
            targets = 1;
          }
          return {
            name: f.name,
            amount: Number(f.amount),
            period: f.period,
            targets: Math.max(1, targets)
          };
        })
      }
    };
  };

  // Team overview report
  const generateTeamOverview = () => {
    const teamStats = (teams as any[])?.map((team: any) => {
      const teamMembers = (members as any[])?.filter((m: any) => m.teamId === team.id) || [];
      const teamTrainingFees = (trainingFees as any[])?.filter((f: any) => {
        if (!f.teamIds) return false;
        const teamIds = Array.isArray(f.teamIds) ? f.teamIds : JSON.parse(f.teamIds);
        return teamIds.includes(team.id.toString());
      }) || [];

      return {
        name: team.name,
        category: team.category,
        ageGroup: team.ageGroup,
        memberCount: teamMembers.length,
        activeMembers: teamMembers.filter((m: any) => m.status === 'active').length,
        trainingFees: teamTrainingFees.length,
        totalFees: teamTrainingFees.reduce((sum: number, f: any) => sum + Number(f.amount), 0)
      };
    }) || [];

    return {
      title: `Team-Übersicht ${selectedYear}`,
      period: `Stand: ${format(new Date(), 'dd.MM.yyyy', { locale: de })}`,
      summary: {
        totalTeams: (teams as any[])?.length || 0,
        totalPlayers: teamStats.reduce((sum: number, team: any) => sum + team.memberCount, 0),
        averageTeamSize: Math.round(teamStats.reduce((sum: number, team: any) => sum + team.memberCount, 0) / ((teams as any[])?.length || 1))
      },
      teamStats
    };
  };

  // Helper functions
  const generateCategoryBreakdown = (finances: any[]) => {
    const categories: any = {};
    finances.forEach((f: any) => {
      const cat = f.category || 'Unbekannt';
      if (!categories[cat]) {
        categories[cat] = { income: 0, expenses: 0 };
      }
      if (f.type === 'income') {
        categories[cat].income += Number(f.amount);
      } else {
        categories[cat].expenses += Number(f.amount);
      }
    });
    return categories;
  };

  const generateMembershipTrend = () => {
    // Simplified trend - in real implementation, this would analyze historical data
    return Array.from({ length: 12 }, (_, i) => ({
      month: format(new Date(selectedYear, i, 1), 'MMM', { locale: de }),
      members: ((members as any[])?.length || 0) + Math.floor(Math.random() * 5 - 2) // Mock trend
    }));
  };

  // Generate beautiful PDF reports
  const downloadReport = (reportType: string, data: any) => {
    const doc = new jsPDF();
    const reportTitle = reportTypes.find(r => r.id === reportType)?.title || 'Bericht';
    const clubName = selectedClub?.name || 'Verein';
    
    // Header
    doc.setFontSize(20);
    doc.text(clubName, 20, 20);
    doc.setFontSize(16);
    doc.text(reportTitle, 20, 30);
    doc.setFontSize(12);
    doc.text(`Zeitraum: ${data.period}`, 20, 40);
    doc.text(`Erstellt am: ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: de })}`, 20, 50);
    
    let yPosition = 70;
    
    // Summary section
    if (data.summary) {
      doc.setFontSize(14);
      doc.text('Zusammenfassung', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      Object.entries(data.summary).forEach(([key, value]) => {
        const label = formatSummaryLabel(key);
        doc.text(`${label}: ${value}`, 20, yPosition);
        yPosition += 6;
      });
      yPosition += 10;
    }
    
    // Tables for detailed data
    if (reportType === 'financial-overview' && data.monthlyData) {
      autoTable(doc, {
        head: [['Monat', 'Einnahmen', 'Ausgaben', 'Saldo']],
        body: data.monthlyData.map((row: any) => [
          row.month,
          `€ ${row.income.toLocaleString('de-DE')}`,
          `€ ${row.expenses.toLocaleString('de-DE')}`,
          `€ ${row.balance.toLocaleString('de-DE')}`
        ]),
        startY: yPosition,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] }
      });
    }
    
    if (reportType === 'member-statistics' && data.ageDistribution) {
      autoTable(doc, {
        head: [['Altersgruppe', 'Anzahl']],
        body: Object.entries(data.ageDistribution).map(([age, count]) => [age, count.toString()]),
        startY: yPosition,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [34, 197, 94] }
      });
    }
    
    if (reportType === 'fee-analysis' && data.feeBreakdown) {
      if (data.feeBreakdown.memberFees?.length > 0) {
        autoTable(doc, {
          head: [['Mitglied', 'Betrag', 'Zeitraum', 'Jahresbetrag']],
          body: data.feeBreakdown.memberFees.map((fee: any) => [
            fee.member || 'Unbekannt',
            `€ ${fee.amount}`,
            fee.period,
            `€ ${fee.annualAmount}`
          ]),
          startY: yPosition,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [168, 85, 247] }
        });
      }
    }
    
    if (reportType === 'team-overview' && data.teamStats) {
      autoTable(doc, {
        head: [['Team', 'Kategorie', 'Mitglieder', 'Aktiv', 'Trainingsbeiträge']],
        body: data.teamStats.map((team: any) => [
          team.name,
          team.category || '',
          team.memberCount.toString(),
          team.activeMembers.toString(),
          team.trainingFees.toString()
        ]),
        startY: yPosition,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [249, 115, 22] }
      });
    }
    
    // Save PDF
    doc.save(`${reportType}-${selectedYear}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };
  
  const formatSummaryLabel = (key: string): string => {
    const labels: Record<string, string> = {
      totalIncome: 'Gesamteinnahmen',
      totalExpenses: 'Gesamtausgaben',
      balance: 'Saldo',
      totalMembers: 'Mitglieder gesamt',
      activeMembers: 'Aktive Mitglieder',
      payingMembers: 'Zahlende Mitglieder',
      inactiveMembers: 'Inaktive Mitglieder',
      memberFeeRevenue: 'Mitgliedsbeiträge',
      trainingFeeRevenue: 'Trainingsbeiträge',
      totalFeeRevenue: 'Beiträge gesamt',
      activeMemberFees: 'Aktive Mitgliedsbeiträge',
      activeTrainingFees: 'Aktive Trainingsbeiträge',
      totalTeams: 'Teams gesamt',
      totalPlayers: 'Spieler gesamt',
      averageTeamSize: 'Durchschnittliche Teamgröße'
    };
    return labels[key] || key;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Settings className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: format(new Date(2024, i, 1), 'MMMM', { locale: de }) }));

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-6 p-6">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Berichte & Analysen</h1>
            <p className="text-muted-foreground">Automatische PDF-Generierung von Vereinsberichten</p>
          </div>
          
          <div className="flex flex-wrap gap-3 items-center">
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map(month => (
                  <SelectItem key={month.value} value={month.value.toString()}>{month.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              onClick={generateAllReports} 
              disabled={isGeneratingAll}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isGeneratingAll ? (
                <Settings className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Alle Berichte generieren
            </Button>
          </div>
        </div>

        {/* Report Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            const status = generationStatus[report.id];
            
            return (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5 text-blue-600" />
                      {report.title}
                    </div>
                    {getStatusIcon(status)}
                  </CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="capitalize">
                      {report.category}
                    </Badge>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => generateSingleReport(report.id)}
                      disabled={status === 'pending' || isGeneratingAll}
                    >
                      {status === 'pending' ? (
                        <Settings className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      Generieren
                    </Button>
                  </div>
                  
                  {status === 'success' && (
                    <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm text-green-700 dark:text-green-300">
                      PDF-Bericht erfolgreich erstellt und heruntergeladen
                    </div>
                  )}
                  
                  {status === 'error' && (
                    <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-700 dark:text-red-300">
                      Fehler beim Erstellen des PDF-Berichts
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <p className="text-2xl font-bold">{(members as any[])?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Mitglieder</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold">{(teams as any[])?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Teams</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <Euro className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <p className="text-2xl font-bold">{(memberFees as any[])?.filter((f: any) => f.status === 'active').length || 0}</p>
                <p className="text-sm text-muted-foreground">Aktive Beiträge</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                <p className="text-2xl font-bold">{(finances as any[])?.filter((f: any) => new Date(f.date).getFullYear() === selectedYear).length || 0}</p>
                <p className="text-sm text-muted-foreground">Transaktionen {selectedYear}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Generation Progress */}
        {isGeneratingAll && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 animate-spin" />
                Berichte werden generiert...
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {reportTypes.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <span className="text-sm">{report.title}</span>
                    {getStatusIcon(generationStatus[report.id])}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}