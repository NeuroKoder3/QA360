import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, TrendingUp, TrendingDown, Award } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function AgentPerformanceTable({ evaluations, incidents, teamId }) {
  const [searchTerm, setSearchTerm] = useState('');

  // Group by agent
  const agentStats = {};
  const filteredEvals = teamId === 'all' ? evaluations : evaluations.filter(e => e.team_id === teamId);
  const filteredIncidents = teamId === 'all' ? incidents : incidents.filter(i => i.team_id === teamId);

  filteredEvals.forEach(e => {
    if (!agentStats[e.agent_email]) {
      agentStats[e.agent_email] = {
        name: e.agent_name,
        email: e.agent_email,
        scores: [],
        incidents: 0
      };
    }
    agentStats[e.agent_email].scores.push(e.final_score || 0);
  });

  filteredIncidents.forEach(i => {
    if (i.reported_by && agentStats[i.reported_by]) {
      agentStats[i.reported_by].incidents++;
    }
  });

  const agentData = Object.values(agentStats).map(agent => {
    const avgScore = agent.scores.length > 0
      ? agent.scores.reduce((sum, s) => sum + s, 0) / agent.scores.length
      : 0;
    const trend = agent.scores.length >= 2
      ? agent.scores[agent.scores.length - 1] - agent.scores[agent.scores.length - 2]
      : 0;

    return {
      ...agent,
      avgScore: avgScore.toFixed(1),
      evaluations: agent.scores.length,
      trend: trend.toFixed(1)
    };
  }).sort((a, b) => parseFloat(b.avgScore) - parseFloat(a.avgScore));

  const filteredAgents = agentData.filter(a =>
    a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name) => {
    if (!name) return 'A';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Card className="border-2 border-sky-400 bg-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-300">Individual Agent Performance</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search agents..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-700 border-slate-600"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-slate-700">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-slate-700/50">
                <TableHead className="text-slate-400">Rank</TableHead>
                <TableHead className="text-slate-400">Agent</TableHead>
                <TableHead className="text-slate-400">Avg Score</TableHead>
                <TableHead className="text-slate-400">Trend</TableHead>
                <TableHead className="text-slate-400">Evaluations</TableHead>
                <TableHead className="text-slate-400">Incidents</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAgents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-400 py-8">
                    No agents found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAgents.map((agent, index) => (
                  <TableRow key={agent.email} className="border-slate-700 hover:bg-slate-700/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {index < 3 && (
                          <Award className={`w-4 h-4 ${
                            index === 0 ? 'text-amber-500' :
                            index === 1 ? 'text-slate-400' :
                            'text-orange-700'
                          }`} />
                        )}
                        <span className="text-slate-300 font-medium">#{index + 1}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-sky-500/20 text-sky-400 text-xs">
                            {getInitials(agent.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-slate-300">{agent.name}</p>
                          <p className="text-xs text-slate-500">{agent.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`text-lg font-bold ${
                        parseFloat(agent.avgScore) >= 90 ? 'text-emerald-400' :
                        parseFloat(agent.avgScore) >= 75 ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {agent.avgScore}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {parseFloat(agent.trend) > 0 ? (
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                        ) : parseFloat(agent.trend) < 0 ? (
                          <TrendingDown className="w-4 h-4 text-rose-400" />
                        ) : null}
                        <span className={`text-sm ${
                          parseFloat(agent.trend) > 0 ? 'text-emerald-400' :
                          parseFloat(agent.trend) < 0 ? 'text-rose-400' : 'text-slate-400'
                        }`}>
                          {parseFloat(agent.trend) > 0 ? '+' : ''}{agent.trend}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-slate-300 border-slate-600">
                        {agent.evaluations}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        agent.incidents === 0 ? 'bg-emerald-500/20 text-emerald-400' :
                        agent.incidents <= 2 ? 'bg-amber-500/20 text-amber-400' :
                        'bg-rose-500/20 text-rose-400'
                      }>
                        {agent.incidents}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}