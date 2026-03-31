'use client';

/**
 * Goal Hierarchy Component
 * 
 * Displays the Values → Goals → Tasks hierarchy with
 * progress tracking and expandable sections.
 */

import { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Target, 
  CheckCircle2, 
  Circle,
  Star,
  Edit2,
  Trash2,
  Plus,
  Calendar,
  TrendingUp,
  Clock
} from 'lucide-react';
import type { UserValue, UserGoal, UserTask, GoalStatus } from '@/types/goals';

interface GoalHierarchyProps {
  values: UserValue[];
  goals: UserGoal[];
  tasks: UserTask[];
  onEditValue?: (value: UserValue) => void;
  onEditGoal?: (goal: UserGoal) => void;
  onEditTask?: (task: UserTask) => void;
  onDeleteValue?: (valueId: string) => void;
  onDeleteGoal?: (goalId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onAddGoal?: (valueId: string) => void;
  onAddTask?: (goalId: string) => void;
  onToggleTaskComplete?: (taskId: string) => void;
  readOnly?: boolean;
}

function ProgressRing({ percentage, size = 40 }: { percentage: number; size?: number }) {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e7e5e4"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={percentage >= 100 ? '#22c55e' : percentage >= 50 ? '#84cc16' : '#f59e0b'}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-stone-600">
        {percentage}%
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: GoalStatus }) {
  const styles = {
    not_started: 'bg-stone-100 text-stone-600',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    paused: 'bg-amber-100 text-amber-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  const labels = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    completed: 'Completed',
    paused: 'Paused',
    cancelled: 'Cancelled',
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function TaskItem({ 
  task, 
  onToggleComplete,
  onEdit,
  onDelete,
  readOnly = false
}: { 
  task: UserTask;
  onToggleComplete?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  readOnly?: boolean;
}) {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';

  return (
    <div className={`flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-stone-50 group
      ${task.status === 'completed' ? 'opacity-60' : ''}`}>
      
      {/* Checkbox */}
      <button
        onClick={onToggleComplete}
        disabled={readOnly}
        className={`flex-shrink-0 ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
      >
        {task.status === 'completed' ? (
          <CheckCircle2 className="w-5 h-5 text-sage-600" />
        ) : (
          <Circle className="w-5 h-5 text-stone-300 hover:text-sage-500 transition-colors" />
        )}
      </button>

      {/* Task Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${task.status === 'completed' ? 'line-through text-stone-400' : 'text-stone-700'}`}>
          {task.title}
        </p>
        {task.due_date && (
          <p className={`text-xs flex items-center gap-1 mt-0.5 ${
            isOverdue ? 'text-red-500' : 'text-stone-400'
          }`}>
            <Calendar className="w-3 h-3" />
            {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        )}
      </div>

      {/* Actions */}
      {!readOnly && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-1 hover:bg-stone-200 rounded">
            <Edit2 className="w-3.5 h-3.5 text-stone-400" />
          </button>
          <button onClick={onDelete} className="p-1 hover:bg-red-100 rounded">
            <Trash2 className="w-3.5 h-3.5 text-stone-400 hover:text-red-500" />
          </button>
        </div>
      )}
    </div>
  );
}

function GoalCard({ 
  goal, 
  tasks,
  onEdit,
  onDelete,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onToggleTaskComplete,
  readOnly = false
}: { 
  goal: UserGoal;
  tasks: UserTask[];
  onEdit?: () => void;
  onDelete?: () => void;
  onAddTask?: () => void;
  onEditTask?: (task: UserTask) => void;
  onDeleteTask?: (task: UserTask) => void;
  onToggleTaskComplete?: (taskId: string) => void;
  readOnly?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(goal.status !== 'completed');

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="border border-stone-200 rounded-xl overflow-hidden bg-white">
      {/* Goal Header */}
      <div 
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-stone-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <button className="flex-shrink-0">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-stone-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-stone-400" />
          )}
        </button>

        <ProgressRing percentage={goal.progress_percentage || progress} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-stone-800 truncate">{goal.title}</h4>
            {goal.goal_type === 'reach' && (
              <Star className="w-4 h-4 text-amber-500" title="Reach Goal" />
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <StatusBadge status={goal.status} />
            {goal.deadline && (
              <span className="text-xs text-stone-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Due {new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
            {totalTasks > 0 && (
              <span className="text-xs text-stone-500">
                {completedTasks}/{totalTasks} tasks
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {!readOnly && (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button onClick={onEdit} className="p-2 hover:bg-stone-200 rounded-lg">
              <Edit2 className="w-4 h-4 text-stone-400" />
            </button>
            <button onClick={onDelete} className="p-2 hover:bg-red-100 rounded-lg">
              <Trash2 className="w-4 h-4 text-stone-400 hover:text-red-500" />
            </button>
          </div>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-stone-100 bg-stone-50/50">
          {/* Measurement Info */}
          {goal.measurement_target && (
            <div className="px-4 py-3 border-b border-stone-100">
              <div className="flex items-center gap-2 text-sm text-stone-600">
                <TrendingUp className="w-4 h-4 text-sage-500" />
                <span>Target: {goal.measurement_target}</span>
              </div>
              {goal.measurement_current && (
                <div className="flex items-center gap-2 text-sm text-stone-500 mt-1 ml-6">
                  <span>Current: {goal.measurement_current}</span>
                </div>
              )}
            </div>
          )}

          {/* Tasks */}
          <div className="p-2">
            {tasks.length > 0 ? (
              <div className="space-y-1">
                {tasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggleComplete={() => onToggleTaskComplete?.(task.id)}
                    onEdit={() => onEditTask?.(task)}
                    onDelete={() => onDeleteTask?.(task)}
                    readOnly={readOnly}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-stone-400 text-center py-4">No tasks yet</p>
            )}

            {/* Add Task Button */}
            {!readOnly && (
              <button
                onClick={onAddTask}
                className="w-full mt-2 py-2 text-sm text-stone-500 hover:text-sage-600 
                  hover:bg-sage-50 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Task
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ValueSection({ 
  value, 
  goals,
  tasks,
  onEdit,
  onDelete,
  onAddGoal,
  onEditGoal,
  onDeleteGoal,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onToggleTaskComplete,
  readOnly = false
}: { 
  value: UserValue;
  goals: UserGoal[];
  tasks: UserTask[];
  onEdit?: () => void;
  onDelete?: () => void;
  onAddGoal?: () => void;
  onEditGoal?: (goal: UserGoal) => void;
  onDeleteGoal?: (goal: UserGoal) => void;
  onAddTask?: (goalId: string) => void;
  onEditTask?: (task: UserTask) => void;
  onDeleteTask?: (task: UserTask) => void;
  onToggleTaskComplete?: (taskId: string) => void;
  readOnly?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Calculate overall progress for this value
  const allTasks = tasks.filter(t => goals.some(g => g.id === t.goal_id));
  const completedTasks = allTasks.filter(t => t.status === 'completed').length;
  const progress = allTasks.length > 0 ? Math.round((completedTasks / allTasks.length) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
      {/* Value Header */}
      <div 
        className="flex items-center gap-4 p-5 cursor-pointer hover:bg-stone-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <button className="flex-shrink-0">
          {isExpanded ? (
            <ChevronDown className="w-6 h-6 text-stone-400" />
          ) : (
            <ChevronRight className="w-6 h-6 text-stone-400" />
          )}
        </button>

        <ProgressRing percentage={progress} size={48} />

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-stone-800">{value.title}</h3>
          {value.description && (
            <p className="text-sm text-stone-500 mt-0.5 line-clamp-1">{value.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-stone-500">
              {goals.length} goal{goals.length !== 1 ? 's' : ''}
            </span>
            <span className="text-xs text-stone-500">
              {completedTasks}/{allTasks.length} tasks done
            </span>
          </div>
        </div>

        {/* Actions */}
        {!readOnly && (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button onClick={onEdit} className="p-2 hover:bg-stone-200 rounded-lg">
              <Edit2 className="w-4 h-4 text-stone-400" />
            </button>
            <button onClick={onDelete} className="p-2 hover:bg-red-100 rounded-lg">
              <Trash2 className="w-4 h-4 text-stone-400 hover:text-red-500" />
            </button>
          </div>
        )}
      </div>

      {/* Goals */}
      {isExpanded && (
        <div className="px-5 pb-5 space-y-3">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              tasks={tasks.filter(t => t.goal_id === goal.id)}
              onEdit={() => onEditGoal?.(goal)}
              onDelete={() => onDeleteGoal?.(goal)}
              onAddTask={() => onAddTask?.(goal.id)}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
              onToggleTaskComplete={onToggleTaskComplete}
              readOnly={readOnly}
            />
          ))}

          {goals.length === 0 && (
            <p className="text-center text-stone-400 py-4">No goals yet for this value</p>
          )}

          {/* Add Goal Button */}
          {!readOnly && (
            <button
              onClick={onAddGoal}
              className="w-full py-3 border-2 border-dashed border-stone-200 rounded-xl
                text-stone-500 hover:text-sage-600 hover:border-sage-300 hover:bg-sage-50
                flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Goal
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function GoalHierarchy({
  values,
  goals,
  tasks,
  onEditValue,
  onEditGoal,
  onEditTask,
  onDeleteValue,
  onDeleteGoal,
  onDeleteTask,
  onAddGoal,
  onAddTask,
  onToggleTaskComplete,
  readOnly = false,
}: GoalHierarchyProps) {
  const getGoalsForValue = (valueId: string) => {
    return goals.filter(g => g.value_id === valueId).sort((a, b) => a.priority - b.priority);
  };

  const getTasksForGoals = (goalIds: string[]) => {
    return tasks.filter(t => goalIds.includes(t.goal_id)).sort((a, b) => {
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      return a.priority - b.priority;
    });
  };

  // Goals without a value
  const orphanGoals = goals.filter(g => !g.value_id);

  return (
    <div className="space-y-6">
      {values.sort((a, b) => a.priority - b.priority).map((value) => {
        const valueGoals = getGoalsForValue(value.id);
        const valueTasks = getTasksForGoals(valueGoals.map(g => g.id));

        return (
          <ValueSection
            key={value.id}
            value={value}
            goals={valueGoals}
            tasks={valueTasks}
            onEdit={() => onEditValue?.(value)}
            onDelete={() => onDeleteValue?.(value.id)}
            onAddGoal={() => onAddGoal?.(value.id)}
            onEditGoal={onEditGoal}
            onDeleteGoal={(goal) => onDeleteGoal?.(goal.id)}
            onAddTask={onAddTask}
            onEditTask={onEditTask}
            onDeleteTask={(task) => onDeleteTask?.(task.id)}
            onToggleTaskComplete={onToggleTaskComplete}
            readOnly={readOnly}
          />
        );
      })}

      {/* Orphan Goals (no value assigned) */}
      {orphanGoals.length > 0 && (
        <div className="bg-stone-50 rounded-2xl border border-stone-200 p-5">
          <h3 className="text-lg font-semibold text-stone-600 mb-4">Other Goals</h3>
          <div className="space-y-3">
            {orphanGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                tasks={tasks.filter(t => t.goal_id === goal.id)}
                onEdit={() => onEditGoal?.(goal)}
                onDelete={() => onDeleteGoal?.(goal.id)}
                onAddTask={() => onAddTask?.(goal.id)}
                onEditTask={onEditTask}
                onDeleteTask={(task) => onDeleteTask?.(task.id)}
                onToggleTaskComplete={onToggleTaskComplete}
                readOnly={readOnly}
              />
            ))}
          </div>
        </div>
      )}

      {values.length === 0 && orphanGoals.length === 0 && (
        <div className="text-center py-12 bg-stone-50 rounded-2xl border border-stone-200">
          <Target className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-stone-600 mb-2">No values or goals yet</h3>
          <p className="text-stone-500 text-sm mb-4">
            Complete your strategic plan to generate personalized goals
          </p>
        </div>
      )}
    </div>
  );
}

export default GoalHierarchy;
