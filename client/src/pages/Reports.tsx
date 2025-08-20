import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Download, FileText, TrendingUp, Users, Euro, Settings, Play, CheckCircle, AlertCircle } from "lucide-react";
import { FeatureGate } from "@/components/FeatureGate";
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

  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<Record<string, 'pending' | 'success' | 'error'>>({});

  // Set page info
  const { setPage } = usePage();
  
  useEffect(() => {
    setPage("Berichte", "Automatische Berichte und Analysen");
  }, [setPage]);

  // Data queries
  const { data: members = [] } = useQuery<any[]>({
    queryKey: ['/api/clubs', selectedClub?.id, 'members'],
    enabled: !!selectedClub?.id,
    retry: false,
  });

  const { data: teams = [] } = useQuery<any[]>({
    queryKey: ['/api/clubs', selectedClub?.id, 'teams'],
    enabled: !!selectedClub?.id,
    retry: false,
  });

  const { data: finances = [] } = useQuery<any[]>({
    queryKey: ['/api/clubs', selectedClub?.id, 'finances'],
    enabled: !!selectedClub?.id,
    retry: false,
  });

  const { data: memberFees = [] } = useQuery<any[]>({
    queryKey: ['/api/clubs', selectedClub?.id, 'member-fees'],
    enabled: !!selectedClub?.id,
    retry: false,
  });

  const { data: trainingFees = [] } = useQuery<any[]>({
    queryKey: ['/api/clubs', selectedClub?.id, 'training-fees'],
    enabled: !!selectedClub?.id,
    retry: false,
  });

  const { data: players = [] } = useQuery<any[]>({
    queryKey: ['/api/clubs', selectedClub?.id, 'players'],
    enabled: !!selectedClub?.id,
    retry: false,
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
        saldoStatus: balance >= 0 ? 'positiv' : 'negativ'
      },
      monthlyData,
      categories: generateCategoryBreakdown(yearFinances)
    };
  };

  // Member statistics report
  const generateMemberStatistics = () => {
    const totalMembers = (members as any[])?.length || 0;
    const activeMembers = (members as any[])?.filter((m: any) => m.status === 'active').length || 0;
    // Zahlende Mitglieder sind die, die tatsächlich Mitgliedsbeiträge haben
    const memberWithFees = (memberFees as any[])?.filter((f: any) => f.status === 'active') || [];
    const payingMemberIds = [...new Set(memberWithFees.map((f: any) => f.memberId))];
    const payingMembers = payingMemberIds.length;

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
      // Players haben ein 'teams' Array mit Team-Objekten
      const teamPlayers = (players as any[])?.filter((p: any) => {
        // Check if player has a teams array and if this team is in it
        if (p.teams && Array.isArray(p.teams)) {
          return p.teams.some((t: any) => t.id === team.id);
        }
        return false;
      }) || [];
      
      const teamTrainingFees = (trainingFees as any[])?.filter((f: any) => {
        if (!f.teamIds) return false;
        try {
          const teamIds = Array.isArray(f.teamIds) ? f.teamIds : JSON.parse(f.teamIds);
          return teamIds.includes(team.id.toString());
        } catch (error) {
          return false;
        }
      }) || [];

      const activePlayers = teamPlayers.filter((p: any) => p.status === 'active');
      const inactivePlayers = teamPlayers.filter((p: any) => p.status !== 'active');

      return {
        name: team.name,
        category: team.category,
        ageGroup: team.ageGroup,
        totalPlayers: teamPlayers.length,
        activePlayers: activePlayers.length,
        inactivePlayers: inactivePlayers.length,
        trainingFees: teamTrainingFees.length,
        totalFees: teamTrainingFees.reduce((sum: number, f: any) => sum + Number(f.amount), 0)
      };
    }) || [];

    // Eindeutige Spieler zählen (da Spieler in mehreren Teams sein können)
    const allPlayerIds = new Set<number>();
    const allActivePlayerIds = new Set<number>();
    const allInactivePlayerIds = new Set<number>();
    
    (players as any[])?.forEach((player: any) => {
      allPlayerIds.add(player.id);
      if (player.status === 'active') {
        allActivePlayerIds.add(player.id);
      } else {
        allInactivePlayerIds.add(player.id);
      }
    });
    
    const totalPlayers = allPlayerIds.size;
    const totalActivePlayers = allActivePlayerIds.size;
    const totalInactivePlayers = allInactivePlayerIds.size;

    return {
      title: `Team-Übersicht ${selectedYear}`,
      period: `Stand: ${format(new Date(), 'dd.MM.yyyy', { locale: de })}`,
      summary: {
        totalTeams: (teams as any[])?.length || 0,
        totalPlayers: totalPlayers,
        activePlayers: totalActivePlayers,
        inactivePlayers: totalInactivePlayers,
        averagePlayersPerTeam: totalPlayers > 0 ? Math.round(totalPlayers / ((teams as any[])?.length || 1)) : 0,
        averageActivePlayersPerTeam: totalActivePlayers > 0 ? Math.round(totalActivePlayers / ((teams as any[])?.length || 1)) : 0
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
    // Real membership trend based on actual member join dates
    const currentMemberCount = (members as any[])?.length || 0;
    
    return Array.from({ length: 12 }, (_, i) => {
      const monthDate = new Date(selectedYear, i, 1);
      const monthEnd = new Date(selectedYear, i + 1, 0);
      
      // Count members who were active in this month
      const membersInMonth = (members as any[])?.filter((member: any) => {
        const joinDate = new Date(member.joinDate || member.createdAt);
        const leaveDate = member.leaveDate ? new Date(member.leaveDate) : null;
        
        // Member was active if they joined before month end and haven't left before month start
        return joinDate <= monthEnd && (!leaveDate || leaveDate >= monthDate);
      }).length || 0;
      
      return {
        month: format(monthDate, 'MMM', { locale: de }),
        members: membersInMonth
      };
    });
  };

  // Generate beautiful PDF reports with German content
  const downloadReport = (reportType: string, data: any) => {
    const doc = new jsPDF();
    
    // Set UTF-8 encoding for German characters
    doc.setFont('helvetica');
    
    const reportTitle = reportTypes.find(r => r.id === reportType)?.title || 'Bericht';
    const clubName = selectedClub?.name || 'Verein';
    
    // Header with club branding - use safe characters
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
      doc.text('Zusammenfassung', 20, yPosition);
      yPosition += 15;
      
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      
      const summaryEntries = Object.entries(data.summary);
      const midpoint = Math.ceil(summaryEntries.length / 2);
      
      summaryEntries.forEach(([key, value], index) => {
        const label = formatSummaryLabel(key);
        const xPos = index < midpoint ? 25 : 110;
        const yPos = yPosition + (index % midpoint) * 8;
        
        doc.setFont('helvetica', 'bold');
        doc.text(`${label}:`, xPos, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(`${value}`, xPos + 50, yPos);
      });
      
      yPosition += Math.max(midpoint * 8, 40) + 10;
    }
    
    // Detailed tables with German headers
    doc.setTextColor(0, 0, 0);
    
    if (reportType === 'financial-overview' && data.monthlyData) {
      doc.setFontSize(14);
      doc.text('Monatliche Finanzuebersicht', 20, yPosition);
      yPosition += 10;
      
      autoTable(doc, {
        head: [['Monat', 'Einnahmen (Euro)', 'Ausgaben (Euro)', 'Saldo (Euro)']],
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
        doc.text('Kategorien-Aufschlueseselung', 20, finalY);
        
        autoTable(doc, {
          head: [['Kategorie', 'Einnahmen (Euro)', 'Ausgaben (Euro)']],
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
      doc.text('Altersverteilung der Mitglieder', 20, yPosition);
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
        doc.text('Mitgliedsbeitraege im Detail', 20, yPosition);
        yPosition += 10;
        
        autoTable(doc, {
          head: [['Mitglied', 'Monatsbeitrag (Euro)', 'Zeitraum', 'Jahresbeitrag (Euro)']],
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
        doc.text('Trainingsbeitraege im Detail', 20, finalY);
        
        autoTable(doc, {
          head: [['Trainingsart', 'Betrag (Euro)', 'Zeitraum', 'Zielgruppen', 'Jahresumsatz (Euro)']],
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
      doc.text('Team-Uebersicht mit Spielerstatistiken', 20, yPosition);
      yPosition += 5;
      doc.setFontSize(9);
      doc.text('Hinweis: Spieler koennen in mehreren Teams aktiv sein', 20, yPosition);
      yPosition += 10;
      
      autoTable(doc, {
        head: [['Team', 'Kategorie', 'Spieler', 'Aktive', 'Inaktive', 'Trainingsbeiträge']],
        body: data.teamStats.map((team: any) => [
          team.name,
          team.category || '-',
          team.totalPlayers.toString(),
          team.activePlayers.toString(),
          team.inactivePlayers.toString(),
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
      doc.text(`${clubName} - ${reportTitle.replace(/ü/g, 'ue').replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ß/g, 'ss')}`, 20, 285);
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
      activePlayers: 'Aktive Spieler',
      inactivePlayers: 'Inaktive Spieler',
      averagePlayersPerTeam: 'Ø Spieler pro Team',
      averageActivePlayersPerTeam: 'Ø aktive Spieler pro Team',
      averageTeamSize: 'Durchschnittliche Teamgröße',
      saldoStatus: 'Saldo-Status'
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

  return (
    <FeatureGate feature="advancedReports">
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
            

          </div>
          
          <Button 
            onClick={generateAllReports} 
            disabled={isGeneratingAll}
            className="bg-blue-600 hover:bg-blue-700 sm:ml-auto"
          >
            {isGeneratingAll ? (
              <Settings className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Alle Berichte generieren
          </Button>
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
    </FeatureGate>
  );
}