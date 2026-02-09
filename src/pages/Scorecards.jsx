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
import { Slider } from '@/components/ui/slider';
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
  MoreVertical, 
  Edit, 
  Trash2,
  Target,
  Copy,
  Percent
} from 'lucide-react';

const DEPARTMENTS = ['Operations', 'Customer Service', 'Sales', 'Technical Support', 'Finance', 'HR', 'All'];

export default function Scorecards() {
  const [showForm, setShowForm] = useState(false);
  const [editingScorecard, setEditingScorecard] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    department: 'All',
    status: 'active',
    metrics: []
  });

  const [newMetric, setNewMetric] = useState({
    name: '',
    weight: 0.25,
    max_score: 100,
    description: ''
  });

  const queryClient = useQueryClient();

  const { data: scorecards = [], isLoading } = useQuery({
    queryKey: ['scorecards'],
    queryFn: () => localDataStore.entities.QAScorecard.list('-created_date', 100)
  });

  const createMutation = useMutation({
    mutationFn: (data) => localDataStore.entities.QAScorecard.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scorecards'] });
      handleCloseForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => localDataStore.entities.QAScorecard.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scorecards'] });
      handleCloseForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => localDataStore.entities.QAScorecard.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scorecards'] })
  });

  const handleOpenForm = (scorecard = null) => {
    if (scorecard) {
      setFormData(scorecard);
      setEditingScorecard(scorecard);
    } else {
      setFormData({
        name: '',
        description: '',
        department: 'All',
        status: 'active',
        metrics: []
      });
      setEditingScorecard(null);
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingScorecard(null);
    setNewMetric({ name: '', weight: 0.25, max_score: 100, description: '' });
  };

  const handleAddMetric = () => {
    if (newMetric.name.trim()) {
      setFormData({
        ...formData,
        metrics: [...(formData.metrics || []), { ...newMetric }]
      });
      setNewMetric({ name: '', weight: 0.25, max_score: 100, description: '' });
    }
  };

  const handleRemoveMetric = (index) => {
    setFormData({
      ...formData,
      metrics: formData.metrics.filter((_, i) => i !== index)
    });
  };

  const handleUpdateMetric = (index, field, value) => {
    const newMetrics = [...formData.metrics];
    newMetrics[index] = { ...newMetrics[index], [field]: value };
    setFormData({ ...formData, metrics: newMetrics });
  };

  const handleSave = () => {
    if (editingScorecard) {
      updateMutation.mutate({ id: editingScorecard.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDuplicate = (scorecard) => {
    setFormData({
      ...scorecard,
      name: `${scorecard.name} (Copy)`,
      status: 'draft'
    });
    setEditingScorecard(null);
    setShowForm(true);
  };

  const getTotalWeight = (metrics) => {
    return (metrics || []).reduce((sum, m) => sum + (m.weight || 0), 0);
  };

  const getStatusBadge = (status) => {
    const config = {
      active: 'bg-emerald-100 text-emerald-700',
      draft: 'bg-slate-100 text-slate-700',
      archived: 'bg-amber-100 text-amber-700'
    };
    return <Badge className={`${config[status]} capitalize`}>{status}</Badge>;
  };

  return (
    <div className="space-y-6 bg-black min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">QA Scorecards</h1>
          <p className="text-slate-400">Create and manage evaluation templates</p>
        </div>
        <Button 
          onClick={() => handleOpenForm()}
          className="bg-sky-500 hover:bg-sky-600 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Scorecard
        </Button>
      </div>

      {/* Scorecards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-2/3 mb-4"></div>
              <div className="h-3 bg-slate-100 rounded w-full mb-2"></div>
              <div className="h-3 bg-slate-100 rounded w-1/2"></div>
            </Card>
          ))}
        </div>
      ) : scorecards.length === 0 ? (
        <Card className="p-12 text-center bg-slate-800">
          <Target className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-400 mb-4">No scorecards created yet</p>
          <Button onClick={() => handleOpenForm()} className="bg-sky-500 hover:bg-sky-600 text-white">Create First Scorecard</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scorecards.map(scorecard => (
            <Card key={scorecard.id} className="hover:shadow-md transition-shadow group border-2 border-sky-400 bg-slate-800">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg text-slate-300">{scorecard.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(scorecard.status)}
                      <Badge variant="outline" className="text-xs">{scorecard.department}</Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpenForm(scorecard)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(scorecard)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deleteMutation.mutate(scorecard.id)}
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
                <p className="text-sm text-slate-300 mb-4 line-clamp-2">
                  {scorecard.description || 'No description'}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{scorecard.metrics?.length || 0} metrics</span>
                    <span>Total weight: {(getTotalWeight(scorecard.metrics) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {scorecard.metrics?.slice(0, 4).map((m, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {m.name}
                      </Badge>
                    ))}
                    {(scorecard.metrics?.length || 0) > 4 && (
                      <Badge variant="secondary" className="text-xs">
                        +{scorecard.metrics.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingScorecard ? 'Edit Scorecard' : 'Create New Scorecard'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Scorecard name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Department</Label>
                <Select 
                  value={formData.department} 
                  onValueChange={v => setFormData({ ...formData, department: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the scorecard purpose..."
                rows={2}
              />
            </div>

            {/* Metrics Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Scoring Metrics</Label>
                <div className="flex items-center gap-2 text-sm">
                  <Percent className="w-4 h-4 text-slate-400" />
                  <span className={getTotalWeight(formData.metrics) === 1 ? 'text-emerald-600' : 'text-amber-600'}>
                    {(getTotalWeight(formData.metrics) * 100).toFixed(0)}% / 100%
                  </span>
                </div>
              </div>
              
              {/* Add new metric */}
              <div className="p-4 bg-slate-50 rounded-xl space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    value={newMetric.name}
                    onChange={e => setNewMetric({ ...newMetric, name: e.target.value })}
                    placeholder="Metric name (e.g., Accuracy)"
                  />
                  <Input
                    type="number"
                    value={newMetric.max_score}
                    onChange={e => setNewMetric({ ...newMetric, max_score: parseInt(e.target.value) || 100 })}
                    placeholder="Max score"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Weight</span>
                    <span className="font-medium">{(newMetric.weight * 100).toFixed(0)}%</span>
                  </div>
                  <Slider
                    value={[newMetric.weight * 100]}
                    onValueChange={([v]) => setNewMetric({ ...newMetric, weight: v / 100 })}
                    max={100}
                    step={5}
                  />
                </div>
                <Button type="button" onClick={handleAddMetric} variant="outline" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Metric
                </Button>
              </div>

              {/* Existing metrics */}
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {formData.metrics?.map((metric, index) => (
                  <div key={index} className="p-4 border rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <Input
                        value={metric.name}
                        onChange={e => handleUpdateMetric(index, 'name', e.target.value)}
                        className="font-medium border-none p-0 h-auto focus-visible:ring-0"
                      />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleRemoveMetric(index)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs">Max Score</Label>
                        <Input
                          type="number"
                          value={metric.max_score}
                          onChange={e => handleUpdateMetric(index, 'max_score', parseInt(e.target.value) || 100)}
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Weight</Label>
                          <span className="text-xs font-medium">{(metric.weight * 100).toFixed(0)}%</span>
                        </div>
                        <Slider
                          value={[metric.weight * 100]}
                          onValueChange={([v]) => handleUpdateMetric(index, 'weight', v / 100)}
                          max={100}
                          step={5}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseForm}>Cancel</Button>
            <Button 
              onClick={handleSave}
              className="bg-sky-500 hover:bg-sky-600 text-white"
              disabled={!formData.name || (formData.metrics?.length || 0) === 0}
            >
              {editingScorecard ? 'Update' : 'Create'} Scorecard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}