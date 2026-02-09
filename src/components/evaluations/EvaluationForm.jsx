import React, { useState, useEffect } from 'react';
import { localDataStore } from '@/api/localDataStore';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Save, Send, X, Loader2 } from 'lucide-react';

export default function EvaluationForm({ evaluation, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    agent_name: '',
    agent_email: '',
    team_id: '',
    scorecard_id: '',
    scores: [],
    reviewer_notes: '',
    evaluation_date: new Date().toISOString().split('T')[0],
    status: 'draft',
    ...evaluation
  });
  
  const [selectedScorecard, setSelectedScorecard] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => localDataStore.entities.Team.list()
  });

  const { data: scorecards = [] } = useQuery({
    queryKey: ['scorecards'],
    queryFn: () => localDataStore.entities.QAScorecard.filter({ status: 'active' })
  });

  useEffect(() => {
    if (formData.scorecard_id) {
      const sc = scorecards.find(s => s.id === formData.scorecard_id);
      setSelectedScorecard(sc);
      if (sc && (!formData.scores || formData.scores.length === 0)) {
        setFormData(prev => ({
          ...prev,
          scores: sc.metrics?.map(m => ({
            metric_name: m.name,
            score: 0,
            max_score: m.max_score || 100,
            weight: m.weight,
            notes: ''
          })) || []
        }));
      }
    }
  }, [formData.scorecard_id, scorecards]);

  const calculateFinalScore = () => {
    if (!formData.scores || formData.scores.length === 0) return 0;
    let totalWeight = 0;
    let weightedSum = 0;
    formData.scores.forEach(s => {
      const pct = (s.score / s.max_score) * 100;
      weightedSum += pct * s.weight;
      totalWeight += s.weight;
    });
    return totalWeight > 0 ? (weightedSum / totalWeight).toFixed(1) : 0;
  };

  const handleScoreChange = (index, value) => {
    const newScores = [...formData.scores];
    newScores[index].score = value[0];
    setFormData({ ...formData, scores: newScores });
  };

  const handleAnalyzeWithAI = async () => {
    setIsAnalyzing(true);
    try {
      const response = await localDataStore.integrations.Core.InvokeLLM({
        prompt: `Analyze this QA evaluation and provide scoring recommendations:
        
Agent: ${formData.agent_name}
Team: ${teams.find(t => t.id === formData.team_id)?.name || 'N/A'}
Reviewer Notes: ${formData.reviewer_notes}
Current Scores: ${JSON.stringify(formData.scores)}

Provide a brief analysis and suggested overall score (0-100) based on the notes and context. Consider accuracy, timeliness, compliance, and customer satisfaction factors.`,
        response_json_schema: {
          type: "object",
          properties: {
            suggested_score: { type: "number" },
            analysis: { type: "string" },
            recommendations: { type: "array", items: { type: "string" } }
          }
        }
      });
      setAiSuggestion(response);
    } catch (error) {
      console.error('AI analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = (status) => {
    const finalScore = parseFloat(calculateFinalScore());
    onSave({
      ...formData,
      final_score: finalScore,
      ai_suggested_score: aiSuggestion?.suggested_score,
      status
    });
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 75) return 'text-amber-600';
    return 'text-rose-600';
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b border-slate-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">
            {evaluation ? 'Edit Evaluation' : 'New QA Evaluation'}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Agent Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Agent Name *</Label>
            <Input
              value={formData.agent_name}
              onChange={e => setFormData({ ...formData, agent_name: e.target.value })}
              placeholder="Enter agent name"
            />
          </div>
          <div className="space-y-2">
            <Label>Agent Email *</Label>
            <Input
              type="email"
              value={formData.agent_email}
              onChange={e => setFormData({ ...formData, agent_email: e.target.value })}
              placeholder="agent@company.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Team *</Label>
            <Select 
              value={formData.team_id} 
              onValueChange={v => setFormData({ ...formData, team_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map(team => (
                  <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Scorecard *</Label>
            <Select 
              value={formData.scorecard_id} 
              onValueChange={v => setFormData({ ...formData, scorecard_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select scorecard" />
              </SelectTrigger>
              <SelectContent>
                {scorecards.map(sc => (
                  <SelectItem key={sc.id} value={sc.id}>{sc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Evaluation Date</Label>
            <Input
              type="date"
              value={formData.evaluation_date}
              onChange={e => setFormData({ ...formData, evaluation_date: e.target.value })}
            />
          </div>
        </div>

        {/* Scoring Section */}
        {selectedScorecard && formData.scores.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Scoring Metrics</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Final Score:</span>
                <Badge className={`text-lg px-3 py-1 ${getScoreColor(calculateFinalScore())}`}>
                  {calculateFinalScore()}%
                </Badge>
              </div>
            </div>
            
            <div className="space-y-6 bg-slate-50 p-4 rounded-xl">
              {formData.scores.map((score, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-slate-900">{score.metric_name}</span>
                      <span className="text-xs text-slate-500 ml-2">(Weight: {(score.weight * 100).toFixed(0)}%)</span>
                    </div>
                    <span className={`font-semibold ${getScoreColor((score.score / score.max_score) * 100)}`}>
                      {score.score} / {score.max_score}
                    </span>
                  </div>
                  <Slider
                    value={[score.score]}
                    onValueChange={(v) => handleScoreChange(index, v)}
                    max={score.max_score}
                    step={1}
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes & AI */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Reviewer Notes</Label>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleAnalyzeWithAI}
              disabled={isAnalyzing || !formData.reviewer_notes}
              className="text-sky-600 border-sky-200 hover:bg-sky-50"
            >
              {isAnalyzing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              AI Analysis
            </Button>
          </div>
          <Textarea
            value={formData.reviewer_notes}
            onChange={e => setFormData({ ...formData, reviewer_notes: e.target.value })}
            placeholder="Enter detailed notes about the evaluation..."
            rows={4}
          />
        </div>

        {/* AI Suggestion */}
        {aiSuggestion && (
          <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span className="font-semibold text-slate-900">AI Analysis</span>
              <Badge className="bg-sky-100 text-sky-700 ml-auto">
                Suggested: {aiSuggestion.suggested_score}%
              </Badge>
            </div>
            <p className="text-sm text-slate-700">{aiSuggestion.analysis}</p>
            {aiSuggestion.recommendations?.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-700">Recommendations:</p>
                <ul className="text-xs text-slate-600 list-disc list-inside">
                  {aiSuggestion.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t border-slate-100 p-4 flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button 
          variant="outline" 
          onClick={() => handleSubmit('draft')}
          className="border-sky-200 text-sky-600 hover:bg-sky-50"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Draft
        </Button>
        <Button 
          onClick={() => handleSubmit('submitted')}
          className="bg-sky-500 hover:bg-sky-600 text-white"
        >
          <Send className="w-4 h-4 mr-2" />
          Submit
        </Button>
      </CardFooter>
    </Card>
  );
}