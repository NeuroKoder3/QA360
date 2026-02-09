import React, { useState } from 'react';
import { localDataStore } from '@/api/localDataStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Calendar, Clock, Mail, Plus, Trash2, Pause, Play } from 'lucide-react';
import { format } from 'date-fns';

export default function ReportScheduler() {
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    report_type: '',
    frequency: 'weekly',
    recipients: '',
    format: 'pdf',
    config: {},
    status: 'active'
  });

  const queryClient = useQueryClient();

  const { data: schedules = [] } = useQuery({
    queryKey: ['report-schedules'],
    queryFn: () => localDataStore.entities.ReportSchedule.list('-created_date', 100)
  });

  const createMutation = useMutation({
    mutationFn: (data) => localDataStore.entities.ReportSchedule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-schedules'] });
      setShowDialog(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => localDataStore.entities.ReportSchedule.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['report-schedules'] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => localDataStore.entities.ReportSchedule.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['report-schedules'] })
  });

  const resetForm = () => {
    setFormData({
      name: '',
      report_type: '',
      frequency: 'weekly',
      recipients: '',
      format: 'pdf',
      config: {},
      status: 'active'
    });
  };

  const handleSave = () => {
    const recipientsArray = formData.recipients.split(',').map(e => e.trim()).filter(Boolean);
    createMutation.mutate({ ...formData, recipients: recipientsArray });
  };

  const toggleStatus = (schedule) => {
    const newStatus = schedule.status === 'active' ? 'paused' : 'active';
    updateMutation.mutate({ id: schedule.id, data: { ...schedule, status: newStatus } });
  };

  const getFrequencyBadge = (frequency) => {
    const colors = {
      daily: 'bg-emerald-100 text-emerald-700',
      weekly: 'bg-sky-100 text-sky-700',
      monthly: 'bg-violet-100 text-violet-700',
      quarterly: 'bg-amber-100 text-amber-700'
    };
    return <Badge className={colors[frequency]}>{frequency}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-300">Scheduled Reports</h3>
        <Button onClick={() => setShowDialog(true)} className="bg-sky-500 hover:bg-sky-600">
          <Plus className="w-4 h-4 mr-2" />
          Schedule Report
        </Button>
      </div>

      <div className="grid gap-4">
        {schedules.map((schedule) => (
          <Card key={schedule.id} className="border-2 border-sky-400 bg-slate-800">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium text-slate-300">{schedule.name}</h4>
                    {getFrequencyBadge(schedule.frequency)}
                    <Badge variant={schedule.status === 'active' ? 'default' : 'secondary'}>
                      {schedule.status}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {schedule.recipients?.join(', ')}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {schedule.last_run ? `Last run: ${format(new Date(schedule.last_run), 'MMM d, yyyy')}` : 'Never run'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleStatus(schedule)}
                  >
                    {schedule.status === 'active' ? (
                      <Pause className="w-4 h-4 text-slate-400" />
                    ) : (
                      <Play className="w-4 h-4 text-emerald-500" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(schedule.id)}
                  >
                    <Trash2 className="w-4 h-4 text-rose-500" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {schedules.length === 0 && (
          <Card className="p-8 text-center bg-slate-800">
            <Clock className="w-12 h-12 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-400">No scheduled reports</p>
          </Card>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule New Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Report Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Weekly Performance Summary"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={formData.frequency} onValueChange={(v) => setFormData({ ...formData, frequency: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Format</Label>
                <Select value={formData.format} onValueChange={(v) => setFormData({ ...formData, format: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Input
                value={formData.report_type}
                onChange={(e) => setFormData({ ...formData, report_type: e.target.value })}
                placeholder="Quality Metrics Summary"
              />
            </div>
            <div className="space-y-2">
              <Label>Recipients (comma-separated emails)</Label>
              <Input
                value={formData.recipients}
                onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                placeholder="user1@example.com, user2@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-sky-500 hover:bg-sky-600">
              Schedule Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}