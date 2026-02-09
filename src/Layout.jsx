import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { localDataStore } from '@/api/localDataStore';
import {
  LayoutDashboard,
  ClipboardCheck,
  AlertTriangle,
  FileSearch,
  BarChart3,
  Settings,
  Users,
  Bell,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Shield,
  Target,
  Layers,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import NotificationBell from '@/components/notifications/NotificationBell';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
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

  const navigation = [
    { name: 'Dashboard', page: 'Dashboard', icon: LayoutDashboard },
    { name: 'Evaluations', page: 'Evaluations', icon: ClipboardCheck },
    { name: 'Incidents', page: 'Incidents', icon: AlertTriangle },
    { name: 'Audits', page: 'Audits', icon: FileSearch },
    { name: 'Analytics', page: 'Analytics', icon: BarChart3 },
    { name: 'Team Performance', page: 'TeamPerformance', icon: Layers },
    { name: 'Coaching', page: 'Coaching', icon: BookOpen },
    { name: 'Scorecards', page: 'Scorecards', icon: Target },
    { name: 'Teams', page: 'Teams', icon: Users },
    { name: 'Settings', page: 'Settings', icon: Settings },
  ];

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-black">
      <style>{`
        :root {
          --primary: 0 0% 0%;
          --primary-foreground: 210 40% 98%;
          --accent: 200 18% 46%;
          --accent-foreground: 0 0% 0%;
          --light-blue: 199 89% 48%;
          --light-grey: 210 16% 93%;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-72 bg-slate-900 border-r border-sky-400
        transform transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500 shadow-lg shadow-sky-200">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">QA360</h1>
              <p className="text-xs text-slate-400 font-medium">Quality Operations</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="ml-auto lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.page)}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                    transition-all duration-200
                    ${isActive 
                      ? 'bg-sky-400/20 text-sky-400 shadow-sm' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }
                  `}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
                  {item.name}
                  {item.name === 'Incidents' && (
                    <Badge className="ml-auto bg-rose-100 text-rose-700 hover:bg-rose-100 px-2 py-0.5 text-xs">
                      3
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          {user && (
            <div className="p-4 border-t border-slate-700">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-slate-800 transition-colors">
                    <Avatar className="w-10 h-10 border-2 border-slate-100">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-sky-400 to-cyan-500 text-white text-sm font-medium">
                        {getInitials(user.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-white truncate">{user.full_name}</p>
                      <p className="text-xs text-slate-400 capitalize">{user.qa_role || user.role}</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('Settings')} className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => localDataStore.auth.logout()}
                    className="text-rose-600 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-black border-b border-slate-700">
          <div className="flex items-center justify-between px-4 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden bg-slate-700 hover:bg-slate-600"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5 text-slate-300" />
              </Button>
              <div>
                <h2 className="text-lg font-semibold text-white">{currentPageName}</h2>
                <p className="text-sm text-slate-400 hidden sm:block">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <NotificationBell />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8 animate-fadeIn bg-black">
          {children}
        </main>
      </div>
    </div>
  );
}