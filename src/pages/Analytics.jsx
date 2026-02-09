import React, { useState } from 'react';
import { localDataStore } from '@/api/localDataStore';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle, 
  Clock,
  BarChart3,
  PieChartIcon
} from 'lucide-react';
import { format, subDays, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import CustomReportBuilder from '@/components/analytics/CustomReportBuilder';
import AdvancedReportBuilder from '@/components/analytics/AdvancedReportBuilder';
import DashboardCustomizer from '@/components/analytics/DashboardCustomizer';
import { exportToCSV, exportToPDF, prepareReportData } from '@/components/analytics/ReportExporter';
import ReportScheduler from '@/components/analytics/ReportScheduler';
import ReportTemplates from '@/components/analytics/ReportTemplates';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f43f5e'];

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('30days');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [dashboardLayout, setDashboardLayout] = useState([
    { id: 'kpiSummary', visible: true },
    { id: 'qaScoreTrend', visible: true },
    { id: 'activityVolume', visible: true },
    { id: 'teamPerformance', visible: true },
    { id: 'incidentsByCategory', visible: true },
    { id: 'severityDistribution', visible: true },
    { id: 'scoreDistribution', visible: true },
  ]);

  const { data: evaluations = [] } = useQuery({
    queryKey: ['evaluations'],
    queryFn: () => localDataStore.entities.QAEvaluation.list('-created_date', 500)
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => localDataStore.entities.Incident.list('-created_date', 500)
  });

  const { data: audits = [] } = useQuery({
    queryKey: ['audits'],
    queryFn: () => localDataStore.entities.Audit.list('-created_date', 500)
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => localDataStore.entities.Team.list()
  });

  // Filter by time range
  const getDateRange = () => {
    const now = new Date();
    switch (timeRange) {
      case '7days': return subDays(now, 7);
      case '30days': return subDays(now, 30);
      case '90days': return subDays(now, 90);
      case '12months': return subMonths(now, 12);
      default: return subDays(now, 30);
    }
  };

  const filterByDate = (items, dateField = 'created_date') => {
    const startDate = getDateRange();
    return items.filter(item => {
      const itemDate = new Date(item[dateField] || item.created_date);
      return itemDate >= startDate;
    });
  };

  const filteredEvaluations = filterByDate(evaluations).filter(e => 
    selectedTeam === 'all' || e.team_id === selectedTeam
  );

  const filteredIncidents = filterByDate(incidents);

  // Calculate metrics
  const avgQAScore = filteredEvaluations.length > 0
    ? (filteredEvaluations.reduce((sum, e) => sum + (e.final_score || 0), 0) / filteredEvaluations.length).toFixed(1)
    : 0;

  const defectRate = incidents.length > 0
    ? ((incidents.filter(i => i.severity === 'critical' || i.severity === 'high').length / incidents.length) * 100).toFixed(1)
    : 0;

  // Generate trend data
  const generateTrendData = () => {
    const days = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 12;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = timeRange === '12months' 
        ? subMonths(new Date(), i)
        : subDays(new Date(), i);
      
      const dateStr = timeRange === '12months'
        ? format(date, 'MMM')
        : format(date, 'MMM d');
      
      const dayEvals = filteredEvaluations.filter(e => {
        const evalDate = new Date(e.evaluation_date || e.created_date);
        if (timeRange === '12months') {
          return format(evalDate, 'MMM yyyy') === format(date, 'MMM yyyy');
        }
        return format(evalDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
      });
      
      const dayIncidents = filteredIncidents.filter(i => {
        const incDate = new Date(i.incident_date || i.created_date);
        if (timeRange === '12months') {
          return format(incDate, 'MMM yyyy') === format(date, 'MMM yyyy');
        }
        return format(incDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
      });

      data.push({
        date: dateStr,
        qaScore: dayEvals.length > 0 
          ? Math.round(dayEvals.reduce((s, e) => s + (e.final_score || 0), 0) / dayEvals.length)
          : null,
        incidents: dayIncidents.length,
        evaluations: dayEvals.length
      });
    }
    return data;
  };

  // Team performance comparison
  const teamPerformanceData = teams.map(team => {
    const teamEvals = filteredEvaluations.filter(e => e.team_id === team.id);
    const avgScore = teamEvals.length > 0
      ? teamEvals.reduce((sum, e) => sum + (e.final_score || 0), 0) / teamEvals.length
      : 0;
    return {
      name: team.name,
      score: Math.round(avgScore),
      evaluations: teamEvals.length
    };
  }).filter(t => t.evaluations > 0).sort((a, b) => b.score - a.score);

  // Incident category breakdown
  const incidentCategoryData = filteredIncidents.reduce((acc, inc) => {
    const cat = inc.category || 'Other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(incidentCategoryData).map(([name, value]) => ({
    name: name.replace(/_/g, ' '),
    value
  }));

  // Severity distribution
  const severityData = ['critical', 'high', 'medium', 'low'].map(severity => ({
    severity: severity.charAt(0).toUpperCase() + severity.slice(1),
    count: filteredIncidents.filter(i => i.severity === severity).length
  }));

  // Score distribution
  const scoreDistribution = [
    { range: '90-100', count: filteredEvaluations.filter(e => e.final_score >= 90).length },
    { range: '80-89', count: filteredEvaluations.filter(e => e.final_score >= 80 && e.final_score < 90).length },
    { range: '70-79', count: filteredEvaluations.filter(e => e.final_score >= 70 && e.final_score < 80).length },
    { range: '60-69', count: filteredEvaluations.filter(e => e.final_score >= 60 && e.final_score < 70).length },
    { range: '<60', count: filteredEvaluations.filter(e => e.final_score < 60).length },
  ];

  const trendData = generateTrendData();

  const handleGenerateReport = (reportConfig) => {
    const reportData = prepareReportData(reportConfig, filteredEvaluations, filteredIncidents, audits, teams);
    console.log('Generated Report:', reportData);
    alert(`Report generated with ${reportData.length} records!`);
  };

  const handleExportReport = (reportConfig) => {
    const reportData = prepareReportData(reportConfig, filteredEvaluations, filteredIncidents, audits, teams);
    
    if (reportConfig.format === 'csv') {
      exportToCSV(reportData, reportConfig.name || 'analytics-report');
    } else if (reportConfig.format === 'pdf') {
      exportToPDF(reportConfig, reportData);
    }
  };

  const handleSaveLayout = (newLayout) => {
    setDashboardLayout(newLayout);
    localStorage.setItem('analytics-dashboard-layout', JSON.stringify(newLayout));
    alert('Dashboard layout saved!');
  };

  const isWidgetVisible = (widgetId) => {
    const widget = dashboardLayout.find(w => w.id === widgetId);
    return widget ? widget.visible : true;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-slate-100">
          <p className="text-sm font-medium text-slate-900 mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-semibold">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 bg-black min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-slate-400">Quality metrics and performance insights</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <DashboardCustomizer widgets={dashboardLayout} onSave={handleSaveLayout} />
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Teams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
              <SelectItem value="12months">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Advanced Report Builder */}
      <Tabs defaultValue="builder" className="space-y-4">
        <TabsList className="bg-slate-800">
          <TabsTrigger value="builder">Report Builder</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="scheduler">Scheduled Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="builder">
          <AdvancedReportBuilder
            evaluations={filteredEvaluations}
            incidents={filteredIncidents}
            audits={audits}
            teams={teams}
          />
        </TabsContent>
        <TabsContent value="templates">
          <ReportTemplates onUseTemplate={(template) => console.log('Using template:', template)} />
        </TabsContent>
        <TabsContent value="scheduler">
          <ReportScheduler />
        </TabsContent>
      </Tabs>

      {/* KPI Summary */}
      {isWidgetVisible('kpiSummary') && (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-2 border-sky-400 bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50">
              <Target className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{avgQAScore}%</p>
              <p className="text-xs text-slate-500">Avg QA Score</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-300">{filteredEvaluations.length}</p>
              <p className="text-xs text-slate-400">Evaluations</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-50">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-300">{filteredIncidents.length}</p>
              <p className="text-xs text-slate-400">Incidents</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-300">{defectRate}%</p>
              <p className="text-xs text-slate-400">Critical Rate</p>
            </div>
          </div>
        </Card>
      </div>
      )}

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="bg-slate-800">
          <TabsTrigger value="trends" className="text-slate-300">Trends</TabsTrigger>
          <TabsTrigger value="teams" className="text-slate-300">Team Performance</TabsTrigger>
          <TabsTrigger value="incidents" className="text-slate-300">Incidents</TabsTrigger>
          <TabsTrigger value="distribution" className="text-slate-300">Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {isWidgetVisible('qaScoreTrend') && (
            <Card className="border-2 border-sky-400 bg-slate-800">
              <CardHeader>
                <CardTitle className="text-lg text-white">QA Score Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="colorQA" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="qaScore" name="QA Score" stroke="#6366f1" strokeWidth={2} fill="url(#colorQA)" connectNulls />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            )}

            {isWidgetVisible('activityVolume') && (
            <Card className="border-2 border-sky-400 bg-slate-800">
              <CardHeader>
                <CardTitle className="text-lg text-white">Activity Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="evaluations" name="Evaluations" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="incidents" name="Incidents" fill="#64748b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="teams">
          {isWidgetVisible('teamPerformance') && (
          <Card className="border-2 border-sky-400 bg-slate-800">
            <CardHeader>
              <CardTitle className="text-lg text-white">Team Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamPerformanceData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
                    <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={120} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="score" name="Score" radius={[0, 6, 6, 0]} barSize={28}>
                      {teamPerformanceData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.score >= 90 ? '#10b981' : entry.score >= 75 ? '#f59e0b' : '#f43f5e'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          )}
        </TabsContent>

        <TabsContent value="incidents">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {isWidgetVisible('incidentsByCategory') && (
            <Card className="border-2 border-sky-400 bg-slate-800">
              <CardHeader>
                <CardTitle className="text-lg text-white">Incidents by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-3 mt-4">
                  {pieData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-xs text-slate-400">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            )}

            {isWidgetVisible('severityDistribution') && (
            <Card className="border-2 border-sky-400 bg-slate-800">
              <CardHeader>
                <CardTitle className="text-lg text-white">Severity Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={severityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="severity" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Count" radius={[6, 6, 0, 0]}>
                        {severityData.map((entry, index) => {
                          const colors = { Critical: '#f43f5e', High: '#f97316', Medium: '#f59e0b', Low: '#10b981' };
                          return <Cell key={`cell-${index}`} fill={colors[entry.severity]} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="distribution">
          {isWidgetVisible('scoreDistribution') && (
          <Card className="border-2 border-sky-400 bg-slate-800">
            <CardHeader>
              <CardTitle className="text-lg text-white">Score Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="range" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Evaluations" fill="#0ea5e9" radius={[6, 6, 0, 0]} barSize={60}>
                      {scoreDistribution.map((entry, index) => {
                        const colors = ['#10b981', '#22c55e', '#f59e0b', '#f97316', '#f43f5e'];
                        return <Cell key={`cell-${index}`} fill={colors[index]} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}