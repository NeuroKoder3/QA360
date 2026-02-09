import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function DashboardCustomizer({ widgets, onSave }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedWidgets, setSelectedWidgets] = useState(
    widgets.reduce((acc, widget) => ({ ...acc, [widget.id]: widget.visible }), {})
  );
  const [widgetOrder, setWidgetOrder] = useState(widgets.map(w => w.id));

  const availableWidgets = [
    { id: 'kpiSummary', label: 'KPI Summary Cards', description: 'Overview metrics' },
    { id: 'qaScoreTrend', label: 'QA Score Trend', description: 'Timeline chart' },
    { id: 'activityVolume', label: 'Activity Volume', description: 'Bar chart' },
    { id: 'teamPerformance', label: 'Team Performance', description: 'Comparison chart' },
    { id: 'incidentsByCategory', label: 'Incidents by Category', description: 'Pie chart' },
    { id: 'severityDistribution', label: 'Severity Distribution', description: 'Pie chart' },
    { id: 'scoreDistribution', label: 'Score Distribution', description: 'Bar chart' },
  ];

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(widgetOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setWidgetOrder(items);
  };

  const handleSave = () => {
    const config = widgetOrder.map(id => ({
      id,
      visible: selectedWidgets[id] || false,
    }));
    onSave(config);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-slate-900 border-slate-600 text-white hover:bg-slate-700">
          <Settings className="w-4 h-4 mr-2" />
          Customize Dashboard
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-slate-800 border-sky-400 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Customize Your Dashboard</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          <p className="text-sm text-slate-400">
            Select and reorder the widgets you want to display on your analytics dashboard.
          </p>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="widgets">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                  {widgetOrder.map((widgetId, index) => {
                    const widget = availableWidgets.find(w => w.id === widgetId);
                    if (!widget) return null;

                    return (
                      <Draggable key={widget.id} draggableId={widget.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
                              snapshot.isDragging
                                ? 'border-sky-400 bg-slate-700'
                                : 'border-slate-600 bg-slate-900'
                            }`}
                          >
                            <div {...provided.dragHandleProps}>
                              <GripVertical className="w-5 h-5 text-slate-500" />
                            </div>
                            <Checkbox
                              id={widget.id}
                              checked={selectedWidgets[widget.id]}
                              onCheckedChange={(checked) =>
                                setSelectedWidgets({ ...selectedWidgets, [widget.id]: checked })
                              }
                            />
                            <div className="flex-1">
                              <Label htmlFor={widget.id} className="text-white cursor-pointer font-medium">
                                {widget.label}
                              </Label>
                              <p className="text-xs text-slate-400">{widget.description}</p>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
          <Button variant="outline" onClick={() => setIsOpen(false)} className="bg-slate-900 border-slate-600 text-white">
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-sky-600 hover:bg-sky-700">
            Save Layout
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}