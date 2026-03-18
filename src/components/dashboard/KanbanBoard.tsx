'use client';

/**
 * Kanban Dashboard Component
 * 
 * Default dashboard view showing tasks in To Do / In Progress / Done columns.
 * Supports drag-and-drop, mobile swipe, and responsive design.
 */

import { useState, useCallback } from 'react';
import { 
  Circle, 
  Clock, 
  CheckCircle2, 
  Target, 
  Calendar,
  ChevronRight,
  Plus,
  MoreHorizontal,
  GripVertical
} from 'lucide-react';
import type { UserTask, UserGoal, TaskStatus, KanbanColumn } from '@/types/goals';

interface KanbanBoardProps {
  tasks: UserTask[];
  goals: UserGoal[];
  onTaskStatusChange: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  onTaskClick: (task: UserTask) => void;
  onAddTask: (goalId?: string) => void;
}

const COLUMNS: { id: TaskStatus; title: string; color: string; icon: React.ReactNode }[] = [
  { 
    id: 'pending', 
    title: 'To Do', 
    color: 'bg-stone-100 border-stone-200',
    icon: <Circle className="w-4 h-4 text-stone-400" />
  },
  { 
    id: 'in_progress', 
    title: 'In Progress', 
    color: 'bg-blue-50 border-blue-200',
    icon: <Clock className="w-4 h-4 text-blue-500" />
  },
  { 
    id: 'completed', 
    title: 'Done', 
    color: 'bg-sage-50 border-sage-200',
    icon: <CheckCircle2 className="w-4 h-4 text-sage-600" />
  },
];

function TaskCard({ 
  task, 
  goal, 
  onClick,
  isDragging = false 
}: { 
  task: UserTask; 
  goal?: UserGoal;
  onClick: () => void;
  isDragging?: boolean;
}) {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';
  const isDueSoon = task.due_date && !isOverdue && 
    new Date(task.due_date) <= new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg border border-stone-200 p-3 cursor-pointer
        hover:shadow-md transition-all group
        ${isDragging ? 'shadow-lg rotate-2 opacity-90' : ''}
        ${isOverdue ? 'border-l-4 border-l-red-400' : ''}
        ${isDueSoon && !isOverdue ? 'border-l-4 border-l-amber-400' : ''}`}
    >
      {/* Drag Handle */}
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab flex-shrink-0 mt-0.5" />
        
        <div className="flex-1 min-w-0">
          {/* Task Title */}
          <p className={`text-sm font-medium text-stone-800 ${
            task.status === 'completed' ? 'line-through text-stone-400' : ''
          }`}>
            {task.title}
          </p>

          {/* Goal Badge */}
          {goal && (
            <div className="flex items-center gap-1 mt-1.5">
              <Target className="w-3 h-3 text-sage-500" />
              <span className="text-xs text-stone-500 truncate">{goal.title}</span>
            </div>
          )}

          {/* Due Date */}
          {task.due_date && (
            <div className={`flex items-center gap-1 mt-1.5 text-xs ${
              isOverdue 
                ? 'text-red-600 font-medium' 
                : isDueSoon 
                ? 'text-amber-600' 
                : 'text-stone-400'
            }`}>
              <Calendar className="w-3 h-3" />
              <span>
                {isOverdue ? 'Overdue: ' : ''}
                {formatDate(task.due_date)}
              </span>
            </div>
          )}

          {/* Estimated Time */}
          {task.estimated_minutes && task.status !== 'completed' && (
            <div className="flex items-center gap-1 mt-1 text-xs text-stone-400">
              <Clock className="w-3 h-3" />
              <span>{formatDuration(task.estimated_minutes)}</span>
            </div>
          )}
        </div>

        {/* Actions Menu */}
        <button 
          onClick={(e) => { e.stopPropagation(); }}
          className="p-1 hover:bg-stone-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreHorizontal className="w-4 h-4 text-stone-400" />
        </button>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function KanbanBoard({ 
  tasks, 
  goals, 
  onTaskStatusChange, 
  onTaskClick,
  onAddTask 
}: KanbanBoardProps) {
  const [draggedTask, setDraggedTask] = useState<UserTask | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const getGoalForTask = (task: UserTask) => {
    return goals.find(g => g.id === task.goal_id);
  };

  const getTasksForColumn = (status: TaskStatus) => {
    return tasks
      .filter(t => t.status === status)
      .sort((a, b) => {
        // Sort by due date, then priority
        if (a.due_date && b.due_date) {
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        }
        if (a.due_date) return -1;
        if (b.due_date) return 1;
        return a.priority - b.priority;
      });
  };

  const handleDragStart = (e: React.DragEvent, task: UserTask) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (draggedTask && draggedTask.status !== newStatus) {
      await onTaskStatusChange(draggedTask.id, newStatus);
    }
    setDraggedTask(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Desktop: Horizontal columns */}
      <div className="hidden md:flex gap-4 flex-1 overflow-hidden">
        {COLUMNS.map((column) => {
          const columnTasks = getTasksForColumn(column.id);
          const isDropTarget = dragOverColumn === column.id && draggedTask?.status !== column.id;

          return (
            <div
              key={column.id}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
              className={`flex-1 flex flex-col min-w-[280px] max-w-[400px] 
                rounded-xl border-2 transition-all
                ${column.color}
                ${isDropTarget ? 'ring-2 ring-sage-400 ring-offset-2' : ''}`}
            >
              {/* Column Header */}
              <div className="p-3 border-b border-stone-200/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {column.icon}
                  <h3 className="font-medium text-stone-700">{column.title}</h3>
                  <span className="bg-stone-200/80 text-stone-600 text-xs px-2 py-0.5 rounded-full">
                    {columnTasks.length}
                  </span>
                </div>
                {column.id === 'pending' && (
                  <button
                    onClick={() => onAddTask()}
                    className="p-1 hover:bg-stone-200 rounded transition-colors"
                  >
                    <Plus className="w-4 h-4 text-stone-500" />
                  </button>
                )}
              </div>

              {/* Tasks */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    onDragEnd={handleDragEnd}
                  >
                    <TaskCard
                      task={task}
                      goal={getGoalForTask(task)}
                      onClick={() => onTaskClick(task)}
                      isDragging={draggedTask?.id === task.id}
                    />
                  </div>
                ))}

                {columnTasks.length === 0 && (
                  <div className="text-center py-8 text-stone-400 text-sm">
                    {column.id === 'pending' 
                      ? 'No tasks yet. Add one above!' 
                      : column.id === 'in_progress'
                      ? 'Drag tasks here when you start working'
                      : 'Completed tasks will appear here'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile: Swipeable tabs */}
      <div className="md:hidden flex flex-col h-full">
        <MobileKanban
          columns={COLUMNS}
          tasks={tasks}
          goals={goals}
          onTaskClick={onTaskClick}
          onTaskStatusChange={onTaskStatusChange}
          onAddTask={onAddTask}
          getTasksForColumn={getTasksForColumn}
          getGoalForTask={getGoalForTask}
        />
      </div>
    </div>
  );
}

function MobileKanban({
  columns,
  tasks,
  goals,
  onTaskClick,
  onTaskStatusChange,
  onAddTask,
  getTasksForColumn,
  getGoalForTask,
}: {
  columns: typeof COLUMNS;
  tasks: UserTask[];
  goals: UserGoal[];
  onTaskClick: (task: UserTask) => void;
  onTaskStatusChange: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  onAddTask: (goalId?: string) => void;
  getTasksForColumn: (status: TaskStatus) => UserTask[];
  getGoalForTask: (task: UserTask) => UserGoal | undefined;
}) {
  const [activeTab, setActiveTab] = useState<TaskStatus>('pending');

  return (
    <>
      {/* Tab Bar */}
      <div className="flex border-b border-stone-200 bg-white sticky top-0 z-10">
        {columns.map((column) => {
          const count = getTasksForColumn(column.id).length;
          return (
            <button
              key={column.id}
              onClick={() => setActiveTab(column.id)}
              className={`flex-1 py-3 px-2 text-sm font-medium transition-colors relative
                ${activeTab === column.id 
                  ? 'text-sage-700' 
                  : 'text-stone-500 hover:text-stone-700'}`}
            >
              <div className="flex items-center justify-center gap-1.5">
                {column.icon}
                <span>{column.title}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === column.id 
                    ? 'bg-sage-100 text-sage-700' 
                    : 'bg-stone-100 text-stone-500'
                }`}>
                  {count}
                </span>
              </div>
              {activeTab === column.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sage-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {getTasksForColumn(activeTab).map((task) => (
          <div key={task.id} className="relative">
            <TaskCard
              task={task}
              goal={getGoalForTask(task)}
              onClick={() => onTaskClick(task)}
            />
            
            {/* Swipe Actions (simplified for now) */}
            {activeTab !== 'completed' && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                {activeTab === 'pending' && (
                  <button
                    onClick={() => onTaskStatusChange(task.id, 'in_progress')}
                    className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                    title="Start working"
                  >
                    <ChevronRight className="w-4 h-4 text-blue-600" />
                  </button>
                )}
                {activeTab === 'in_progress' && (
                  <button
                    onClick={() => onTaskStatusChange(task.id, 'completed')}
                    className="p-2 bg-sage-100 hover:bg-sage-200 rounded-lg transition-colors"
                    title="Mark complete"
                  >
                    <CheckCircle2 className="w-4 h-4 text-sage-600" />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {getTasksForColumn(activeTab).length === 0 && (
          <div className="text-center py-12 text-stone-400">
            <div className="text-4xl mb-2">
              {activeTab === 'pending' ? '📝' : activeTab === 'in_progress' ? '⏳' : '🎉'}
            </div>
            <p className="text-sm">
              {activeTab === 'pending' 
                ? 'No tasks to do. Nice work!' 
                : activeTab === 'in_progress'
                ? 'Nothing in progress right now'
                : 'Completed tasks show here'}
            </p>
          </div>
        )}
      </div>

      {/* Add Task FAB */}
      {activeTab === 'pending' && (
        <button
          onClick={() => onAddTask()}
          className="fixed bottom-6 right-6 w-14 h-14 bg-sage-500 hover:bg-sage-600 
            text-white rounded-full shadow-lg flex items-center justify-center
            transition-transform hover:scale-110 active:scale-95"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </>
  );
}

export default KanbanBoard;
