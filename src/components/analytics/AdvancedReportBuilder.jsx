import React, { useState } from 'react';
import { localDataStore } from '@/api/localDataStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Save, FileText, Download } from 'lucide-react';
import { exportToCSV, exportToPDF, prepareReportData } from './ReportExporter';

export default function AdvancedReportBuilder({ evaluations, incidents, audits, teams }) {
  const [config, setConfig] = useState({
    name: '',
    description: '',
    dateRange: '30days',
    customStartDate: '',
    customEndDate: '',
    metrics: [],
    filters: {
      teams: [],
      status: 'all',
      severity: 'all'
    },
    chartTypes: [],
    groupBy: 'none'
  });
  const [saving, setSaving] = useState(false);

  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (data) => localDataStore.entities.ReportTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
      alert('Report template saved successfully!');
      setConfig({
        name: '',
        description: '',
        dateRange: '30days',
        customStartDate: '',
        customEndDate: '',
        metrics: [],
        filters: { teams: [], status: 'all', severity: 'all' },
        chartTypes: [],
        groupBy: 'none'
      });
    }
  });

  const availableMetrics = [
    { id: 'qa_scores', label: 'QA Scores', category: 'evaluations' },
    { id: 'avg_score', label: 'Average Score', category: 'evaluations' },
    { id: 'score_distribution', label: 'Score Distribution', category: 'evaluations' },
    { id: 'incidents', label: 'Incidents', category: 'incidents' },
    { id: 'incident_severity', label: 'Incident by Severity', category: 'incidents' },
    { id: 'incident_category', label: 'Incident by Category', category: 'incidents' },
    { id: 'audits', label: 'Audits', category: 'audits' },
    { id: 'audit_compliance', label: 'Audit Compliance', category: 'audits' },
    { id: 'team_performance', label: 'Team Performance', category: 'teams' }
  ];

  const chartTypeOptions = [
    { id: 'bar', label: 'Bar Chart' },
    { id: 'line', label: 'Line Chart' },
    { id: 'pie', label: 'Pie Chart' },
    { id: 'table', label: 'Data Table' }
  ];

  const toggleMetric = (metricId) => {
    setConfig(prev => ({
      ...prev,
      metrics: prev.metrics.includes(metricId)
        ? prev.metrics.filter(m => m !== metricId)
        : [...prev.metrics, metricId]
    }));
  };

  const toggleChartType = (chartId) => {
    setConfig(prev => ({
      ...prev,
      chartTypes: prev.chartTypes.includes(chartId)
        ? prev.chartTypes.filter(c => c !== chartId)
        : [...prev.chartTypes, chartId]
    }));
  };

  const toggleTeam = (teamId) => {
    setConfig(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        teams: prev.filters.teams.includes(teamId)
          ? prev.filters.teams.filter(t => t !== teamId)
          : [...prev.filters.teams, teamId]
      }
    }));
  };

  const handleSave = () => {
    if (!config.name) {
      alert('Please enter a report name');
      return;
    }
    saveMutation.mutate({
      name: config.name,
      description: config.description,
      category: 'custom',
      config: config
    });
  };

  const handleGenerate = (format) => {
    const reportData = prepareReportData(config.metrics, evaluations, incidents, audits, config.dateRange);
    if (format === 'csv') {
      exportToCSV(reportData, `${config.name || 'custom-report'}.csv`);
    } else {
      exportToPDF(reportData, config.name || 'Custom Report', config.description);
    }
  };

  return (
    <Card className="border-2 border-sky-400 bg-slate-800">
      <CardHeader>
        <CardTitle className="text-slate-300">Advanced Report Builder</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Report Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-slate-300">Report Name</Label>
            <Input
              value={config.name}
              onChange={e => setConfig({ ...config, name: e.target.value })}
              placeholder="e.g., Monthly Quality Review"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Description</Label>
            <Input
              value={config.description}
              onChange={e => setConfig({ ...config, description: e.target.value })}
              placeholder="Brief description"
            />
          </div>
        </div>

        {/* Date Range */}
        <div className="space-y-2">
          <Label className="text-slate-300">Date Range</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={config.dateRange} onValueChange={v => setConfig({ ...config, dateRange: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            {config.dateRange === 'custom' && (
              <>
                <Input
                  type="date"
                  value={config.customStartDate}
                  onChange={e => setConfig({ ...config, customStartDate: e.target.value })}
                  placeholder="Start Date"
                />
                <Input
                  type="date"
                  value={config.customEndDate}
                  onChange={e => setConfig({ ...config, customEndDate: e.target.value })}
                  placeholder="End Date"
                />
              </>
            )}
          </div>
        </div>

        {/* Metrics Selection */}
        <div className="space-y-3">
          <Label className="text-slate-300">Metrics to Include</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {availableMetrics.map(metric => (
              <div key={metric.id} className="flex items-center space-x-2">
                <Checkbox
                  id={metric.id}
                  checked={config.metrics.includes(metric.id)}
                  onCheckedChange={() => toggleMetric(metric.id)}
                />
                <label htmlFor={metric.id} className="text-sm text-slate-300 cursor-pointer">
                  {metric.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Chart Types */}
        <div className="space-y-3">
          <Label className="text-slate-300">Chart Types</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {chartTypeOptions.map(chart => (
              <div key={chart.id} className="flex items-center space-x-2">
                <Checkbox
                  id={chart.id}
                  checked={config.chartTypes.includes(chart.id)}
                  onCheckedChange={() => toggleChartType(chart.id)}
                />
                <label htmlFor={chart.id} className="text-sm text-slate-300 cursor-pointer">
                  {chart.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-4">
          <Label className="text-slate-300">Filters</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-slate-400">Teams</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto p-2 bg-slate-700 rounded">
                {teams.map(team => (
                  <div key={team.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`team-${team.id}`}
                      checked={config.filters.teams.includes(team.id)}
                      onCheckedChange={() => toggleTeam(team.id)}
                    />
                    <label htmlFor={`team-${team.id}`} className="text-sm text-slate-300 cursor-pointer">
                      {team.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <Label className="text-sm text-slate-400">Status Filter</Label>
                <Select
                  value={config.filters.status}
                  onValueChange={v => setConfig({ ...config, filters: { ...config.filters, status: v } })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm text-slate-400">Severity Filter</Label>
                <Select
                  value={config.filters.severity}
                  onValueChange={v => setConfig({ ...config, filters: { ...config.filters, severity: v } })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severity</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Group By */}
        <div className="space-y-2">
          <Label className="text-slate-300">Group By</Label>
          <Select value={config.groupBy} onValueChange={v => setConfig({ ...config, groupBy: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Grouping</SelectItem>
              <SelectItem value="team">Team</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="severity">Severity</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-700">
          <Button onClick={handleSave} className="bg-sky-500 hover:bg-sky-600">
            <Save className="w-4 h-4 mr-2" />
            Save Template
          </Button>
          <Button onClick={() => handleGenerate('pdf')} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Generate PDF
          </Button>
          <Button onClick={() => handleGenerate('csv')} variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}