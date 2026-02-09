import React, { useState } from 'react';
import { localDataStore } from '@/api/localDataStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { FileText, Plus, Trash2, Download, Star } from 'lucide-react';

const PREDEFINED_TEMPLATES = [
  {
    name: 'Monthly Audit Compliance Report',
    description: 'Comprehensive audit compliance metrics and trends',
    category: 'audit_compliance',
    config: { metrics: ['compliance_score', 'overdue_audits', 'completed_audits'], dateRange: 'last_month' }
  },
  {
    name: 'Incident Trend Analysis',
    description: 'Analyze incident patterns and severity trends',
    category: 'incident_trends',
    config: { metrics: ['incident_count', 'severity_distribution', 'mttr'], dateRange: 'last_quarter' }
  },
  {
    name: 'Team Performance Summary',
    description: 'Team-wise QA scores and evaluation metrics',
    category: 'team_performance',
    config: { metrics: ['avg_qa_score', 'evaluation_count', 'improvement_rate'], groupBy: 'team' }
  }
];

export default function ReportTemplates({ onUseTemplate }) {
  const [showDialog, setShowDialog] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'custom',
    config: {},
    is_public: false
  });

  const queryClient = useQueryClient();

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await localDataStore.auth.me();
        setUser(userData);
      } catch (e) {
        console.log('User not loaded');
      }
    };
    loadUser();
  }, []);

  const { data: templates = [] } = useQuery({
    queryKey: ['report-templates'],
    queryFn: () => localDataStore.entities.ReportTemplate.list('-created_date', 100)
  });

  const createMutation = useMutation({
    mutationFn: (data) => localDataStore.entities.ReportTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
      setShowDialog(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => localDataStore.entities.ReportTemplate.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['report-templates'] })
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'custom',
      config: {},
      is_public: false
    });
  };

  const handleSave = () => {
    createMutation.mutate({ ...formData, created_by_email: user?.email });
  };

  const getCategoryColor = (category) => {
    const colors = {
      audit_compliance: 'bg-emerald-100 text-emerald-700',
      incident_trends: 'bg-rose-100 text-rose-700',
      team_performance: 'bg-sky-100 text-sky-700',
      quality_metrics: 'bg-violet-100 text-violet-700',
      custom: 'bg-amber-100 text-amber-700'
    };
    return colors[category] || colors.custom;
  };

  const allTemplates = [
    ...PREDEFINED_TEMPLATES.map(t => ({ ...t, is_predefined: true })),
    ...templates
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-300">Report Templates</h3>
        <Button onClick={() => setShowDialog(true)} variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allTemplates.map((template, index) => (
          <Card key={template.id || index} className="border-2 border-sky-400 bg-slate-800">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {template.is_predefined && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
                    <CardTitle className="text-sm text-slate-300">{template.name}</CardTitle>
                  </div>
                  <Badge className={getCategoryColor(template.category)}>
                    {template.category.replace('_', ' ')}
                  </Badge>
                </div>
                {!template.is_predefined && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(template.id)}
                  >
                    <Trash2 className="w-4 h-4 text-rose-500" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-400 mb-3 line-clamp-2">
                {template.description}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => onUseTemplate && onUseTemplate(template)}
              >
                <Download className="w-4 h-4 mr-2" />
                Use Template
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Report Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My Custom Report"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this report covers..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="audit_compliance">Audit Compliance</SelectItem>
                  <SelectItem value="incident_trends">Incident Trends</SelectItem>
                  <SelectItem value="team_performance">Team Performance</SelectItem>
                  <SelectItem value="quality_metrics">Quality Metrics</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-sky-500 hover:bg-sky-600">
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}