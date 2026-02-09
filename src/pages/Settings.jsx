import React, { useState, useEffect } from 'react';
import { localDataStore } from '@/api/localDataStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  User, 
  Bell, 
  Shield, 
  Palette,
  Save,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';

export default function Settings() {
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState({
    full_name: '',
    department: '',
    job_title: '',
    phone: ''
  });
  const [notifications, setNotifications] = useState({
    email_alerts: true,
    audit_reminders: true,
    incident_updates: true
  });
  const [saving, setSaving] = useState(false);
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [newAlert, setNewAlert] = useState({
    name: '',
    metric: '',
    condition: 'less_than',
    threshold: 85,
    status: 'active'
  });

  const queryClient = useQueryClient();

  const { data: alertRules = [], isLoading: loadingAlerts } = useQuery({
    queryKey: ['alertRules'],
    queryFn: () => localDataStore.entities.AlertRule.list()
  });

  const createAlertMutation = useMutation({
    mutationFn: (data) => localDataStore.entities.AlertRule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertRules'] });
      setShowAlertForm(false);
      setNewAlert({ name: '', metric: '', condition: 'less_than', threshold: 85, status: 'active' });
    }
  });

  const deleteAlertMutation = useMutation({
    mutationFn: (id) => localDataStore.entities.AlertRule.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alertRules'] })
  });

  const toggleAlertMutation = useMutation({
    mutationFn: ({ id, status }) => localDataStore.entities.AlertRule.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alertRules'] })
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await localDataStore.auth.me();
        setUser(userData);
        setProfileData({
          full_name: userData.full_name || '',
          department: userData.department || '',
          job_title: userData.job_title || '',
          phone: userData.phone || ''
        });
        setNotifications(userData.notification_preferences || {
          email_alerts: true,
          audit_reminders: true,
          incident_updates: true
        });
      } catch (e) {
        console.log('Error loading user');
      }
    };
    loadUser();
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await localDataStore.auth.updateMe({
        ...profileData,
        notification_preferences: notifications
      });
      const updated = await localDataStore.auth.me();
      setUser(updated);
    } catch (e) {
      console.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const getMetricLabel = (metric) => {
    const labels = {
      qa_score: 'QA Score',
      incident_count: 'Incident Count',
      audit_compliance: 'Audit Compliance',
      defect_rate: 'Defect Rate',
      mttr: 'MTTR'
    };
    return labels[metric] || metric;
  };

  const getConditionLabel = (condition) => {
    const labels = {
      less_than: 'Less than',
      greater_than: 'Greater than',
      equals: 'Equals'
    };
    return labels[condition] || condition;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto bg-black min-h-screen">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Alert Rules
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="border-2 border-sky-400 bg-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Profile Information</CardTitle>
              <CardDescription className="text-slate-400">Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={profileData.full_name}
                    onChange={e => setProfileData({ ...profileData, full_name: e.target.value })}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={user?.email || ''}
                    disabled
                    className="bg-slate-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select 
                    value={profileData.department} 
                    onValueChange={v => setProfileData({ ...profileData, department: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Operations">Operations</SelectItem>
                      <SelectItem value="Customer Service">Customer Service</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="Technical Support">Technical Support</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Job Title</Label>
                  <Input
                    value={profileData.job_title}
                    onChange={e => setProfileData({ ...profileData, job_title: e.target.value })}
                    placeholder="Your role"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={profileData.phone}
                    onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <div className="flex items-center gap-2 h-10">
                    <Badge className="capitalize bg-sky-100 text-sky-700">
                      {user?.qa_role || user?.role || 'User'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="border-2 border-sky-400 bg-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Notification Preferences</CardTitle>
              <CardDescription className="text-slate-400">Choose what notifications you receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-700 rounded-xl">
                  <div>
                    <p className="font-medium text-slate-300">Assigned Audits Due Soon</p>
                    <p className="text-sm text-slate-400">Get notified when audits you're assigned to are nearing their due date</p>
                  </div>
                  <Switch
                    checked={notifications.audit_reminders}
                    onCheckedChange={v => setNotifications({ ...notifications, audit_reminders: v })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-700 rounded-xl">
                  <div>
                    <p className="font-medium text-slate-300">Critical Incidents</p>
                    <p className="text-sm text-slate-400">Receive alerts for new critical incidents</p>
                  </div>
                  <Switch
                    checked={notifications.incident_updates}
                    onCheckedChange={v => setNotifications({ ...notifications, incident_updates: v })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-700 rounded-xl">
                  <div>
                    <p className="font-medium text-slate-300">Status Changes</p>
                    <p className="text-sm text-slate-400">Updates on audits and incidents you're involved in</p>
                  </div>
                  <Switch
                    checked={notifications.email_alerts}
                    onCheckedChange={v => setNotifications({ ...notifications, email_alerts: v })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-700 rounded-xl">
                  <div>
                    <p className="font-medium text-slate-300">Email Notifications</p>
                    <p className="text-sm text-slate-400">Also send notifications to your email</p>
                  </div>
                  <Switch
                    checked={notifications.email_alerts}
                    onCheckedChange={v => setNotifications({ ...notifications, email_alerts: v })}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card className="border-2 border-sky-400 bg-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Alert Rules</CardTitle>
                  <CardDescription className="text-slate-400">Configure automatic alerts for QA metrics</CardDescription>
                </div>
                <Button onClick={() => setShowAlertForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Rule
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingAlerts ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : alertRules.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 mb-4">No alert rules configured</p>
                  <Button onClick={() => setShowAlertForm(true)} variant="outline">
                    Create First Rule
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {alertRules.map(rule => (
                    <div key={rule.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${rule.status === 'active' ? 'bg-emerald-100' : 'bg-slate-200'}`}>
                          <AlertTriangle className={`w-4 h-4 ${rule.status === 'active' ? 'text-emerald-600' : 'text-slate-400'}`} />
                        </div>
                        <div>
                          <p className="font-medium text-white">{rule.name}</p>
                          <p className="text-sm text-slate-400">
                            {getMetricLabel(rule.metric)} {getConditionLabel(rule.condition)} {rule.threshold}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.status === 'active'}
                          onCheckedChange={(checked) => 
                            toggleAlertMutation.mutate({ id: rule.id, status: checked ? 'active' : 'paused' })
                          }
                        />
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => deleteAlertMutation.mutate(rule.id)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Alert Dialog */}
      <Dialog open={showAlertForm} onOpenChange={setShowAlertForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Alert Rule</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rule Name</Label>
              <Input
                value={newAlert.name}
                onChange={e => setNewAlert({ ...newAlert, name: e.target.value })}
                placeholder="e.g., Low QA Score Alert"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Metric</Label>
              <Select 
                value={newAlert.metric} 
                onValueChange={v => setNewAlert({ ...newAlert, metric: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="qa_score">QA Score</SelectItem>
                  <SelectItem value="incident_count">Incident Count</SelectItem>
                  <SelectItem value="audit_compliance">Audit Compliance</SelectItem>
                  <SelectItem value="defect_rate">Defect Rate</SelectItem>
                  <SelectItem value="mttr">MTTR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Condition</Label>
                <Select 
                  value={newAlert.condition} 
                  onValueChange={v => setNewAlert({ ...newAlert, condition: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="less_than">Less than</SelectItem>
                    <SelectItem value="greater_than">Greater than</SelectItem>
                    <SelectItem value="equals">Equals</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Threshold</Label>
                <Input
                  type="number"
                  value={newAlert.threshold}
                  onChange={e => setNewAlert({ ...newAlert, threshold: parseFloat(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAlertForm(false)}>Cancel</Button>
            <Button 
              onClick={() => createAlertMutation.mutate(newAlert)}
              disabled={!newAlert.name || !newAlert.metric}
            >
              Create Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}