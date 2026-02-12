'use client';

/**
 * Calendar View Component
 * 
 * Monthly calendar showing tasks and goal deadlines.
 */

import { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Circle, 
  CheckCircle2,
  Target,
  Star
} from 'lucide-react';
import type { UserTask, UserGoal } from '@/types/goals';

interface CalendarViewProps {
  tasks: UserTask[];
  goals: UserGoal[];
  onTaskClick: (task: UserTask) => void;
  onDateClick: (date: Date) => void;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: UserTask[];
  goalDeadlines: UserGoal[];
}

export function CalendarView({ tasks, goals, onTaskClick, onDateClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from the Sunday before the first day
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    // End on the Saturday after the last day
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      
      const dayTasks = tasks.filter(t => t.due_date === dateStr);
      const dayGoals = goals.filter(g => g.deadline === dateStr);
      
      days.push({
        date: new Date(current),
        isCurrentMonth: current.getMonth() === month,
        isToday: current.getTime() === today.getTime(),
        tasks: dayTasks,
        goalDeadlines: dayGoals,
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [currentDate, tasks, goals]);

  const monthYear = currentDate.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-stone-600" />
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-stone-600" />
          </button>
        </div>
        
        <h2 className="text-lg font-semibold text-stone-800">{monthYear}</h2>
        
        <button
          onClick={goToToday}
          className="px-3 py-1.5 text-sm text-sage-600 hover:bg-sage-50 rounded-lg transition-colors"
        >
          Today
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-stone-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="py-2 text-center text-xs font-medium text-stone-500">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => (
          <CalendarCell
            key={index}
            day={day}
            onTaskClick={onTaskClick}
            onDateClick={() => onDateClick(day.date)}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-stone-200 flex items-center gap-6 text-xs text-stone-500">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span>Task due</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-sage-500" />
          <span>Task completed</span>
        </div>
        <div className="flex items-center gap-2">
          <Target className="w-3 h-3 text-amber-500" />
          <span>Goal deadline</span>
        </div>
      </div>
    </div>
  );
}

function CalendarCell({ 
  day, 
  onTaskClick, 
  onDateClick 
}: { 
  day: CalendarDay;
  onTaskClick: (task: UserTask) => void;
  onDateClick: () => void;
}) {
  const hasItems = day.tasks.length > 0 || day.goalDeadlines.length > 0;
  const completedTasks = day.tasks.filter(t => t.status === 'completed').length;
  const pendingTasks = day.tasks.filter(t => t.status !== 'completed').length;
  
  return (
    <div
      onClick={onDateClick}
      className={`min-h-[100px] p-2 border-b border-r border-stone-100 cursor-pointer
        hover:bg-stone-50 transition-colors
        ${!day.isCurrentMonth ? 'bg-stone-50/50' : ''}
        ${day.isToday ? 'bg-sage-50/50' : ''}`}
    >
      {/* Date Number */}
      <div className="flex items-center justify-between mb-1">
        <span className={`text-sm font-medium ${
          day.isToday 
            ? 'w-7 h-7 rounded-full bg-sage-500 text-white flex items-center justify-center'
            : day.isCurrentMonth 
            ? 'text-stone-800' 
            : 'text-stone-400'
        }`}>
          {day.date.getDate()}
        </span>
        
        {/* Goal deadline indicator */}
        {day.goalDeadlines.length > 0 && (
          <Target className="w-4 h-4 text-amber-500" />
        )}
      </div>

      {/* Task indicators */}
      <div className="space-y-1">
        {/* Show first 2-3 tasks */}
        {day.tasks.slice(0, 2).map(task => (
          <div
            key={task.id}
            onClick={(e) => { e.stopPropagation(); onTaskClick(task); }}
            className={`text-xs px-1.5 py-0.5 rounded truncate cursor-pointer
              ${task.status === 'completed' 
                ? 'bg-sage-100 text-sage-700 line-through' 
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
          >
            {task.title}
          </div>
        ))}
        
        {/* Goal deadlines */}
        {day.goalDeadlines.slice(0, 1).map(goal => (
          <div
            key={goal.id}
            className="text-xs px-1.5 py-0.5 rounded truncate bg-amber-100 text-amber-700 flex items-center gap-1"
          >
            <Star className="w-3 h-3 flex-shrink-0" />
            {goal.title}
          </div>
        ))}

        {/* Show more indicator */}
        {(day.tasks.length > 2 || (day.tasks.length === 2 && day.goalDeadlines.length > 0)) && (
          <div className="text-xs text-stone-500 px-1">
            +{day.tasks.length - 2 + Math.max(0, day.goalDeadlines.length - 1)} more
          </div>
        )}
      </div>

      {/* Summary dots for mobile */}
      {hasItems && (
        <div className="flex items-center gap-1 mt-1 md:hidden">
          {pendingTasks > 0 && (
            <div className="flex items-center gap-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className="text-[10px] text-stone-500">{pendingTasks}</span>
            </div>
          )}
          {completedTasks > 0 && (
            <div className="flex items-center gap-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-sage-500" />
              <span className="text-[10px] text-stone-500">{completedTasks}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CalendarView;
