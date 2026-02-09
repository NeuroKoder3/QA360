import React, { useState } from 'react';
import { localDataStore } from '@/api/localDataStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
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
  FileSearch,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  Upload,
  FileText,
  X,
  Download,
  User,
  History,
  UserPlus,
  Sparkles
} from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import AuditAssignment from '@/components/audits/AuditAssignment';
import AuditProgressTracker from '@/components/audits/AuditProgressTracker';
import AuditAIAnalysis from '@/components/audits/AuditAIAnalysis';
import AuditReportGenerator from '@/components/audits/AuditReportGenerator';

const AUDIT_TYPES = ['Internal', 'External', 'Compliance', 'Process', 'Security'];
const PRIORITIES = ['high', 'medium', 'low'];

export default function Audits() {
  const [showForm, setShowForm] = useState(false);
  const [editingAudit, setEditingAudit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assigningAudit, setAssigningAudit] = useState(null);
  const [viewingAudit, setViewingAudit] = useState(null);
  const [analyzingAudit, setAnalyzingAudit] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    audit_type: '',
    team_id: '',
    assigned_to: '',
    scheduled_date: new Date().toISOString().split('T')[0],
    due_date: '',
    priority: 'medium',
    status: 'scheduled',
    checklist: [],
    findings: '',
    recommendations: '',
    attachments: [],
    status_history: []
  });

  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showStatusHistory, setShowStatusHistory] = useState(false);
  const [statusNote, setStatusNote] = useState('');

  const queryClient = useQueryClient();

  const { data: audits = [], isLoading } = useQuery({
    queryKey: ['audits'],
    queryFn: () => localDataStore.entities.Audit.list('-created_date', 100)
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => localDataStore.entities.Team.list()
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => localDataStore.entities.User.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => localDataStore.entities.Audit.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      handleCloseForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => localDataStore.entities.Audit.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      handleCloseForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => localDataStore.entities.Audit.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['audits'] })
  });

  const handleOpenForm = (audit = null) => {
    if (audit) {
      setFormData({
        ...audit,
        attachments: audit.attachments || [],
        status_history: audit.status_history || []
      });
      setEditingAudit(audit);
    } else {
      setFormData({
        title: '',
        description: '',
        audit_type: '',
        team_id: '',
        assigned_to: '',
        scheduled_date: new Date().toISOString().split('T')[0],
        due_date: '',
        priority: 'medium',
        status: 'scheduled',
        checklist: [],
        findings: '',
        recommendations: '',
        attachments: [],
        status_history: []
      });
      setEditingAudit(null);
    }
    setShowForm(true);
    setShowStatusHistory(false);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingAudit(null);
  };

  const handleAddChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setFormData({
        ...formData,
        checklist: [...(formData.checklist || []), { item: newChecklistItem, completed: false, notes: '', score: 0 }]
      });
      setNewChecklistItem('');
    }
  };

  const handleRemoveChecklistItem = (index) => {
    setFormData({
      ...formData,
      checklist: formData.checklist.filter((_, i) => i !== index)
    });
  };

  const handleSave = async () => {
    const user = await localDataStore.auth.me();
    const completedItems = formData.checklist?.filter(c => c.completed).length || 0;
    const totalItems = formData.checklist?.length || 1;
    const compliance_score = Math.round((completedItems / totalItems) * 100);
    
    let status_history = formData.status_history || [];
    
    // Track status changes
    if (editingAudit && editingAudit.status !== formData.status) {
      status_history = [
        ...status_history,
        {
          status: formData.status,
          changed_by: user.email,
          changed_date: new Date().toISOString(),
          notes: statusNote
        }
      ];
      setStatusNote('');
    }
    
    const data = {
      ...formData,
      compliance_score,
      status_history,
      completed_date: formData.status === 'completed' ? new Date().toISOString().split('T')[0] : null
    };
    
    if (editingAudit) {
      updateMutation.mutate({ id: editingAudit.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingFile(true);
    try {
      const user = await localDataStore.auth.me();
      const { file_url } = await localDataStore.integrations.Core.UploadFile({ file });
      
      const newAttachment = {
        name: file.name,
        url: file_url,
        uploaded_date: new Date().toISOString(),
        uploaded_by: user.email
      };
      
      setFormData({
        ...formData,
        attachments: [...(formData.attachments || []), newAttachment]
      });
    } catch (error) {
      console.error('Failed to upload file:', error);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleRemoveAttachment = (index) => {
    setFormData({
      ...formData,
      attachments: formData.attachments.filter((_, i) => i !== index)
    });
  };

  const getStatusBadge = (audit) => {
    const isOverdue = audit.due_date && isPast(new Date(audit.due_date)) && 
      audit.status !== 'completed' && audit.status !== 'cancelled';
    
    if (isOverdue) {
      return <Badge className="bg-rose-100 text-rose-700">Overdue</Badge>;
    }
    
    const config = {
      scheduled: { class: 'bg-slate-100 text-slate-700', icon: Calendar },
      in_progress: { class: 'bg-blue-100 text-blue-700', icon: Clock },
      completed: { class: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
      cancelled: { class: 'bg-slate-100 text-slate-500', icon: Clock }
    };
    const { class: className, icon: Icon } = config[audit.status] || config.scheduled;
    return (
      <Badge className={`${className} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {audit.status?.replace('_', ' ')}
      </Badge>
    );
  };

  const getPriorityBadge = (priority) => {
    const config = {
      high: 'bg-rose-100 text-rose-700',
      medium: 'bg-amber-100 text-amber-700',
      low: 'bg-emerald-100 text-emerald-700'
    };
    return <Badge className={`${config[priority]} capitalize`}>{priority}</Badge>;
  };

  const getTeamName = (teamId) => {
    return teams.find(t => t.id === teamId)?.name || 'N/A';
  };

  const filteredAudits = audits.filter(a => {
    const matchesSearch = a.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || a.audit_type === typeFilter;
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    scheduled: audits.filter(a => a.status === 'scheduled').length,
    inProgress: audits.filter(a => a.status === 'in_progress').length,
    completed: audits.filter(a => a.status === 'completed').length,
    overdue: audits.filter(a => 
      a.due_date && isPast(new Date(a.due_date)) && 
      a.status !== 'completed' && a.status !== 'cancelled'
    ).length
  };

  return (
    <div className="space-y-6 bg-black min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Management</h1>
          <p className="text-slate-400">Schedule and track compliance audits</p>
        </div>
        <Button 
          onClick={() => handleOpenForm()}
          className="bg-sky-500 hover:bg-sky-600 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Schedule Audit
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-2 border-sky-400 bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100">
              <Calendar className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.scheduled}</p>
              <p className="text-xs text-slate-500">Scheduled</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.inProgress}</p>
              <p className="text-xs text-slate-500">In Progress</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.completed}</p>
              <p className="text-xs text-slate-500">Completed</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-50">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.overdue}</p>
              <p className="text-xs text-slate-500">Overdue</p>
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
                placeholder="Search audits..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {AUDIT_TYPES.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audits List */}
      <div className="grid gap-4">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
              <div className="h-3 bg-slate-100 rounded w-full mb-2"></div>
            </Card>
          ))
        ) : filteredAudits.length === 0 ? (
          <Card className="p-12 text-center">
            <FileSearch className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No audits found</p>
          </Card>
        ) : (
          filteredAudits.map(audit => (
            <Card key={audit.id} className="hover:shadow-md transition-shadow border-2 border-sky-400 bg-slate-800">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-semibold text-white">{audit.title}</h3>
                      {getStatusBadge(audit)}
                      {getPriorityBadge(audit.priority)}
                      <Badge variant="outline">{audit.audit_type}</Badge>
                    </div>
                    <p className="text-sm text-slate-300 mb-3">{audit.description}</p>
                    
                    {audit.checklist?.length > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                          <span>Progress</span>
                          <span>{audit.checklist.filter(c => c.completed).length}/{audit.checklist.length}</span>
                        </div>
                        <Progress 
                          value={(audit.checklist.filter(c => c.completed).length / audit.checklist.length) * 100} 
                          className="h-2"
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {audit.assigned_to || 'Unassigned'}
                      </span>
                      <span>•</span>
                      <span>Team: {getTeamName(audit.team_id)}</span>
                      <span>•</span>
                      <span>Due: {audit.due_date ? format(new Date(audit.due_date), 'MMM d, yyyy') : 'N/A'}</span>
                      {audit.compliance_score && (
                        <>
                          <span>•</span>
                          <span>Compliance: {audit.compliance_score}%</span>
                        </>
                      )}
                      {audit.attachments?.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {audit.attachments.length} file{audit.attachments.length !== 1 ? 's' : ''}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAssigningAudit(audit)}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Assign
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setViewingAudit(audit)}
                    >
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAnalyzingAudit(audit)}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      AI Analysis
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setGeneratingReport(audit)}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Generate Report
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenForm(audit)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => deleteMutation.mutate(audit.id)}
                          className="text-rose-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Assignment Dialog */}
      {assigningAudit && (
        <AuditAssignment
          audit={assigningAudit}
          onClose={() => setAssigningAudit(null)}
        />
      )}

      {/* AI Analysis Dialog */}
      {analyzingAudit && (
        <Dialog open={true} onOpenChange={() => setAnalyzingAudit(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>AI Analysis - {analyzingAudit.title}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <AuditAIAnalysis audit={analyzingAudit} />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Report Generator Dialog */}
      {generatingReport && (
        <Dialog open={true} onOpenChange={() => setGeneratingReport(null)}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>AI Audit Report - {generatingReport.title}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <AuditReportGenerator
                audit={generatingReport}
                onSave={(report) => {
                  updateMutation.mutate({
                    id: generatingReport.id,
                    data: {
                      ...generatingReport,
                      findings: report.findings_summary,
                      recommendations: report.recommendations,
                      ai_report: report
                    }
                  });
                  setGeneratingReport(null);
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* View Details Dialog */}
      {viewingAudit && (
        <Dialog open={true} onOpenChange={() => setViewingAudit(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{viewingAudit.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <AuditProgressTracker audit={viewingAudit} />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-400">Description</Label>
                  <p className="font-medium">{viewingAudit.description}</p>
                </div>
                <div>
                  <Label className="text-slate-400">Findings</Label>
                  <p className="font-medium">{viewingAudit.findings || 'N/A'}</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAudit ? 'Edit Audit' : 'Schedule New Audit'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="Audit title"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Audit Type *</Label>
                <Select 
                  value={formData.audit_type} 
                  onValueChange={v => setFormData({ ...formData, audit_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {AUDIT_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Team</Label>
                <Select 
                  value={formData.team_id} 
                  onValueChange={v => setFormData({ ...formData, team_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Assigned To</Label>
              <Select 
                value={formData.assigned_to} 
                onValueChange={v => setFormData({ ...formData, assigned_to: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select auditor" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.email} value={u.email}>
                      {u.full_name} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Scheduled Date</Label>
                <Input
                  type="date"
                  value={formData.scheduled_date}
                  onChange={e => setFormData({ ...formData, scheduled_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date *</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={v => setFormData({ ...formData, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map(p => (
                      <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>Status</span>
                {editingAudit && formData.status_history?.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowStatusHistory(!showStatusHistory)}
                    className="h-6 px-2 text-xs"
                  >
                    <History className="w-3 h-3 mr-1" />
                    View History
                  </Button>
                )}
              </Label>
              <Select 
                value={formData.status} 
                onValueChange={v => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              {editingAudit && editingAudit.status !== formData.status && (
                <div className="space-y-2 pt-2">
                  <Label className="text-xs">Status Change Note (Optional)</Label>
                  <Textarea
                    value={statusNote}
                    onChange={e => setStatusNote(e.target.value)}
                    placeholder="Add a note about this status change..."
                    rows={2}
                    className="text-xs"
                  />
                </div>
              )}
            </div>

            {showStatusHistory && formData.status_history?.length > 0 && (
              <Card className="p-4 bg-slate-50">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Status History
                </h4>
                <div className="space-y-2">
                  {formData.status_history.map((entry, index) => (
                    <div key={index} className="text-xs border-l-2 border-sky-400 pl-3 py-1">
                      <div className="font-medium text-slate-700">
                        Changed to: {entry.status.replace('_', ' ')}
                      </div>
                      <div className="text-slate-500">
                        By {entry.changed_by} on {format(new Date(entry.changed_date), 'MMM d, yyyy HH:mm')}
                      </div>
                      {entry.notes && <div className="text-slate-600 mt-1">{entry.notes}</div>}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Audit scope and objectives..."
                rows={3}
              />
            </div>

            {/* Checklist */}
            <div className="space-y-3">
              <Label>Checklist Items</Label>
              <div className="flex gap-2">
                <Input
                  value={newChecklistItem}
                  onChange={e => setNewChecklistItem(e.target.value)}
                  placeholder="Add checklist item..."
                  onKeyDown={e => e.key === 'Enter' && handleAddChecklistItem()}
                />
                <Button type="button" onClick={handleAddChecklistItem} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {formData.checklist?.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={(checked) => {
                        const newChecklist = [...formData.checklist];
                        newChecklist[index].completed = checked;
                        setFormData({ ...formData, checklist: newChecklist });
                      }}
                    />
                    <span className={`flex-1 text-sm ${item.completed ? 'line-through text-slate-400' : ''}`}>
                      {item.item}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleRemoveChecklistItem(index)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Attachments */}
            <div className="space-y-3">
              <Label>Attachments & Evidence</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                  className="flex-1"
                  id="file-upload"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  disabled={uploadingFile}
                  onClick={() => document.getElementById('file-upload').click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadingFile ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
              {formData.attachments?.length > 0 && (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {formData.attachments.map((att, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2 flex-1">
                        <FileText className="w-4 h-4 text-sky-600" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{att.name}</p>
                          <p className="text-xs text-slate-500">
                            {att.uploaded_by} • {format(new Date(att.uploaded_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(att.url, '_blank')}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAttachment(index)}
                          className="text-rose-600 hover:text-rose-700"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {formData.status === 'completed' && (
              <>
                <div className="space-y-2">
                  <Label>Findings</Label>
                  <Textarea
                    value={formData.findings}
                    onChange={e => setFormData({ ...formData, findings: e.target.value })}
                    placeholder="Key audit findings..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Recommendations</Label>
                  <Textarea
                    value={formData.recommendations}
                    onChange={e => setFormData({ ...formData, recommendations: e.target.value })}
                    placeholder="Recommendations for improvement..."
                    rows={3}
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
              {editingAudit ? 'Update' : 'Schedule'} Audit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}