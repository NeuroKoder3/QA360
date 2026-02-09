import React, { useState } from 'react';
import { localDataStore } from '@/api/localDataStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Plus, Users, User, HandHeart } from 'lucide-react';
import CoachingAssignment from '@/components/coaching/CoachingAssignment';
import CoachingRequest from '@/components/coaching/CoachingRequest';
import AgentCoachingView from '@/components/coaching/AgentCoachingView';

export default function Coaching() {
  const [user, setUser] = useState(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
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

  const { data: allCoaching = [] } = useQuery({
    queryKey: ['coaching'],
    queryFn: () => localDataStore.entities.Coaching.list('-created_date', 500)
  });

  const { data: evaluations = [] } = useQuery({
    queryKey: ['evaluations'],
    queryFn: () => localDataStore.entities.QAEvaluation.list('-created_date', 500)
  });

  const isManager = user?.role === 'admin' || user?.qa_role === 'manager';

  const myCoaching = allCoaching.filter(c => c.agent_email === user?.email);
  const assignedByMe = allCoaching.filter(c => c.assigned_by === user?.email);

  // Get unique agents for coaching stats
  const agentStats = allCoaching.reduce((acc, coaching) => {
    const agent = coaching.agent_email;
    if (!acc[agent]) {
      acc[agent] = {
        email: agent,
        total: 0,
        completed: 0,
        inProgress: 0,
        assigned: 0
      };
    }
    acc[agent].total++;
    if (coaching.status === 'completed' || coaching.status === 'reviewed') acc[agent].completed++;
    if (coaching.status === 'in_progress') acc[agent].inProgress++;
    if (coaching.status === 'assigned') acc[agent].assigned++;
    return acc;
  }, {});

  return (
    <div className="space-y-6 bg-black min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-sky-400" />
            Coaching & Development
          </h1>
          <p className="text-slate-400">AI-powered coaching assignments and progress tracking</p>
        </div>
        <div className="flex gap-3">
          {isManager && (
            <Button onClick={() => setShowAssignDialog(true)} className="bg-sky-500 hover:bg-sky-600">
              <Plus className="w-4 h-4 mr-2" />
              Assign Coaching
            </Button>
          )}
          <Button onClick={() => setShowRequestDialog(true)} variant="outline">
            <HandHeart className="w-4 h-4 mr-2" />
            Request Coaching
          </Button>
        </div>
      </div>

      <Tabs defaultValue={isManager ? "overview" : "mycoaching"}>
        <TabsList className="bg-slate-800">
          {isManager && (
            <>
              <TabsTrigger value="overview" className="text-slate-300">
                <Users className="w-4 h-4 mr-2" />
                Team Overview
              </TabsTrigger>
              <TabsTrigger value="assigned" className="text-slate-300">
                Assigned by Me ({assignedByMe.length})
              </TabsTrigger>
            </>
          )}
          <TabsTrigger value="mycoaching" className="text-slate-300">
            <User className="w-4 h-4 mr-2" />
            My Coaching ({myCoaching.length})
          </TabsTrigger>
        </TabsList>

        {isManager && (
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-2 border-sky-400 bg-slate-800">
                <CardContent className="p-6">
                  <p className="text-3xl font-bold text-white">{allCoaching.length}</p>
                  <p className="text-slate-400">Total Assignments</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800">
                <CardContent className="p-6">
                  <p className="text-3xl font-bold text-emerald-400">
                    {allCoaching.filter(c => c.status === 'completed' || c.status === 'reviewed').length}
                  </p>
                  <p className="text-slate-400">Completed</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800">
                <CardContent className="p-6">
                  <p className="text-3xl font-bold text-amber-400">
                    {allCoaching.filter(c => c.status === 'in_progress').length}
                  </p>
                  <p className="text-slate-400">In Progress</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-2 border-sky-400 bg-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-300">Agent Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.values(agentStats).map(agent => (
                    <div key={agent.email} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-300">{agent.email}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge className="bg-emerald-100 text-emerald-700">
                            {agent.completed} completed
                          </Badge>
                          <Badge className="bg-amber-100 text-amber-700">
                            {agent.inProgress} in progress
                          </Badge>
                          <Badge className="bg-slate-100 text-slate-700">
                            {agent.assigned} assigned
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-sky-400">
                          {agent.total > 0 ? Math.round((agent.completed / agent.total) * 100) : 0}%
                        </p>
                        <p className="text-xs text-slate-400">completion rate</p>
                      </div>
                    </div>
                  ))}
                  {Object.keys(agentStats).length === 0 && (
                    <p className="text-center text-slate-400 py-8">No coaching assignments yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {isManager && (
          <TabsContent value="assigned">
            <AgentCoachingView 
              coaching={assignedByMe} 
              isManager={true}
              evaluations={evaluations}
            />
          </TabsContent>
        )}

        <TabsContent value="mycoaching">
          <AgentCoachingView 
            coaching={myCoaching} 
            isManager={false}
            evaluations={evaluations}
          />
        </TabsContent>
      </Tabs>

      {showAssignDialog && (
        <CoachingAssignment
          onClose={() => setShowAssignDialog(false)}
          evaluations={evaluations}
        />
      )}

      {showRequestDialog && user && (
        <CoachingRequest
          onClose={() => setShowRequestDialog(false)}
          userEmail={user.email}
        />
      )}
    </div>
  );
}