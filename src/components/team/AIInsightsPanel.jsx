import React, { useState } from 'react';
import { localDataStore } from '@/api/localDataStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, TrendingUp, AlertTriangle, Target, Users } from 'lucide-react';

export default function AIInsightsPanel({ evaluations, incidents, audits, teamId }) {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState(null);

  const generateInsights = async () => {
    setLoading(true);
    try {
      const filteredEvals = teamId === 'all' ? evaluations : evaluations.filter(e => e.team_id === teamId);
      const filteredIncidents = teamId === 'all' ? incidents : incidents.filter(i => i.team_id === teamId);
      const filteredAudits = teamId === 'all' ? audits : audits.filter(a => a.team_id === teamId);

      // Calculate summary stats
      const avgScore = filteredEvals.length > 0
        ? (filteredEvals.reduce((sum, e) => sum + (e.final_score || 0), 0) / filteredEvals.length).toFixed(1)
        : 0;

      const criticalIncidents = filteredIncidents.filter(i => i.severity === 'critical' || i.severity === 'high').length;
      
      const agentStats = {};
      filteredEvals.forEach(e => {
        if (!agentStats[e.agent_email]) {
          agentStats[e.agent_email] = { name: e.agent_name, scores: [] };
        }
        agentStats[e.agent_email].scores.push(e.final_score || 0);
      });

      const topPerformers = Object.entries(agentStats)
        .map(([email, data]) => ({
          name: data.name,
          avgScore: (data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length).toFixed(1)
        }))
        .sort((a, b) => parseFloat(b.avgScore) - parseFloat(a.avgScore))
        .slice(0, 3);

      const response = await localDataStore.integrations.Core.InvokeLLM({
        prompt: `Analyze the following team performance data and provide actionable insights:

Team Performance Summary:
- Average QA Score: ${avgScore}%
- Total Evaluations: ${filteredEvals.length}
- Critical Incidents: ${criticalIncidents}
- Total Incidents: ${filteredIncidents.length}
- Active Audits: ${filteredAudits.filter(a => a.status === 'in_progress').length}

Top 3 Performers:
${topPerformers.map((p, i) => `${i + 1}. ${p.name} - ${p.avgScore}%`).join('\n')}

Recent Incidents (last 5):
${filteredIncidents.slice(0, 5).map(i => `- ${i.title} (${i.severity}): ${i.category}`).join('\n')}

Provide:
1. Overall performance assessment (1-2 sentences)
2. Top 3 strengths with specific examples
3. Top 3 areas needing improvement with specific actionable recommendations
4. Key risks to monitor
5. Recommended actions for the next 30 days

Be specific, data-driven, and actionable.`,
        response_json_schema: {
          type: "object",
          properties: {
            overall_assessment: { type: "string" },
            strengths: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" }
                }
              }
            },
            improvements: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  area: { type: "string" },
                  recommendation: { type: "string" },
                  priority: { type: "string" }
                }
              }
            },
            risks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  risk: { type: "string" },
                  severity: { type: "string" }
                }
              }
            },
            recommended_actions: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setInsights(response);
    } catch (error) {
      console.error('Failed to generate insights:', error);
      alert('Failed to generate insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    const s = severity?.toLowerCase() || '';
    if (s.includes('critical') || s.includes('high')) return 'bg-rose-100 text-rose-700';
    if (s.includes('medium')) return 'bg-amber-100 text-amber-700';
    return 'bg-slate-100 text-slate-700';
  };

  const getPriorityColor = (priority) => {
    const p = priority?.toLowerCase() || '';
    if (p.includes('high')) return 'bg-rose-100 text-rose-700';
    if (p.includes('medium')) return 'bg-amber-100 text-amber-700';
    return 'bg-emerald-100 text-emerald-700';
  };

  return (
    <Card className="border-2 border-sky-400 bg-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-300 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sky-400" />
            AI Performance Insights
          </CardTitle>
          <Button
            onClick={generateInsights}
            disabled={loading}
            className="bg-sky-500 hover:bg-sky-600"
            size="sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Insights
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!insights && !loading && (
          <div className="text-center py-12 text-slate-400">
            <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg mb-2">No insights generated yet</p>
            <p className="text-sm">Click "Generate Insights" to get AI-powered performance analysis</p>
          </div>
        )}

        {insights && (
          <div className="space-y-6">
            {/* Overall Assessment */}
            <div className="p-4 bg-slate-700 rounded-lg border-l-4 border-sky-400">
              <h3 className="text-sm font-semibold text-sky-400 mb-2">Overall Assessment</h3>
              <p className="text-slate-300 text-sm leading-relaxed">{insights.overall_assessment}</p>
            </div>

            {/* Strengths */}
            {insights.strengths && insights.strengths.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Key Strengths
                </h3>
                <div className="space-y-2">
                  {insights.strengths.map((strength, i) => (
                    <div key={i} className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                      <p className="font-medium text-emerald-400 text-sm mb-1">{strength.title}</p>
                      <p className="text-slate-400 text-xs">{strength.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Improvements */}
            {insights.improvements && insights.improvements.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-amber-400" />
                  Areas for Improvement
                </h3>
                <div className="space-y-2">
                  {insights.improvements.map((improvement, i) => (
                    <div key={i} className="p-3 bg-slate-700 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium text-slate-300 text-sm">{improvement.area}</p>
                        <Badge className={getPriorityColor(improvement.priority)}>
                          {improvement.priority}
                        </Badge>
                      </div>
                      <p className="text-slate-400 text-xs">{improvement.recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Risks */}
            {insights.risks && insights.risks.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Key Risks
                </h3>
                <div className="space-y-2">
                  {insights.risks.map((risk, i) => (
                    <div key={i} className="p-3 bg-rose-500/10 rounded-lg border border-rose-500/20">
                      <div className="flex items-start justify-between">
                        <p className="text-slate-300 text-sm flex-1">{risk.risk}</p>
                        <Badge className={getSeverityColor(risk.severity)}>
                          {risk.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Actions */}
            {insights.recommended_actions && insights.recommended_actions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-400" />
                  Recommended Actions (Next 30 Days)
                </h3>
                <div className="space-y-2">
                  {insights.recommended_actions.map((action, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-slate-700 rounded-lg">
                      <div className="w-6 h-6 rounded-full bg-sky-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-sky-400 text-xs font-bold">{i + 1}</span>
                      </div>
                      <p className="text-slate-300 text-sm flex-1">{action}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}