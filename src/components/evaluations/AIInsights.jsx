import React, { useState } from 'react';
import { localDataStore } from '@/api/localDataStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingDown, BookOpen, Loader2, AlertCircle, Send } from 'lucide-react';
import CoachingAssignment from '@/components/coaching/CoachingAssignment';

export default function AIInsights({ agentEmail, evaluations }) {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState(null);
  const [showCoachingDialog, setShowCoachingDialog] = useState(false);

  const agentEvals = evaluations.filter(e => e.agent_email === agentEmail);

  const analyzePerformance = async () => {
    setLoading(true);
    try {
      const evalData = agentEvals.map(e => ({
        score: e.final_score,
        date: e.evaluation_date,
        scores: e.scores,
        notes: e.reviewer_notes
      }));

      const response = await localDataStore.integrations.Core.InvokeLLM({
        prompt: `Analyze this agent's QA evaluation data and provide insights:
        
        ${JSON.stringify(evalData, null, 2)}
        
        Please identify:
        1. Top 3 areas of weakness or improvement opportunities
        2. 3 specific, actionable training recommendations
        3. Overall sentiment of the feedback (positive, neutral, or negative)
        4. Any notable trends in performance
        
        Be specific and actionable in your recommendations.`,
        response_json_schema: {
          type: "object",
          properties: {
            weaknesses: {
              type: "array",
              items: { type: "string" }
            },
            training_recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  area: { type: "string" },
                  suggestion: { type: "string" }
                }
              }
            },
            sentiment: {
              type: "object",
              properties: {
                overall: { type: "string" },
                confidence: { type: "number" }
              }
            },
            trends: { type: "string" }
          }
        }
      });

      setInsights(response);
    } catch (error) {
      console.error('Failed to analyze:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment) => {
    if (!sentiment) return 'bg-slate-100 text-slate-700';
    const s = sentiment.toLowerCase();
    if (s.includes('positive')) return 'bg-emerald-100 text-emerald-700';
    if (s.includes('negative')) return 'bg-rose-100 text-rose-700';
    return 'bg-amber-100 text-amber-700';
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
            onClick={analyzePerformance}
            disabled={loading || agentEvals.length === 0}
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
                Generate Insights
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!insights && !loading && (
          <div className="text-center py-8 text-slate-400">
            <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Click "Generate Insights" to analyze agent performance with AI</p>
          </div>
        )}

        {insights && (
          <div className="space-y-6">
            {/* Sentiment */}
            {insights.sentiment && (
              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-2">Feedback Sentiment</h4>
                <Badge className={getSentimentColor(insights.sentiment.overall)}>
                  {insights.sentiment.overall} ({Math.round(insights.sentiment.confidence * 100)}% confidence)
                </Badge>
              </div>
            )}

            {/* Weaknesses */}
            {insights.weaknesses && insights.weaknesses.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                  Areas for Improvement
                </h4>
                <div className="space-y-2">
                  {insights.weaknesses.map((weakness, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 bg-slate-700 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-slate-300">{weakness}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Training Recommendations */}
            {insights.training_recommendations && insights.training_recommendations.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-sky-400" />
                    Training Recommendations
                  </h4>
                  <Button
                    size="sm"
                    onClick={() => setShowCoachingDialog(true)}
                    className="bg-sky-500 hover:bg-sky-600"
                  >
                    <Send className="w-3 h-3 mr-2" />
                    Assign Coaching
                  </Button>
                </div>
                <div className="space-y-3">
                  {insights.training_recommendations.map((rec, i) => (
                    <div key={i} className="p-4 bg-slate-700 rounded-lg border-l-4 border-sky-400">
                      <p className="font-medium text-slate-300 mb-1">{rec.area}</p>
                      <p className="text-sm text-slate-400">{rec.suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trends */}
            {insights.trends && (
              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-2">Performance Trends</h4>
                <p className="text-sm text-slate-400 p-3 bg-slate-700 rounded-lg">{insights.trends}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {showCoachingDialog && insights && (
        <CoachingAssignment
          onClose={() => setShowCoachingDialog(false)}
          evaluations={evaluations}
          prefilledData={{
            agent_email: agentEmail,
            title: `Coaching: ${insights.weaknesses?.[0] || 'Performance Improvement'}`,
            description: insights.training_recommendations?.map(r => `${r.area}: ${r.suggestion}`).join('\n\n') || '',
            weakness_area: insights.weaknesses?.[0] || ''
          }}
        />
      )}
    </Card>
  );
}