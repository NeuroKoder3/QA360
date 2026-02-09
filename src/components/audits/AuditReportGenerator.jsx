import React, { useState } from 'react';
import { localDataStore } from '@/api/localDataStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, FileText, Save, Edit, CheckCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AuditReportGenerator({ audit, onSave }) {
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [report, setReport] = useState(null);

  const generateReport = async () => {
    setLoading(true);
    try {
      const auditData = {
        title: audit.title,
        type: audit.audit_type,
        findings: audit.findings,
        recommendations: audit.recommendations,
        compliance_score: audit.compliance_score,
        checklist: audit.checklist,
        status: audit.status,
        team_id: audit.team_id
      };

      const response = await localDataStore.integrations.Core.InvokeLLM({
        prompt: `Generate a comprehensive audit report based on the following audit data:
        
        ${JSON.stringify(auditData, null, 2)}
        
        Create a professional audit report with:
        1. Executive Summary (2-3 sentences)
        2. Risk Assessment with top 3-5 key risks, each with severity (critical/high/medium/low) and description
        3. Detailed Findings summary
        4. Remediation Plan with specific steps, each including:
           - Action item description
           - Responsible party suggestion
           - Estimated timeline (in days/weeks)
           - Priority level
        5. Overall Recommendations
        6. Conclusion with next steps
        
        Be specific, actionable, and professional. Use clear business language.`,
        response_json_schema: {
          type: "object",
          properties: {
            executive_summary: { type: "string" },
            risk_assessment: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  risk: { type: "string" },
                  severity: { type: "string" },
                  description: { type: "string" }
                }
              }
            },
            findings_summary: { type: "string" },
            remediation_plan: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action: { type: "string" },
                  responsible: { type: "string" },
                  timeline: { type: "string" },
                  priority: { type: "string" }
                }
              }
            },
            recommendations: { type: "string" },
            conclusion: { type: "string" }
          }
        }
      });

      setReport(response);
      setEditing(false);
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(report);
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
            <FileText className="w-5 h-5 text-sky-400" />
            AI Audit Report Generator
          </CardTitle>
          <div className="flex gap-2">
            {report && !editing && (
              <Button onClick={() => setEditing(true)} variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit Report
              </Button>
            )}
            {report && editing && (
              <Button onClick={() => setEditing(false)} variant="outline" size="sm">
                <CheckCircle className="w-4 h-4 mr-2" />
                Done Editing
              </Button>
            )}
            {report && (
              <Button onClick={handleSave} className="bg-sky-500 hover:bg-sky-600" size="sm">
                <Save className="w-4 h-4 mr-2" />
                Save Report
              </Button>
            )}
            {!report && (
              <Button
                onClick={generateReport}
                disabled={loading}
                className="bg-sky-500 hover:bg-sky-600"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!report && !loading && (
          <div className="text-center py-12 text-slate-400">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg mb-2">No report generated yet</p>
            <p className="text-sm">Click "Generate Report" to create an AI-powered audit report</p>
          </div>
        )}

        {report && (
          <Tabs defaultValue="preview" className="space-y-4">
            <TabsList className="bg-slate-700">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="edit">Edit Mode</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="space-y-6">
              {/* Executive Summary */}
              <div>
                <h3 className="text-lg font-semibold text-slate-300 mb-2">Executive Summary</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{report.executive_summary}</p>
              </div>

              {/* Risk Assessment */}
              {report.risk_assessment && report.risk_assessment.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-300 mb-3">Risk Assessment</h3>
                  <div className="space-y-3">
                    {report.risk_assessment.map((risk, i) => (
                      <div key={i} className="p-4 bg-slate-700 rounded-lg border-l-4 border-rose-400">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-medium text-slate-300">{risk.risk}</p>
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

              {/* Findings Summary */}
              {report.findings_summary && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-300 mb-2">Findings Summary</h3>
                  <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-line">
                    {report.findings_summary}
                  </p>
                </div>
              )}

              {/* Remediation Plan */}
              {report.remediation_plan && report.remediation_plan.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-300 mb-3">Remediation Plan</h3>
                  <div className="space-y-3">
                    {report.remediation_plan.map((step, i) => (
                      <div key={i} className="p-4 bg-slate-700 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-medium text-slate-300">{i + 1}. {step.action}</p>
                          <Badge className={getPriorityColor(step.priority)}>
                            {step.priority}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                          <div>
                            <span className="text-slate-500">Responsible:</span>
                            <span className="text-slate-400 ml-2">{step.responsible}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Timeline:</span>
                            <span className="text-slate-400 ml-2">{step.timeline}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {report.recommendations && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-300 mb-2">Recommendations</h3>
                  <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-line">
                    {report.recommendations}
                  </p>
                </div>
              )}

              {/* Conclusion */}
              {report.conclusion && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-300 mb-2">Conclusion</h3>
                  <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-line">
                    {report.conclusion}
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="edit" className="space-y-6">
              <div className="space-y-2">
                <Label className="text-slate-300">Executive Summary</Label>
                <Textarea
                  value={report.executive_summary}
                  onChange={e => setReport({ ...report, executive_summary: e.target.value })}
                  rows={3}
                  className="bg-slate-700 text-slate-300"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Findings Summary</Label>
                <Textarea
                  value={report.findings_summary}
                  onChange={e => setReport({ ...report, findings_summary: e.target.value })}
                  rows={6}
                  className="bg-slate-700 text-slate-300"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Recommendations</Label>
                <Textarea
                  value={report.recommendations}
                  onChange={e => setReport({ ...report, recommendations: e.target.value })}
                  rows={6}
                  className="bg-slate-700 text-slate-300"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Conclusion</Label>
                <Textarea
                  value={report.conclusion}
                  onChange={e => setReport({ ...report, conclusion: e.target.value })}
                  rows={4}
                  className="bg-slate-700 text-slate-300"
                />
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}