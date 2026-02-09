import React, { useState } from 'react';
import { localDataStore } from '@/api/localDataStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, AlertTriangle, TrendingUp, Shield } from 'lucide-react';

export default function AuditAIAnalysis({ audit }) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const analyzeAudit = async () => {
    setLoading(true);
    try {
      const auditData = {
        title: audit.title,
        type: audit.audit_type,
        findings: audit.findings,
        recommendations: audit.recommendations,
        compliance_score: audit.compliance_score,
        checklist: audit.checklist,
        status: audit.status
      };

      const response = await localDataStore.integrations.Core.InvokeLLM({
        prompt: `Analyze this audit data and provide insights:
        
        ${JSON.stringify(auditData, null, 2)}
        
        Please identify:
        1. Top 3 risk areas or compliance deviations
        2. Severity assessment (critical, high, medium, low)
        3. 3 specific actionable recommendations to address the risks
        4. Potential impact if issues are not addressed
        5. Suggested timeline for remediation
        
        Be specific and prioritize based on compliance risk.`,
        response_json_schema: {
          type: "object",
          properties: {
            risk_areas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  area: { type: "string" },
                  severity: { type: "string" },
                  description: { type: "string" }
                }
              }
            },
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  action: { type: "string" },
                  priority: { type: "string" }
                }
              }
            },
            potential_impact: { type: "string" },
            remediation_timeline: { type: "string" },
            overall_assessment: { type: "string" }
          }
        }
      });

      setAnalysis(response);
    } catch (error) {
      console.error('Failed to analyze:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    const s = severity?.toLowerCase() || '';
    if (s.includes('critical')) return 'bg-rose-100 text-rose-700';
    if (s.includes('high')) return 'bg-orange-100 text-orange-700';
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
            AI Risk Analysis
          </CardTitle>
          <Button
            onClick={analyzeAudit}
            disabled={loading}
            className="bg-sky-500 hover:bg-sky-600"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze Audit
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!analysis && !loading && (
          <div className="text-center py-8 text-slate-400">
            <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Click "Analyze Audit" to identify risks and compliance deviations</p>
          </div>
        )}

        {analysis && (
          <div className="space-y-6">
            {/* Overall Assessment */}
            {analysis.overall_assessment && (
              <div className="p-4 bg-slate-700 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-300 mb-2">Overall Assessment</h4>
                <p className="text-sm text-slate-400">{analysis.overall_assessment}</p>
              </div>
            )}

            {/* Risk Areas */}
            {analysis.risk_areas && analysis.risk_areas.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Identified Risk Areas
                </h4>
                <div className="space-y-3">
                  {analysis.risk_areas.map((risk, i) => (
                    <div key={i} className="p-4 bg-slate-700 rounded-lg border-l-4 border-rose-400">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium text-slate-300">{risk.area}</p>
                        <Badge className={getSeverityColor(risk.severity)}>
                          {risk.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400">{risk.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-sky-400" />
                  Actionable Recommendations
                </h4>
                <div className="space-y-3">
                  {analysis.recommendations.map((rec, i) => (
                    <div key={i} className="p-4 bg-slate-700 rounded-lg border-l-4 border-sky-400">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium text-slate-300">{rec.title}</p>
                        <Badge className={getPriorityColor(rec.priority)}>
                          {rec.priority} priority
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400">{rec.action}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Impact & Timeline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.potential_impact && (
                <div className="p-4 bg-slate-700 rounded-lg">
                  <h4 className="text-sm font-semibold text-slate-300 mb-2">Potential Impact</h4>
                  <p className="text-sm text-slate-400">{analysis.potential_impact}</p>
                </div>
              )}
              {analysis.remediation_timeline && (
                <div className="p-4 bg-slate-700 rounded-lg">
                  <h4 className="text-sm font-semibold text-slate-300 mb-2">Remediation Timeline</h4>
                  <p className="text-sm text-slate-400">{analysis.remediation_timeline}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}