import React from 'react';
import { localDataStore } from '@/api/localDataStore';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Target, AlertTriangle } from 'lucide-react';

export default function TeamMetricsWidget({ teamId, companyAvg }) {
  const { data: evaluations = [] } = useQuery({
    queryKey: ['evaluations'],
    queryFn: () => localDataStore.entities.QAEvaluation.list('-created_date', 500)
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => localDataStore.entities.Incident.list('-created_date', 500)
  });

  const teamEvals = evaluations.filter(e => e.team_id === teamId);
  const teamIncidents = incidents.filter(i => i.team_id === teamId);

  const avgScore = teamEvals.length > 0
    ? (teamEvals.reduce((sum, e) => sum + (e.final_score || 0), 0) / teamEvals.length).toFixed(1)
    : 0;

  const criticalIncidents = teamIncidents.filter(i => i.severity === 'critical' || i.severity === 'high').length;
  const scoreDiff = (avgScore - companyAvg).toFixed(1);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="p-4 border-2 border-sky-400 bg-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-sky-500/20">
            <Target className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{avgScore}%</p>
            <p className="text-xs text-slate-400">Team QA Score</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-slate-800">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${scoreDiff >= 0 ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
            {scoreDiff >= 0 ? (
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            ) : (
              <TrendingDown className="w-5 h-5 text-rose-400" />
            )}
          </div>
          <div>
            <p className={`text-2xl font-bold ${scoreDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {scoreDiff > 0 ? '+' : ''}{scoreDiff}%
            </p>
            <p className="text-xs text-slate-400">vs Company Avg</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-500/20">
            <Target className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-300">{teamEvals.length}</p>
            <p className="text-xs text-slate-400">Evaluations</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-500/20">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-300">{criticalIncidents}</p>
            <p className="text-xs text-slate-400">Critical Issues</p>
          </div>
        </div>
      </Card>
    </div>
  );
}