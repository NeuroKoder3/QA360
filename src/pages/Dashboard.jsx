import React, { useState, useEffect } from 'react';
import { localDataStore } from '@/api/localDataStore';
import { useQuery } from '@tanstack/react-query';
import { 
  Target, 
  AlertTriangle, 
  FileSearch, 
  TrendingUp,
  Clock,
  CheckCircle2
} from 'lucide-react';
import KPICard from '../components/dashboard/KPICard';
import QualityTrendChart from '../components/dashboard/QualityTrendChart';
import TeamPerformanceChart from '../components/dashboard/TeamPerformanceChart';
import IncidentCategoryChart from '../components/dashboard/IncidentCategoryChart';
import RecentActivityList from '../components/dashboard/RecentActivityList';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export default function Dashboard() {
  const { data: evaluations = [], isLoading: loadingEval } = useQuery({
    queryKey: ['evaluations'],
    queryFn: () => localDataStore.entities.QAEvaluation.list('-created_date', 100)
  });

  const { data: incidents = [], isLoading: loadingInc } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => localDataStore.entities.Incident.list('-created_date', 100)
  });

  const { data: audits = [], isLoading: loadingAudit } = useQuery({
    queryKey: ['audits'],
    queryFn: () => localDataStore.entities.Audit.list('-created_date', 100)
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => localDataStore.entities.Team.list()
  });

  const isLoading = loadingEval || loadingInc || loadingAudit;

  // Calculate KPIs
  const avgQAScore = evaluations.length > 0 
    ? (evaluations.reduce((sum, e) => sum + (e.final_score || 0), 0) / evaluations.length).toFixed(1)
    : 0;

  const openIncidents = incidents.filter(i => i.status === 'open' || i.status === 'in_progress').length;
  
  const overdueAudits = audits.filter(a => {
    if (a.status === 'completed' || a.status === 'cancelled') return false;
    return a.due_date && new Date(a.due_date) < new Date();
  }).length;

  const completedAudits = audits.filter(a => a.status === 'completed').length;
  const auditComplianceRate = audits.length > 0 
    ? ((completedAudits / audits.length) * 100).toFixed(0)
    : 0;

  // Calculate MTTR (Mean Time To Resolution)
  const resolvedIncidents = incidents.filter(i => i.resolved_date && i.incident_date);
  const mttr = resolvedIncidents.length > 0
    ? (resolvedIncidents.reduce((sum, i) => {
        const diff = (new Date(i.resolved_date) - new Date(i.incident_date)) / (1000 * 60 * 60 * 24);
        return sum + diff;
      }, 0) / resolvedIncidents.length).toFixed(1)
    : 0;

  // Generate trend data (last 7 days simulation)
  const trendData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      qaScore: Math.floor(75 + Math.random() * 20),
      compliance: Math.floor(80 + Math.random() * 15)
    };
  });

  // Team performance data
  const teamPerformance = teams.slice(0, 6).map(team => {
    const teamEvals = evaluations.filter(e => e.team_id === team.id);
    const avgScore = teamEvals.length > 0
      ? teamEvals.reduce((sum, e) => sum + (e.final_score || 0), 0) / teamEvals.length
      : Math.floor(70 + Math.random() * 25);
    return {
      name: team.name,
      score: Math.round(avgScore)
    };
  });

  // Incident category data
  const incidentCategories = incidents.reduce((acc, inc) => {
    const cat = inc.category || 'Other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  
  const incidentCategoryData = Object.entries(incidentCategories).map(([name, value]) => ({
    name: name.replace(/_/g, ' '),
    value
  }));

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="p-6 border-2 border-sky-400 bg-slate-800">
              <Skeleton className="h-4 w-24 mb-4" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 h-[350px] border-2 border-sky-400 bg-slate-800">
            <Skeleton className="h-full w-full" />
          </Card>
          <Card className="p-6 h-[350px]">
            <Skeleton className="h-full w-full" />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-black min-h-screen">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Avg QA Score"
          value={`${avgQAScore}%`}
          subtitle={`${evaluations.length} evaluations`}
          trend="up"
          trendValue="+2.4% from last week"
          icon={Target}
          color="sky"
        />
        <KPICard
          title="Open Incidents"
          value={openIncidents}
          subtitle={`${incidents.length} total`}
          trend={openIncidents > 5 ? 'down' : 'up'}
          trendValue={openIncidents > 5 ? 'Needs attention' : 'Under control'}
          icon={AlertTriangle}
          color="rose"
        />
        <KPICard
          title="Audit Compliance"
          value={`${auditComplianceRate}%`}
          subtitle={`${overdueAudits} overdue`}
          trend={overdueAudits > 0 ? 'down' : 'up'}
          trendValue={overdueAudits > 0 ? `${overdueAudits} overdue` : 'All on track'}
          icon={FileSearch}
          color="emerald"
        />
        <KPICard
          title="MTTR"
          value={`${mttr} days`}
          subtitle="Mean Time to Resolution"
          trend="up"
          trendValue="Improved by 12%"
          icon={Clock}
          color="amber"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QualityTrendChart data={trendData} />
        <TeamPerformanceChart data={teamPerformance.length > 0 ? teamPerformance : [
          { name: 'Team Alpha', score: 92 },
          { name: 'Team Beta', score: 87 },
          { name: 'Team Gamma', score: 84 },
          { name: 'Team Delta', score: 78 },
          { name: 'Team Epsilon', score: 75 }
        ]} />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivityList 
            evaluations={evaluations} 
            incidents={incidents} 
            audits={audits} 
          />
        </div>
        <IncidentCategoryChart data={incidentCategoryData.length > 0 ? incidentCategoryData : [
          { name: 'Process Error', value: 12 },
          { name: 'System Bug', value: 8 },
          { name: 'Compliance', value: 5 },
          { name: 'Customer Complaint', value: 10 },
          { name: 'Other', value: 3 }
        ]} />
      </div>
    </div>
  );
}