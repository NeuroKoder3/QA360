import React, { useState } from 'react';
import { localDataStore } from '@/api/localDataStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2,
  Users,
  MapPin,
  Building
} from 'lucide-react';

const DEPARTMENTS = ['Operations', 'Customer Service', 'Sales', 'Technical Support', 'Finance', 'HR'];

export default function Teams() {
  const [showForm, setShowForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    manager_email: '',
    location: '',
    status: 'active'
  });

  const queryClient = useQueryClient();

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: () => localDataStore.entities.Team.list('-created_date', 100)
  });

  const { data: evaluations = [] } = useQuery({
    queryKey: ['evaluations'],
    queryFn: () => localDataStore.entities.QAEvaluation.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => localDataStore.entities.Team.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      handleCloseForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => localDataStore.entities.Team.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      handleCloseForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => localDataStore.entities.Team.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams'] })
  });

  const handleOpenForm = (team = null) => {
    if (team) {
      setFormData(team);
      setEditingTeam(team);
    } else {
      setFormData({
        name: '',
        department: '',
        manager_email: '',
        location: '',
        status: 'active'
      });
      setEditingTeam(null);
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTeam(null);
  };

  const handleSave = () => {
    if (editingTeam) {
      updateMutation.mutate({ id: editingTeam.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getTeamStats = (teamId) => {
    const teamEvals = evaluations.filter(e => e.team_id === teamId);
    const avgScore = teamEvals.length > 0
      ? teamEvals.reduce((sum, e) => sum + (e.final_score || 0), 0) / teamEvals.length
      : null;
    return {
      evaluations: teamEvals.length,
      avgScore: avgScore?.toFixed(1)
    };
  };

  const getDepartmentColor = (dept) => {
    const colors = {
      Operations: 'bg-blue-100 text-blue-700',
      'Customer Service': 'bg-emerald-100 text-emerald-700',
      Sales: 'bg-violet-100 text-violet-700',
      'Technical Support': 'bg-amber-100 text-amber-700',
      Finance: 'bg-rose-100 text-rose-700',
      HR: 'bg-indigo-100 text-indigo-700'
    };
    return colors[dept] || 'bg-slate-100 text-slate-700';
  };

  const filteredTeams = teams.filter(t => {
    const matchesSearch = t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = departmentFilter === 'all' || t.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  });

  return (
    <div className="space-y-6 bg-black min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Teams</h1>
          <p className="text-slate-400">Manage teams and departments</p>
        </div>
        <Button 
          onClick={() => handleOpenForm()}
          className="bg-sky-500 hover:bg-sky-600 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Team
        </Button>
      </div>

      {/* Filters */}
      <Card className="shadow-sm border-2 border-sky-400 bg-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search teams..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {DEPARTMENTS.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Teams Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-2/3 mb-4"></div>
              <div className="h-3 bg-slate-100 rounded w-full mb-2"></div>
            </Card>
          ))}
        </div>
      ) : filteredTeams.length === 0 ? (
        <Card className="p-12 text-center bg-slate-800">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-400 mb-4">No teams found</p>
          <Button onClick={() => handleOpenForm()} className="bg-sky-500 hover:bg-sky-600 text-white">Create First Team</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map(team => {
            const stats = getTeamStats(team.id);
            return (
              <Card key={team.id} className="hover:shadow-md transition-shadow group border-2 border-sky-400 bg-slate-800">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-sky-50">
                        <Users className="w-5 h-5 text-sky-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-slate-300">{team.name}</CardTitle>
                        <Badge className={`${getDepartmentColor(team.department)} mt-1`}>
                          {team.department}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenForm(team)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => deleteMutation.mutate(team.id)}
                          className="text-rose-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {team.location && (
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <MapPin className="w-4 h-4" />
                        {team.location}
                      </div>
                    )}
                    {team.manager_email && (
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Building className="w-4 h-4" />
                        {team.manager_email}
                      </div>
                    )}
                    <div className="pt-3 border-t border-slate-700 flex items-center justify-between">
                      <div className="text-center">
                        <p className="text-lg font-bold text-slate-300">{stats.evaluations}</p>
                        <p className="text-xs text-slate-400">Evaluations</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-lg font-bold ${
                          stats.avgScore >= 90 ? 'text-emerald-400' : 
                          stats.avgScore >= 75 ? 'text-amber-400' : 
                          stats.avgScore ? 'text-rose-400' : 'text-slate-400'
                        }`}>
                          {stats.avgScore || '-'}%
                        </p>
                        <p className="text-xs text-slate-400">Avg Score</p>
                      </div>
                      <Badge variant={team.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                        {team.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTeam ? 'Edit Team' : 'Create New Team'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Team Name *</Label>
              <Input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter team name"
              />
            </div>

            <div className="space-y-2">
              <Label>Department *</Label>
              <Select 
                value={formData.department} 
                onValueChange={v => setFormData({ ...formData, department: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Manager Email</Label>
              <Input
                type="email"
                value={formData.manager_email}
                onChange={e => setFormData({ ...formData, manager_email: e.target.value })}
                placeholder="manager@company.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                placeholder="Office location"
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={v => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseForm}>Cancel</Button>
            <Button 
              onClick={handleSave}
              className="bg-sky-500 hover:bg-sky-600 text-white"
              disabled={!formData.name || !formData.department}
            >
              {editingTeam ? 'Update' : 'Create'} Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}