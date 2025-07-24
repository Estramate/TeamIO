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
      // Count players in this team
      const teamPlayers = (players as any[])?.filter((p: any) => p.teamId === team.id) || [];
      const teamMembers = (members as any[])?.filter((m: any) => m.teamId === team.id) || [];
      const teamTrainingFees = (trainingFees as any[])?.filter((f: any) => {
        if (!f.teamIds) return false;
        try {
          const teamIds = Array.isArray(f.teamIds) ? f.teamIds : JSON.parse(f.teamIds);
          return teamIds.includes(team.id.toString());
        } catch (error) {
          return false;
        }
      }) || [];

      return {
        name: team.name,
        category: team.category,
        ageGroup: team.ageGroup,
        playerCount: teamPlayers.length, // Spieler (players)
        memberCount: teamMembers.length, // Mitglieder (members)
        activeMembers: teamMembers.filter((m: any) => m.status === 'active').length,
        trainingFees: teamTrainingFees.length,
        totalFees: teamTrainingFees.reduce((sum: number, f: any) => sum + Number(f.amount), 0)
      };
    }) || [];

    const totalPlayers = teamStats.reduce((sum: number, team: any) => sum + team.playerCount, 0);
    const totalMembers = teamStats.reduce((sum: number, team: any) => sum + team.memberCount, 0);

    return {
      title: `Team-Übersicht ${selectedYear}`,
      period: `Stand: ${format(new Date(), 'dd.MM.yyyy', { locale: de })}`,
      summary: {
        totalTeams: (teams as any[])?.length || 0,
        totalPlayers: totalPlayers,
        totalMembers: totalMembers,
        averagePlayersPerTeam: Math.round(totalPlayers / ((teams as any[])?.length || 1)),
        averageMembersPerTeam: Math.round(totalMembers / ((teams as any[])?.length || 1))
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

  // Generate beautiful PDF reports with German content
  const downloadReport = (reportType: string, data: any) => {
    const doc = new jsPDF();
    const reportTitle = reportTypes.find(r => r.id === reportType)?.title || 'Bericht';
    const clubName = selectedClub?.name || 'Verein';
    
    // Header with club branding
    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0);
    doc.text(clubName, 20, 25);
    
    doc.setFontSize(18);
    doc.setTextColor(59, 130, 246);
    doc.text(reportTitle, 20, 40);
    
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(`Berichtszeitraum: ${data.period}`, 20, 52);
    doc.text(`Erstellt am: ${format(new Date(), 'dd.MM.yyyy um HH:mm', { locale: de })} Uhr`, 20, 62);
    
    // Horizontal line
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 70, 190, 70);
    
    let yPosition = 85;
    
    // Summary section with better formatting
    if (data.summary) {
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('📊 Zusammenfassung', 20, yPosition);
      yPosition += 15;
      
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      
      const summaryEntries = Object.entries(data.summary);
      const midpoint = Math.ceil(summaryEntries.length / 2);
      
      summaryEntries.forEach(([key, value], index) => {
        const label = formatSummaryLabel(key);
        const xPos = index < midpoint ? 25 : 110;
        const yPos = yPosition + (index % midpoint) * 8;
        
        doc.setFont(undefined, 'bold');
        doc.text(`${label}:`, xPos, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(`${value}`, xPos + 50, yPos);
      });
      
      yPosition += Math.max(midpoint * 8, 40) + 10;
    }
    
    // Detailed tables with German headers
    doc.setTextColor(0, 0, 0);
    
    if (reportType === 'financial-overview' && data.monthlyData) {
      doc.setFontSize(14);
      doc.text('💰 Monatliche Finanzübersicht', 20, yPosition);
      yPosition += 10;
      
      autoTable(doc, {
        head: [['Monat', 'Einnahmen (€)', 'Ausgaben (€)', 'Saldo (€)']],
        body: data.monthlyData.map((row: any) => [
          row.month,
          row.income.toLocaleString('de-DE', { minimumFractionDigits: 2 }),
          row.expenses.toLocaleString('de-DE', { minimumFractionDigits: 2 }),
          row.balance.toLocaleString('de-DE', { minimumFractionDigits: 2 })
        ]),
        startY: yPosition,
        styles: { 
          fontSize: 9,
          cellPadding: 4,
          halign: 'center'
        },
        headStyles: { 
          fillColor: [59, 130, 246],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        tableLineColor: [226, 232, 240],
        tableLineWidth: 0.1
      });
      
      // Add category breakdown if available
      if (data.categories && Object.keys(data.categories).length > 0) {
        const finalY = (doc as any).lastAutoTable.finalY + 15;
        doc.setFontSize(14);
        doc.text('📈 Kategorien-Aufschlüsselung', 20, finalY);
        
        autoTable(doc, {
          head: [['Kategorie', 'Einnahmen (€)', 'Ausgaben (€)']],
          body: Object.entries(data.categories).map(([category, values]: [string, any]) => [
            category,
            values.income.toLocaleString('de-DE', { minimumFractionDigits: 2 }),
            values.expenses.toLocaleString('de-DE', { minimumFractionDigits: 2 })
          ]),
          startY: finalY + 5,
          styles: { fontSize: 9, cellPadding: 4 },
          headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255] },
          alternateRowStyles: { fillColor: [240, 253, 244] }
        });
      }
    }
    
    if (reportType === 'member-statistics' && data.ageDistribution) {
      doc.setFontSize(14);
      doc.text('👥 Altersverteilung der Mitglieder', 20, yPosition);
      yPosition += 10;
      
      autoTable(doc, {
        head: [['Altersgruppe', 'Anzahl Mitglieder', 'Anteil (%)']],
        body: Object.entries(data.ageDistribution).map(([age, count]) => {
          const percentage = ((count as number) / data.summary.totalMembers * 100).toFixed(1);
          return [age, (count as number).toString(), `${percentage}%`];
        }),
        startY: yPosition,
        styles: { 
          fontSize: 10,
          cellPadding: 5,
          halign: 'center'
        },
        headStyles: { 
          fillColor: [34, 197, 94],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: { fillColor: [240, 253, 244] }
      });
    }
    
    if (reportType === 'fee-analysis' && data.feeBreakdown) {
      if (data.feeBreakdown.memberFees?.length > 0) {
        doc.setFontSize(14);
        doc.text('💳 Mitgliedsbeiträge im Detail', 20, yPosition);
        yPosition += 10;
        
        autoTable(doc, {
          head: [['Mitglied', 'Monatsbeitrag (€)', 'Zeitraum', 'Jahresbeitrag (€)']],
          body: data.feeBreakdown.memberFees.map((fee: any) => [
            fee.member || 'Unbekannt',
            fee.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 }),
            getPeriodLabel(fee.period),
            fee.annualAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })
          ]),
          startY: yPosition,
          styles: { 
            fontSize: 9,
            cellPadding: 4
          },
          headStyles: { 
            fillColor: [168, 85, 247],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
          },
          alternateRowStyles: { fillColor: [250, 245, 255] }
        });
      }
      
      if (data.feeBreakdown.trainingFees?.length > 0) {
        const finalY = data.feeBreakdown.memberFees?.length > 0 ? (doc as any).lastAutoTable.finalY + 15 : yPosition;
        doc.setFontSize(14);
        doc.text('🏃 Trainingsbeiträge im Detail', 20, finalY);
        
        autoTable(doc, {
          head: [['Trainingsart', 'Betrag (€)', 'Zeitraum', 'Zielgruppen', 'Jahresumsatz (€)']],
          body: data.feeBreakdown.trainingFees.map((fee: any) => [
            fee.name,
            fee.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 }),
            getPeriodLabel(fee.period),
            fee.targets.toString(),
            (fee.amount * fee.targets * (fee.period === 'monthly' ? 12 : fee.period === 'quarterly' ? 4 : 1)).toLocaleString('de-DE', { minimumFractionDigits: 2 })
          ]),
          startY: finalY + 5,
          styles: { fontSize: 9, cellPadding: 4 },
          headStyles: { fillColor: [245, 101, 101], textColor: [255, 255, 255] },
          alternateRowStyles: { fillColor: [254, 242, 242] }
        });
      }
    }
    
    if (reportType === 'team-overview' && data.teamStats) {
      doc.setFontSize(14);
      doc.text('⚽ Team-Übersicht mit Spielerstatistiken', 20, yPosition);
      yPosition += 10;
      
      autoTable(doc, {
        head: [['Team', 'Kategorie', 'Spieler', 'Mitglieder', 'Aktive Mitgl.', 'Trainingsbeiträge']],
        body: data.teamStats.map((team: any) => [
          team.name,
          team.category || '-',
          team.playerCount.toString(),
          team.memberCount.toString(),
          team.activeMembers.toString(),
          team.trainingFees.toString()
        ]),
        startY: yPosition,
        styles: { 
          fontSize: 9,
          cellPadding: 4,
          halign: 'center'
        },
        headStyles: { 
          fillColor: [249, 115, 22],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: { fillColor: [255, 247, 237] },
        columnStyles: {
          0: { halign: 'left' },
          1: { halign: 'left' }
        }
      });
    }
    
    // Footer with timestamp
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`${clubName} - ${reportTitle}`, 20, 285);
      doc.text(`Seite ${i} von ${pageCount}`, 170, 285);
    }
    
    // Save PDF with German filename
    const germanDate = format(new Date(), 'yyyy-MM-dd', { locale: de });
    const germanFileName = `${getGermanFileName(reportType)}-${selectedYear}-${germanDate}.pdf`;
    doc.save(germanFileName);
  };
  
  const getPeriodLabel = (period: string): string => {
    const periods: Record<string, string> = {
      'monthly': 'Monatlich',
      'quarterly': 'Vierteljährlich',
      'yearly': 'Jährlich',
      'one-time': 'Einmalig'
    };
    return periods[period] || period;
  };
  
  const getGermanFileName = (reportType: string): string => {
    const fileNames: Record<string, string> = {
      'financial-overview': 'Finanzuebersicht',
      'member-statistics': 'Mitgliederstatistik',
      'fee-analysis': 'Beitragsanalyse',
      'team-overview': 'Team-Uebersicht'
    };
    return fileNames[reportType] || reportType;
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
      averagePlayersPerTeam: 'Ø Spieler pro Team',
      averageMembersPerTeam: 'Ø Mitglieder pro Team',
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