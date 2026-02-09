import React, { useState } from 'react';
import { localDataStore } from '@/api/localDataStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2, BookOpen } from 'lucide-react';

export default function CoachingRequest({ onClose, userEmail }) {
  const [formData, setFormData] = useState({
    title: '',
    topic: '',
    description: '',
    urgency: 'medium'
  });
  const [generatingMaterials, setGeneratingMaterials] = useState(false);
  const [suggestedMaterials, setSuggestedMaterials] = useState([]);

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => localDataStore.entities.Coaching.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaching'] });
      onClose();
    }
  });

  const handleGenerateMaterials = async () => {
    if (!formData.topic && !formData.description) {
      alert('Please specify a topic or description first');
      return;
    }

    setGeneratingMaterials(true);
    try {
      const response = await localDataStore.integrations.Core.InvokeLLM({
        prompt: `An agent is requesting coaching on the following topic:
        
        Topic: ${formData.topic || 'Not specified'}
        Description: ${formData.description || 'Not specified'}
        
        Generate 4-5 relevant training materials that would help with this topic.
        Include specific, real resources (videos, articles, courses, documents).
        Provide actual URLs to accessible resources.
        
        For each resource:
        1. Clear, descriptive title
        2. URL (real, accessible URLs)
        3. Type (video, article, course, or document)`,
        response_json_schema: {
          type: "object",
          properties: {
            materials: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  url: { type: "string" },
                  type: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (response.materials && response.materials.length > 0) {
        setSuggestedMaterials(response.materials);
      }
    } catch (error) {
      console.error('Failed to generate materials:', error);
      alert('Failed to generate training materials. Please try again.');
    } finally {
      setGeneratingMaterials(false);
    }
  };

  const handleSubmit = () => {
    createMutation.mutate({
      agent_email: userEmail,
      assigned_by: userEmail,
      title: formData.title || `Self-Request: ${formData.topic}`,
      description: formData.description,
      weakness_area: formData.topic,
      priority: formData.urgency,
      status: 'assigned',
      training_materials: suggestedMaterials
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-sky-500" />
            Request Coaching
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>What would you like to improve?</Label>
            <Input
              value={formData.topic}
              onChange={e => setFormData({ ...formData, topic: e.target.value })}
              placeholder="e.g., Customer Communication, Technical Skills, Time Management"
            />
          </div>

          <div className="space-y-2">
            <Label>Title (Optional)</Label>
            <Input
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="Brief title for this request"
            />
          </div>

          <div className="space-y-2">
            <Label>Describe your learning goals</Label>
            <Textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="What specifically do you want to learn or improve? What challenges are you facing?"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Urgency</Label>
            <Select value={formData.urgency} onValueChange={v => setFormData({ ...formData, urgency: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low - Nice to have</SelectItem>
                <SelectItem value="medium">Medium - Helpful soon</SelectItem>
                <SelectItem value="high">High - Need urgently</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <Label>AI-Suggested Training Materials</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateMaterials}
                disabled={generatingMaterials}
              >
                {generatingMaterials ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Get AI Suggestions
                  </>
                )}
              </Button>
            </div>

            {suggestedMaterials.length > 0 ? (
              <div className="space-y-2">
                {suggestedMaterials.map((material, index) => (
                  <div key={index} className="p-3 bg-slate-100 rounded-lg">
                    <p className="font-medium text-sm">{material.title}</p>
                    <p className="text-xs text-slate-500 truncate">{material.url}</p>
                    <span className="text-xs text-sky-600 capitalize">{material.type}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">
                Click "Get AI Suggestions" to receive personalized training materials
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.topic && !formData.description}
            className="bg-sky-500 hover:bg-sky-600"
          >
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}