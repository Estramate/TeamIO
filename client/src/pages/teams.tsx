import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useClub } from "@/hooks/use-club";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UsersRound, Search, Plus, Users, LayoutGrid, List } from "lucide-react";

export default function Teams() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { selectedClub } = useClub();
  const queryClient = useQueryClient();
  
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

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

  const { data: teams = [], isLoading: isTeamsLoading } = useQuery({
    queryKey: ['/api/clubs', selectedClub?.id, 'teams'],
    enabled: !!selectedClub?.id,
    retry: false,
  });

  const filteredTeams = teams.filter((team: any) => {
    const matchesSearch = 
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.ageGroup?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || team.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  if (!selectedClub) {
    return (
      <div className="flex-1 overflow-y-auto bg-background p-6">
        <div className="text-center py-12">
          <UsersRound className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium text-foreground">Kein Verein ausgewählt</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Bitte wählen Sie einen Verein aus, um Teams zu verwalten.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6">
      <div className="mb-6">
        <div className="flex items-center justify-end">
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Team hinzufügen
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Teams suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Kategorien</SelectItem>
                <SelectItem value="youth">Jugend</SelectItem>
                <SelectItem value="senior">Senioren</SelectItem>
                <SelectItem value="amateur">Amateur</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* View Toggle */}
          <div className="flex items-center bg-muted rounded-lg p-1 border border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('cards')}
              className={`min-w-[40px] h-8 px-2 ${
                viewMode === 'cards' 
                  ? 'bg-background text-foreground shadow-sm border border-border hover:bg-background' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('list')}
              className={`min-w-[40px] h-8 px-2 ${
                viewMode === 'list' 
                  ? 'bg-background text-foreground shadow-sm border border-border hover:bg-background' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Teams Content */}
      {isTeamsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-muted rounded w-2/3 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="text-center py-12">
          <UsersRound className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium text-foreground">Keine Teams gefunden</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchTerm || categoryFilter !== 'all' 
              ? "Versuchen Sie, Ihre Suchkriterien anzupassen."
              : "Beginnen Sie mit dem Hinzufügen Ihres ersten Teams."}
          </p>
          {!searchTerm && categoryFilter === 'all' && (
            <Button className="mt-4 bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Erstes Team hinzufügen
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team: any) => (
            <Card key={team.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{team.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      {team.category && (
                        <Badge variant="secondary">
                          {team.category === 'youth' ? 'Jugend' :
                           team.category === 'senior' ? 'Senioren' : 'Amateur'}
                        </Badge>
                      )}
                      {team.ageGroup && (
                        <Badge variant="outline">{team.ageGroup}</Badge>
                      )}
                      {team.gender && (
                        <Badge variant="outline">
                          {team.gender === 'male' ? 'Herren' :
                           team.gender === 'female' ? 'Damen' : 'Mixed'}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Badge 
                    variant={team.status === 'active' ? 'default' : 'secondary'}
                  >
                    {team.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {team.description && (
                  <p className="text-sm text-gray-600 mb-4">{team.description}</p>
                )}
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    <span>0/{team.maxMembers || 20} Mitglieder</span>
                  </div>
                  <span className="text-xs">
                    {team.season && `Saison: ${team.season}`}
                  </span>
                </div>
                
                <div className="mt-4 flex items-center justify-end space-x-2">
                  <Button variant="outline" size="sm">
                    Bearbeiten
                  </Button>
                  <Button variant="outline" size="sm">
                    Mitglieder
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
