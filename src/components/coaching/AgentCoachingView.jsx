import React, { useState } from 'react';
import { localDataStore } from '@/api/localDataStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CheckCircle, Clock, PlayCircle, ExternalLink, MessageSquare, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function AgentCoachingView({ coaching, isManager }) {
  const [selectedCoaching, setSelectedCoaching] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [progress, setProgress] = useState(0);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => localDataStore.entities.Coaching.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaching'] });
      setSelectedCoaching(null);
    }
  });

  const handleMarkInProgress = (coaching) => {
    updateMutation.mutate({
      id: coaching.id,
      data: { ...coaching, status: 'in_progress' }
    });
  };

  const handleUpdateProgress = (coaching) => {
    updateMutation.mutate({
      id: coaching.id,
      data: { ...coaching, progress }
    });
    setSelectedCoaching(null);
  };

  const handleComplete = (coaching) => {
    updateMutation.mutate({
      id: coaching.id,
      data: {
        ...coaching,
        status: 'completed',
        progress: 100,
        completion_date: new Date().toISOString(),
        agent_feedback: feedback
      }
    });
    setFeedback('');
    setSelectedCoaching(null);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-rose-100 text-rose-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'reviewed':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'in_progress':
        return <PlayCircle className="w-5 h-5 text-amber-400" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {coaching.length === 0 ? (
        <Card className="p-12 text-center bg-slate-800">
          <p className="text-slate-400">No coaching assignments</p>
        </Card>
      ) : (
        coaching.map(item => (
          <Card key={item.id} className="border-2 border-sky-400 bg-slate-800">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {getStatusIcon(item.status)}
                  <div className="flex-1">
                    <CardTitle className="text-slate-300 mb-2">{item.title}</CardTitle>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge className={getPriorityColor(item.priority)}>{item.priority} priority</Badge>
                      <Badge variant="outline">{item.status}</Badge>
                      {item.weakness_area && (
                        <Badge className="bg-sky-100 text-sky-700">{item.weakness_area}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-400">{item.description}</p>
                  </div>
                </div>
                {!isManager && (
                  <div className="flex gap-2">
                    {item.status === 'assigned' && (
                      <Button size="sm" onClick={() => handleMarkInProgress(item)}>
                        Start
                      </Button>
                    )}
                    {item.status === 'in_progress' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedCoaching(item);
                            setProgress(item.progress || 0);
                          }}
                        >
                          Update Progress
                        </Button>
                        <Button
                          size="sm"
                          className="bg-emerald-500 hover:bg-emerald-600"
                          onClick={() => {
                            setSelectedCoaching(item);
                            setFeedback(item.agent_feedback || '');
                          }}
                        >
                          Complete
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {item.due_date && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Calendar className="w-4 h-4" />
                  Due: {format(new Date(item.due_date), 'MMM d, yyyy')}
                </div>
              )}

              {(item.progress > 0 || item.status === 'completed') && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">Progress</span>
                    <span className="text-slate-300 font-medium">{item.progress || 0}%</span>
                  </div>
                  <Progress value={item.progress || 0} className="h-2" />
                </div>
              )}

              {item.training_materials && item.training_materials.length > 0 && (
                <div>
                  <Label className="text-slate-300 mb-2 block">Training Materials</Label>
                  <div className="space-y-2">
                    {item.training_materials.map((material, index) => (
                      <a
                        key={index}
                        href={material.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-slate-300">{material.title}</p>
                          <Badge variant="outline" className="mt-1">{material.type}</Badge>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {item.agent_feedback && (
                <div className="p-3 bg-slate-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-sky-400" />
                    <Label className="text-slate-300">Agent Feedback</Label>
                  </div>
                  <p className="text-sm text-slate-400">{item.agent_feedback}</p>
                </div>
              )}

              {item.manager_notes && (
                <div className="p-3 bg-slate-700 rounded-lg">
                  <Label className="text-slate-300 mb-2 block">Manager Notes</Label>
                  <p className="text-sm text-slate-400">{item.manager_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}

      {/* Progress Update Dialog */}
      {selectedCoaching && !feedback && (
        <Dialog open={true} onOpenChange={() => setSelectedCoaching(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Progress</DialogTitle>
            </DialogHeader>
            <div className="py-6">
              <Label className="mb-4 block">Current Progress: {progress}%</Label>
              <Slider
                value={[progress]}
                onValueChange={(v) => setProgress(v[0])}
                max={100}
                step={5}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedCoaching(null)}>Cancel</Button>
              <Button onClick={() => handleUpdateProgress(selectedCoaching)}>
                Update Progress
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Completion Dialog */}
      {selectedCoaching && feedback !== undefined && (
        <Dialog open={true} onOpenChange={() => {
          setSelectedCoaching(null);
          setFeedback('');
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Complete Coaching Task</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Label className="mb-2 block">Your Feedback</Label>
              <Textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder="Share your thoughts on the training materials and what you learned..."
                rows={5}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setSelectedCoaching(null);
                setFeedback('');
              }}>
                Cancel
              </Button>
              <Button
                onClick={() => handleComplete(selectedCoaching)}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                Mark as Complete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}