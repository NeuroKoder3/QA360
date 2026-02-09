import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function TeamComparisonWidget({ teams, evaluations, incidents }) {
  const teamStats = teams.map(team => {
    const teamEvals = evaluations.filter(e => e.team_id === team.id);
    const teamIncidents = incidents.filter(i => i.team_id === team.id);
    
    const avgScore = teamEvals.length > 0
      ? teamEvals.reduce((sum, e) => sum + (e.final_score || 0), 0) / teamEvals.length
      : 0;

    return {
      name: team.name,
      avgScore: avgScore.toFixed(1),
      incidents: teamIncidents.length,
      evaluations: teamEvals.length
    };
  }).sort((a, b) => b.avgScore - a.avgScore);

  return (
    <Card className="border-2 border-sky-400 bg-slate-800">
      <CardHeader>
        <CardTitle className="text-slate-300">Team Rankings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {teamStats.map((team, index) => (
            <div key={team.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-amber-500 text-white' :
                    index === 1 ? 'bg-slate-400 text-white' :
                    index === 2 ? 'bg-orange-700 text-white' :
                    'bg-slate-700 text-slate-400'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-slate-300">{team.name}</p>
                    <p className="text-xs text-slate-400">{team.evaluations} evaluations</p>
                  </div>
                </div>
                <span className={`text-lg font-bold ${
                  parseFloat(team.avgScore) >= 90 ? 'text-emerald-400' :
                  parseFloat(team.avgScore) >= 75 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {team.avgScore}%
                </span>
              </div>
              <Progress value={parseFloat(team.avgScore)} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}