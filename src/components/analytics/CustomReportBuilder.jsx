import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, FileDown, FileText, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";

export default function CustomReportBuilder({ onGenerate, onExport }) {
  const [reportName, setReportName] = useState('');
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [selectedMetrics, setSelectedMetrics] = useState({
    qaScores: true,
    incidents: true,
    audits: false,
    teams: false,
    trends: false,
  });
  const [groupBy, setGroupBy] = useState('date');
  const [exportFormat, setExportFormat] = useState('csv');

  const metrics = [
    { id: 'qaScores', label: 'QA Scores & Evaluations' },
    { id: 'incidents', label: 'Incident Data' },
    { id: 'audits', label: 'Audit Results' },
    { id: 'teams', label: 'Team Performance' },
    { id: 'trends', label: 'Trend Analysis' },
  ];

  const handleGenerateReport = () => {
    const reportConfig = {
      name: reportName || 'Custom Report',
      dateRange,
      metrics: selectedMetrics,
      groupBy,
    };
    onGenerate(reportConfig);
  };

  const handleExport = (format) => {
    const reportConfig = {
      name: reportName || 'Custom Report',
      dateRange,
      metrics: selectedMetrics,
      groupBy,
      format,
    };
    onExport(reportConfig);
  };

  return (
    <Card className="border-2 border-sky-400 bg-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Custom Report Builder</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Report Name */}
        <div className="space-y-2">
          <Label className="text-slate-300">Report Name</Label>
          <Input
            placeholder="Enter report name..."
            value={reportName}
            onChange={(e) => setReportName(e.target.value)}
            className="bg-slate-900 border-slate-600 text-white"
          />
        </div>

        {/* Date Range */}
        <div className="space-y-2">
          <Label className="text-slate-300">Date Range</Label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left bg-slate-900 border-slate-600 text-white hover:bg-slate-700">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? format(dateRange.from, 'PPP') : 'From date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-slate-800 border-sky-400">
                <Calendar
                  mode="single"
                  selected={dateRange.from}
                  onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left bg-slate-900 border-slate-600 text-white hover:bg-slate-700">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.to ? format(dateRange.to, 'PPP') : 'To date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-slate-800 border-sky-400">
                <Calendar
                  mode="single"
                  selected={dateRange.to}
                  onSelect={(date) => setDateRange({ ...dateRange, to: date })}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Metrics Selection */}
        <div className="space-y-3">
          <Label className="text-slate-300">Include Metrics</Label>
          <div className="space-y-2">
            {metrics.map((metric) => (
              <div key={metric.id} className="flex items-center space-x-2">
                <Checkbox
                  id={metric.id}
                  checked={selectedMetrics[metric.id]}
                  onCheckedChange={(checked) =>
                    setSelectedMetrics({ ...selectedMetrics, [metric.id]: checked })
                  }
                />
                <Label htmlFor={metric.id} className="text-slate-300 cursor-pointer">
                  {metric.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Group By */}
        <div className="space-y-2">
          <Label className="text-slate-300">Group By</Label>
          <Select value={groupBy} onValueChange={setGroupBy}>
            <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-sky-400">
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="team">Team</SelectItem>
              <SelectItem value="department">Department</SelectItem>
              <SelectItem value="agent">Agent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-700">
          <Button
            onClick={handleGenerateReport}
            className="flex-1 bg-sky-600 hover:bg-sky-700"
          >
            <FileText className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
          <div className="flex gap-2 flex-1">
            <Button
              onClick={() => handleExport('csv')}
              variant="outline"
              className="flex-1 bg-slate-900 border-slate-600 text-white hover:bg-slate-700"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button
              onClick={() => handleExport('pdf')}
              variant="outline"
              className="flex-1 bg-slate-900 border-slate-600 text-white hover:bg-slate-700"
            >
              <FileDown className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}