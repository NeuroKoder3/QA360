import React, { useState } from 'react';
import { localDataStore } from '@/api/localDataStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Sparkles, Loader2 } from 'lucide-react';

export default function CoachingAssignment({ onClose, evaluations, prefilledData }) {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    agent_email: prefilledData?.agent_email || '',
    title: prefilledData?.title || '',
    description: prefilledData?.description || '',
    weakness_area: prefilledData?.weakness_area || '',
    priority: 'medium',
    due_date: '',
    training_materials: prefilledData?.training_materials || []
  });
  const [newMaterial, setNewMaterial] = useState({ title: '', url: '', type: 'article' });
  const [generatingMaterials, setGeneratingMaterials] = useState(false);

  const queryClient = useQueryClient();

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await localDataStore.auth.me();
        setUser(userData);
      } catch (e) {
        console.log('User not loaded');
      }
    };
    loadUser();
  }, []);

  const createMutation = useMutation({
    mutationFn: (data) => localDataStore.entities.Coaching.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaching'] });
      onClose();
    }
  });

  const handleAddMaterial = () => {
    if (newMaterial.title && newMaterial.url) {
      setFormData({
        ...formData,
        training_materials: [...formData.training_materials, newMaterial]
      });
      setNewMaterial({ title: '', url: '', type: 'article' });
    }
  };

  const handleRemoveMaterial = (index) => {
    setFormData({
      ...formData,
      training_materials: formData.training_materials.filter((_, i) => i !== index)
    });
  };

  const handleGenerateMaterials = async () => {
    if (!formData.weakness_area && !formData.description) {
      alert('Please specify a weakness area or description first');
      return;
    }

    setGeneratingMaterials(true);
    try {
      const response = await localDataStore.integrations.Core.InvokeLLM({
        prompt: `Generate 4-5 relevant training materials for an agent with the following weakness:
        
        Weakness Area: ${formData.weakness_area || 'Not specified'}
        Description: ${formData.description || 'Not specified'}
        
        Please suggest specific, real training resources (videos, articles, courses, documents) that would help address this weakness. 
        Include actual URLs to real resources when possible (e.g., YouTube videos, LinkedIn Learning courses, industry articles).
        
        For each resource provide:
        1. A clear, descriptive title
        2. The URL (use real, accessible URLs)
        3. The type (video, article, course, or document)
        
        Focus on practical, actionable training materials.`,
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
        setFormData({
          ...formData,
          training_materials: response.materials
        });
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
      ...formData,
      assigned_by: user?.email
    });
  };

  // Get unique agents from evaluations
  const uniqueAgents = [...new Set(evaluations.map(e => e.agent_email))];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Coaching Task</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Agent Email</Label>
              <Select value={formData.agent_email} onValueChange={v => setFormData({ ...formData, agent_email: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select agent" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueAgents.map(email => (
                    <SelectItem key={email} value={email}>{email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={formData.priority} onValueChange={v => setFormData({ ...formData, priority: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Improve Customer Empathy Skills"
            />
          </div>

          <div className="space-y-2">
            <Label>Weakness Area (AI Identified)</Label>
            <Input
              value={formData.weakness_area}
              onChange={e => setFormData({ ...formData, weakness_area: e.target.value })}
              placeholder="e.g., Communication, Technical Knowledge"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed coaching objectives and expectations..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Due Date</Label>
            <Input
              type="date"
              value={formData.due_date}
              onChange={e => setFormData({ ...formData, due_date: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Training Materials</Label>
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
                    AI Suggest Materials
                  </>
                )}
              </Button>
            </div>
            
            {formData.training_materials.map((material, index) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-slate-100 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-sm">{material.title}</p>
                  <p className="text-xs text-slate-500">{material.url}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleRemoveMaterial(index)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}

            <div className="grid grid-cols-12 gap-2">
              <Input
                className="col-span-5"
                placeholder="Material title"
                value={newMaterial.title}
                onChange={e => setNewMaterial({ ...newMaterial, title: e.target.value })}
              />
              <Input
                className="col-span-5"
                placeholder="URL"
                value={newMaterial.url}
                onChange={e => setNewMaterial({ ...newMaterial, url: e.target.value })}
              />
              <Select
                value={newMaterial.type}
                onValueChange={v => setNewMaterial({ ...newMaterial, type: v })}
              >
                <SelectTrigger className="col-span-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="course">Course</SelectItem>
                  <SelectItem value="article">Article</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={handleAddMaterial} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Material
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.agent_email || !formData.title || !formData.description}
            className="bg-sky-500 hover:bg-sky-600"
          >
            Assign Coaching
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}