import React, { useState } from 'react';
import { localDataStore } from '@/api/localDataStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export default function AuditAssignment({ audit, onClose }) {
  const [assignedTo, setAssignedTo] = useState(audit?.assigned_to || '');
  const [teamId, setTeamId] = useState(audit?.team_id || '');
  const [scheduledDate, setScheduledDate] = useState(audit?.scheduled_date || '');
  const [dueDate, setDueDate] = useState(audit?.due_date || '');
  const [priority, setPriority] = useState(audit?.priority || 'medium');

  const queryClient = useQueryClient();

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => localDataStore.entities.Team.list()
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => localDataStore.entities.Audit.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      onClose();
    }
  });

  const handleAssign = () => {
    updateMutation.mutate({
      id: audit.id,
      data: {
        ...audit,
        assigned_to: assignedTo,
        team_id: teamId,
        scheduled_date: scheduledDate,
        due_date: dueDate,
        priority,
        status: 'scheduled'
      }
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Audit</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Auditor Email</Label>
            <Input
              type="email"
              value={assignedTo}
              onChange={e => setAssignedTo(e.target.value)}
              placeholder="auditor@company.com"
            />
          </div>

          <div className="space-y-2">
            <Label>Team</Label>
            <Select value={teamId} onValueChange={setTeamId}>
              <SelectTrigger>
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map(team => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name} - {team.department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Scheduled Date</Label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={e => setScheduledDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
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

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleAssign}
            disabled={!assignedTo || !teamId || !dueDate}
            className="bg-sky-500 hover:bg-sky-600"
          >
            Assign Audit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}