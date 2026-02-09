import React, { useState } from 'react';
import { localDataStore } from '@/api/localDataStore';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar
} from 'recharts';
import { TrendingUp, TrendingDown, Users, AlertTriangle, Target, Settings, Sparkles } from 'lucide-react';
import TeamMetricsWidget from '@/components/team/TeamMetricsWidget';
import TeamComparisonWidget from '@/components/team/TeamComparisonWidget';
import TeamTrendsWidget from '@/components/team/TeamTrendsWidget';
import AgentPerformanceTable from '@/components/team/AgentPerformanceTable';
import AIInsightsPanel from '@/components/team/AIInsightsPanel';

export default function TeamPerformance() {
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [timeRange, setTimeRange] = useState('30days');

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => localDataStore.entities.Team.list()
  });

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

  // Calculate team metrics
  const getTeamMetrics = (teamId) => {
    const teamEvals = evaluations.filter(e => e.team_id === teamId);
    const teamIncidents = incidents.filter(i => i.team_id === teamId);
    const teamAudits = audits.filter(a => a.team_id === teamId);

    const avgScore = teamEvals.length > 0
      ? teamEvals.reduce((sum, e) => sum + (e.final_score || 0), 0) / teamEvals.length
      : 0;

    const criticalIncidents = teamIncidents.filter(i => i.severity === 'critical' || i.severity === 'high').length;
    
    const auditCompliance = teamAudits.length > 0
      ? (teamAudits.filter(a => a.status === 'completed').length / teamAudits.length) * 100
      : 0;

    return {
      avgScore: avgScore.toFixed(1),
      evaluations: teamEvals.length,
      incidents: teamIncidents.length,
      criticalIncidents,
      audits: teamAudits.length,
      auditCompliance: auditCompliance.toFixed(0)
    };
  };

  // Company average
  const companyAvg = evaluations.length > 0
    ? (evaluations.reduce((sum, e) => sum + (e.final_score || 0), 0) / evaluations.length).toFixed(1)
    : 0;

  // Team comparison data
  const teamComparisonData = teams.map(team => {
    const metrics = getTeamMetrics(team.id);
    return {
      name: team.name,
      score: parseFloat(metrics.avgScore),
      incidents: metrics.incidents,
      compliance: parseFloat(metrics.auditCompliance)
    };
  }).sort((a, b) => b.score - a.score);

  // Radar chart data for selected team
  const selectedTeamData = selectedTeam !== 'all' ? (() => {
    const metrics = getTeamMetrics(selectedTeam);
    return [{
      metric: 'QA Score',
      value: parseFloat(metrics.avgScore),
      fullMark: 100
    }, {
      metric: 'Compliance',
      value: parseFloat(metrics.auditCompliance),
      fullMark: 100
    }, {
      metric: 'Activity',
      value: Math.min((metrics.evaluations / 50) * 100, 100),
      fullMark: 100
    }, {
      metric: 'Incident Control',
      value: Math.max(100 - (metrics.criticalIncidents * 10), 0),
      fullMark: 100
    }];
  })() : [];

  return (
    <div className="space-y-6 bg-black min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Team Performance</h1>
          <p className="text-slate-400">Comprehensive team analytics and insights</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-48 bg-slate-200">
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
            <SelectTrigger className="w-36 bg-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* AI Insights Panel */}
      <AIInsightsPanel
        evaluations={evaluations}
        incidents={incidents}
        audits={audits}
        teamId={selectedTeam}
      />

      {/* KPI Summary */}
      {selectedTeam !== 'all' && (
        <TeamMetricsWidget teamId={selectedTeam} companyAvg={companyAvg} />
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Comparison */}
        <Card className="border-2 border-sky-400 bg-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-300">Team Comparison - QA Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamComparisonData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" />
                  <YAxis dataKey="name" type="category" width={100} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #0ea5e9' }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Bar dataKey="score" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Team Radar */}
        {selectedTeam !== 'all' && (
          <Card className="border-2 border-sky-400 bg-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-300">Team Performance Radar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={selectedTeamData}>
                    <PolarGrid stroke="#475569" />
                    <PolarAngleAxis dataKey="metric" stroke="#94a3b8" />
                    <Radar name="Performance" dataKey="value" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.5} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #0ea5e9' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trends */}
        <TeamTrendsWidget
          teamId={selectedTeam}
          evaluations={evaluations}
          incidents={incidents}
          timeRange={timeRange}
        />

        {/* Team Comparisons Widget */}
        <TeamComparisonWidget teams={teams} evaluations={evaluations} incidents={incidents} />
      </div>

      {/* Agent Performance Table */}
      <AgentPerformanceTable
        evaluations={evaluations}
        incidents={incidents}
        teamId={selectedTeam}
      />

      {/* Detailed Team Cards */}
      {selectedTeam === 'all' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map(team => {
            const metrics = getTeamMetrics(team.id);
            return (
              <Card key={team.id} className="border-2 border-sky-400 bg-slate-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-slate-300">{team.name}</CardTitle>
                    <Badge variant="outline">{team.department}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Avg QA Score</span>
                      <span className={`font-bold ${
                        parseFloat(metrics.avgScore) >= 90 ? 'text-emerald-400' :
                        parseFloat(metrics.avgScore) >= 75 ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {metrics.avgScore}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Evaluations</span>
                      <span className="font-semibold text-slate-300">{metrics.evaluations}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Incidents</span>
                      <span className="font-semibold text-slate-300">
                        {metrics.incidents} ({metrics.criticalIncidents} critical)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Audit Compliance</span>
                      <span className="font-semibold text-slate-300">{metrics.auditCompliance}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}