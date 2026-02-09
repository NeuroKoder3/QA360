import React, { useState } from 'react';
import { localDataStore } from '@/api/localDataStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

const CATEGORIES = [
  'Process Error',
  'System Bug',
  'Compliance Violation',
  'Customer Complaint',
  'Data Issue',
  'Training Gap',
  'Other'
];

const SEVERITIES = ['critical', 'high', 'medium', 'low'];
const STATUSES = ['open', 'in_progress', 'resolved', 'verified', 'closed'];

export default function Incidents() {
  const [showForm, setShowForm] = useState(false);
  const [editingIncident, setEditingIncident] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'medium',
    category: '',
    status: 'open',
    incident_date: new Date().toISOString().split('T')[0],
    resolution: '',
    root_cause: ''
  });

  const queryClient = useQueryClient();

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => localDataStore.entities.Incident.list('-created_date', 100)
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => localDataStore.entities.Team.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => localDataStore.entities.Incident.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      handleCloseForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => localDataStore.entities.Incident.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      handleCloseForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => localDataStore.entities.Incident.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['incidents'] })
  });

  const handleOpenForm = (incident = null) => {
    if (incident) {
      setFormData(incident);
      setEditingIncident(incident);
    } else {
      setFormData({
        title: '',
        description: '',
        severity: 'medium',
        category: '',
        status: 'open',
        incident_date: new Date().toISOString().split('T')[0],
        resolution: '',
        root_cause: ''
      });
      setEditingIncident(null);
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingIncident(null);
    setFormData({
      title: '',
      description: '',
      severity: 'medium',
      category: '',
      status: 'open',
      incident_date: new Date().toISOString().split('T')[0],
      resolution: '',
      root_cause: ''
    });
  };

  const handleSave = () => {
    const data = {
      ...formData,
      resolved_date: formData.status === 'resolved' || formData.status === 'verified' || formData.status === 'closed'
        ? formData.resolved_date || new Date().toISOString().split('T')[0]
        : null
    };
    
    if (editingIncident) {
      updateMutation.mutate({ id: editingIncident.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getSeverityBadge = (severity) => {
    const config = {
      critical: 'bg-rose-100 text-rose-700 border-rose-200',
      high: 'bg-orange-100 text-orange-700 border-orange-200',
      medium: 'bg-amber-100 text-amber-700 border-amber-200',
      low: 'bg-emerald-100 text-emerald-700 border-emerald-200'
    };
    return (
      <Badge className={`${config[severity]} border capitalize`}>
        {severity}
      </Badge>
    );
  };

  const getStatusBadge = (status) => {
    const config = {
      open: { class: 'bg-rose-100 text-rose-700', icon: AlertCircle },
      in_progress: { class: 'bg-blue-100 text-blue-700', icon: Clock },
      resolved: { class: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
      verified: { class: 'bg-indigo-100 text-indigo-700', icon: CheckCircle },
      closed: { class: 'bg-slate-100 text-slate-700', icon: CheckCircle }
    };
    const { class: className, icon: Icon } = config[status] || config.open;
    return (
      <Badge className={`${className} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status?.replace('_', ' ')}
      </Badge>
    );
  };

  const filteredIncidents = incidents.filter(i => {
    const matchesSearch = i.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || i.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  return (
    <div className="space-y-6 bg-black min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Incident Management</h1>
          <p className="text-slate-400">Track and resolve quality incidents</p>
        </div>
        <Button 
          onClick={() => handleOpenForm()}
          className="bg-rose-600 hover:bg-rose-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Report Incident
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-2 border-sky-400 bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-50">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {incidents.filter(i => i.status === 'open').length}
              </p>
              <p className="text-xs text-slate-500">Open</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-300">
                {incidents.filter(i => i.status === 'in_progress').length}
              </p>
              <p className="text-xs text-slate-400">In Progress</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-300">
                {incidents.filter(i => i.status === 'resolved' || i.status === 'verified').length}
              </p>
              <p className="text-xs text-slate-400">Resolved</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-300">
                {incidents.filter(i => i.severity === 'critical' && i.status !== 'closed').length}
              </p>
              <p className="text-xs text-slate-400">Critical</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm border-2 border-sky-400 bg-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search incidents..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                {SEVERITIES.map(s => (
                  <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {STATUSES.map(s => (
                  <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Incidents List */}
      <div className="grid gap-4">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
              <div className="h-3 bg-slate-100 rounded w-full mb-2"></div>
              <div className="h-3 bg-slate-100 rounded w-2/3"></div>
            </Card>
          ))
        ) : filteredIncidents.length === 0 ? (
          <Card className="p-12 text-center bg-slate-800">
            <AlertTriangle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-400">No incidents found</p>
          </Card>
        ) : (
          filteredIncidents.map(incident => (
            <Card key={incident.id} className="hover:shadow-md transition-shadow border-2 border-sky-400 bg-slate-800">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-white">{incident.title}</h3>
                      {getSeverityBadge(incident.severity)}
                      {getStatusBadge(incident.status)}
                    </div>
                    <p className="text-sm text-slate-300 mb-3 line-clamp-2">{incident.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="capitalize">{incident.category?.replace(/_/g, ' ')}</span>
                      <span>•</span>
                      <span>{incident.incident_date ? format(new Date(incident.incident_date), 'MMM d, yyyy') : 'N/A'}</span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpenForm(incident)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deleteMutation.mutate(incident.id)}
                        className="text-rose-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingIncident ? 'Edit Incident' : 'Report New Incident'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="Brief incident title"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Severity *</Label>
                <Select 
                  value={formData.severity} 
                  onValueChange={v => setFormData({ ...formData, severity: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEVERITIES.map(s => (
                      <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={v => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                    {STATUSES.map(s => (
                      <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Incident Date</Label>
                <Input
                  type="date"
                  value={formData.incident_date}
                  onChange={e => setFormData({ ...formData, incident_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed description of the incident..."
                rows={4}
              />
            </div>

            {(formData.status === 'resolved' || formData.status === 'verified' || formData.status === 'closed') && (
              <>
                <div className="space-y-2">
                  <Label>Root Cause</Label>
                  <Textarea
                    value={formData.root_cause}
                    onChange={e => setFormData({ ...formData, root_cause: e.target.value })}
                    placeholder="Root cause analysis..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Resolution</Label>
                  <Textarea
                    value={formData.resolution}
                    onChange={e => setFormData({ ...formData, resolution: e.target.value })}
                    placeholder="How was this resolved..."
                    rows={2}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseForm}>Cancel</Button>
            <Button 
              onClick={handleSave}
              className="bg-sky-500 hover:bg-sky-600 text-white"
            >
              {editingIncident ? 'Update' : 'Create'} Incident
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}