import React, { useState } from 'react';
import { localDataStore } from '@/api/localDataStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Eye,
  CheckCircle,
  Clock,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import EvaluationForm from '../components/evaluations/EvaluationForm';
import AIInsights from '../components/evaluations/AIInsights';

export default function Evaluations() {
  const [showForm, setShowForm] = useState(false);
  const [editingEval, setEditingEval] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAgent, setSelectedAgent] = useState(null);
  
  const queryClient = useQueryClient();

  const { data: evaluations = [], isLoading } = useQuery({
    queryKey: ['evaluations'],
    queryFn: () => localDataStore.entities.QAEvaluation.list('-created_date', 100)
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => localDataStore.entities.Team.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => localDataStore.entities.QAEvaluation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      setShowForm(false);
      setEditingEval(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => localDataStore.entities.QAEvaluation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      setShowForm(false);
      setEditingEval(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => localDataStore.entities.QAEvaluation.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['evaluations'] })
  });

  const handleSave = (data) => {
    if (editingEval) {
      updateMutation.mutate({ id: editingEval.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getTeamName = (teamId) => {
    const team = teams.find(t => t.id === teamId);
    return team?.name || 'N/A';
  };

  const getStatusBadge = (status) => {
    const config = {
      draft: { class: 'bg-slate-100 text-slate-700', icon: Clock },
      submitted: { class: 'bg-blue-100 text-blue-700', icon: Clock },
      approved: { class: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
      disputed: { class: 'bg-rose-100 text-rose-700', icon: Clock }
    };
    const { class: className, icon: Icon } = config[status] || config.draft;
    return (
      <Badge className={`${className} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </Badge>
    );
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-emerald-600 bg-emerald-50';
    if (score >= 75) return 'text-amber-600 bg-amber-50';
    return 'text-rose-600 bg-rose-50';
  };

  const filteredEvaluations = evaluations.filter(e => {
    const matchesSearch = e.agent_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.agent_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (showForm) {
    return (
      <EvaluationForm
        evaluation={editingEval}
        onSave={handleSave}
        onCancel={() => {
          setShowForm(false);
          setEditingEval(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6 bg-black min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">QA Evaluations</h1>
          <p className="text-slate-400">Manage and track quality evaluations</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-sky-500 hover:bg-sky-600 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Evaluation
        </Button>
      </div>

      {/* Filters */}
      <Card className="shadow-sm border-2 border-sky-400 bg-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by agent name or email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="disputed">Disputed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-sm overflow-hidden border-2 border-sky-400 bg-slate-100">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Agent</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6} className="h-16">
                    <div className="animate-pulse bg-slate-100 h-4 rounded w-full"></div>
                  </TableCell>
                </TableRow>
              ))
            ) : filteredEvaluations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                  No evaluations found. Create your first evaluation to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredEvaluations.map(evaluation => (
                <TableRow key={evaluation.id} className="hover:bg-slate-50">
                  <TableCell>
                    <div>
                      <p className="font-medium text-slate-300">{evaluation.agent_name}</p>
                      <p className="text-sm text-slate-400">{evaluation.agent_email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-300">{getTeamName(evaluation.team_id)}</TableCell>
                  <TableCell>
                    <span className={`font-semibold px-2 py-1 rounded ${getScoreColor(evaluation.final_score)}`}>
                      {evaluation.final_score?.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell>{getStatusBadge(evaluation.status)}</TableCell>
                  <TableCell className="text-slate-400">
                    {evaluation.evaluation_date ? format(new Date(evaluation.evaluation_date), 'MMM d, yyyy') : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedAgent(evaluation.agent_email)}>
                          <Eye className="w-4 h-4 mr-2" />
                          AI Insights
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setEditingEval(evaluation);
                          setShowForm(true);
                        }}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => deleteMutation.mutate(evaluation.id)}
                          className="text-rose-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* AI Insights Panel */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-300">AI Insights - {selectedAgent}</h3>
              <Button variant="ghost" size="icon" onClick={() => setSelectedAgent(null)}>
                <Eye className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4">
              <AIInsights agentEmail={selectedAgent} evaluations={evaluations} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}