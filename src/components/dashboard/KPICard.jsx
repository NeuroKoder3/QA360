import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function KPICard({ 
  title, 
  value, 
  subtitle, 
  trend, 
  trendValue, 
  icon: Icon, 
  color = 'indigo',
  className = ''
}) {
  const colorStyles = {
    sky: {
      iconBg: 'bg-sky-50',
      iconColor: 'text-sky-600',
      gradient: 'from-sky-400 to-cyan-500'
    },
    emerald: {
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      gradient: 'from-emerald-500 to-emerald-600'
    },
    amber: {
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      gradient: 'from-amber-500 to-amber-600'
    },
    rose: {
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-600',
      gradient: 'from-rose-500 to-rose-600'
    },
    slate: {
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-700',
      gradient: 'from-slate-400 to-slate-500'
    },
    indigo: {
      iconBg: 'bg-sky-50',
      iconColor: 'text-sky-600',
      gradient: 'from-sky-400 to-cyan-500'
    },
    violet: {
      iconBg: 'bg-sky-50',
      iconColor: 'text-sky-600',
      gradient: 'from-sky-400 to-cyan-500'
    }
  };

  const styles = colorStyles[color] || colorStyles.indigo;

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-3 h-3" />;
    if (trend === 'down') return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-emerald-600 bg-emerald-50';
    if (trend === 'down') return 'text-rose-600 bg-rose-50';
    return 'text-slate-600 bg-slate-50';
  };

  return (
    <Card className={`relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-2 border-sky-400 bg-slate-800 ${className}`}>
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-400 uppercase tracking-wide">{title}</p>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
              {subtitle && (
                <p className="text-sm text-slate-500">{subtitle}</p>
              )}
            </div>
            {trendValue && (
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTrendColor()}`}>
                {getTrendIcon()}
                {trendValue}
              </div>
            )}
          </div>
          <div className={`p-3 rounded-2xl ${styles.iconBg} group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`w-6 h-6 ${styles.iconColor}`} />
          </div>
        </div>
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${styles.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
    </Card>
  );
}