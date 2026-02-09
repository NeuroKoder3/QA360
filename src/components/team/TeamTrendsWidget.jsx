import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, subDays } from 'date-fns';

export default function TeamTrendsWidget({ teamId, evaluations, incidents, timeRange }) {
  const days = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90;
  
  const trendData = Array.from({ length: days }, (_, i) => {
    const date = subDays(new Date(), days - 1 - i);
    const dateStr = format(date, 'MMM d');
    
    const filteredEvals = teamId === 'all' 
      ? evaluations.filter(e => format(new Date(e.evaluation_date || e.created_date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'))
      : evaluations.filter(e => e.team_id === teamId && format(new Date(e.evaluation_date || e.created_date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
    
    const filteredIncidents = teamId === 'all'
      ? incidents.filter(i => format(new Date(i.incident_date || i.created_date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'))
      : incidents.filter(i => i.team_id === teamId && format(new Date(i.incident_date || i.created_date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
    
    const avgScore = filteredEvals.length > 0
      ? Math.round(filteredEvals.reduce((sum, e) => sum + (e.final_score || 0), 0) / filteredEvals.length)
      : null;

    return {
      date: dateStr,
      score: avgScore,
      incidents: filteredIncidents.length
    };
  });

  return (
    <Card className="border-2 border-sky-400 bg-slate-800">
      <CardHeader>
        <CardTitle className="text-slate-300">Performance Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis yAxisId="left" stroke="#94a3b8" />
              <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #0ea5e9' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="score" stroke="#0ea5e9" strokeWidth={2} name="QA Score" connectNulls />
              <Line yAxisId="right" type="monotone" dataKey="incidents" stroke="#f87171" strokeWidth={2} name="Incidents" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}