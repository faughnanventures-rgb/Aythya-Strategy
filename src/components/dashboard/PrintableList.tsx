'use client';

/**
 * Printable List Component
 * 
 * Clean, printable view of values, goals, and tasks
 * that can be shared with coaches or therapists.
 */

import { useState, useRef } from 'react';
import { 
  Printer, 
  Share2, 
  Copy, 
  Check,
  Download,
  Calendar,
  Target,
  CheckCircle2,
  Circle,
  Star
} from 'lucide-react';
import type { UserValue, UserGoal, UserTask } from '@/types/goals';

interface PrintableListProps {
  values: UserValue[];
  goals: UserGoal[];
  tasks: UserTask[];
  userName?: string;
  planTitle?: string;
}

export function PrintableList({ 
  values, 
  goals, 
  tasks,
  userName,
  planTitle = "My Strategic Plan"
}: PrintableListProps) {
  const [copied, setCopied] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const getGoalsForValue = (valueId: string) => {
    return goals.filter(g => g.value_id === valueId).sort((a, b) => a.priority - b.priority);
  };

  const getTasksForGoal = (goalId: string) => {
    return tasks.filter(t => t.goal_id === goalId).sort((a, b) => {
      if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return a.priority - b.priority;
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = async () => {
    // TODO: Generate shareable link
    const shareUrl = `${window.location.origin}/share/abc123`;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    // TODO: Implement PDF download
    alert('PDF download coming soon!');
  };

  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Calculate stats
  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;

  return (
    <div>
      {/* Controls - Hidden when printing */}
      <div className="print:hidden mb-6 flex flex-wrap items-center gap-3">
        <button
          onClick={handlePrint}
          className="btn-primary flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
        <button
          onClick={handleDownloadPDF}
          className="btn-secondary flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </button>
        <button
          onClick={handleCopyLink}
          className="btn-secondary flex items-center gap-2"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-600" />
              Copied!
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              Share Link
            </>
          )}
        </button>
        <span className="text-sm text-stone-500">
          Share with your coach or therapist
        </span>
      </div>

      {/* Printable Content */}
      <div 
        ref={printRef}
        className="bg-white rounded-2xl border border-stone-200 p-8 print:border-none print:rounded-none print:p-0"
      >
        {/* Header */}
        <div className="border-b-2 border-stone-200 pb-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-stone-800">{planTitle}</h1>
              {userName && (
                <p className="text-stone-600 mt-1">{userName}</p>
              )}
            </div>
            <div className="text-right text-sm text-stone-500">
              <p>Generated: {generatedDate}</p>
              <p className="mt-1">
                {completedGoals}/{totalGoals} goals • {completedTasks}/{totalTasks} tasks
              </p>
            </div>
          </div>
        </div>

        {/* Values & Goals */}
        <div className="space-y-8">
          {values.sort((a, b) => a.priority - b.priority).map(value => {
            const valueGoals = getGoalsForValue(value.id);
            
            return (
              <div key={value.id} className="break-inside-avoid">
                {/* Value Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-sage-100 flex items-center justify-center flex-shrink-0">
                    <Target className="w-4 h-4 text-sage-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-stone-800">{value.title}</h2>
                    {value.description && (
                      <p className="text-sm text-stone-600">{value.description}</p>
                    )}
                  </div>
                </div>

                {/* Goals under this value */}
                <div className="ml-11 space-y-4">
                  {valueGoals.map(goal => {
                    const goalTasks = getTasksForGoal(goal.id);
                    const completedGoalTasks = goalTasks.filter(t => t.status === 'completed').length;
                    
                    return (
                      <div key={goal.id} className="border border-stone-200 rounded-xl p-4 break-inside-avoid">
                        {/* Goal Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${
                              goal.status === 'completed' 
                                ? 'text-sage-600' 
                                : goal.status === 'in_progress'
                                ? 'text-blue-600'
                                : 'text-stone-700'
                            }`}>
                              {goal.title}
                            </span>
                            {goal.goal_type === 'reach' && (
                              <Star className="w-4 h-4 text-amber-500" title="Reach Goal" />
                            )}
                            {goal.status === 'completed' && (
                              <CheckCircle2 className="w-4 h-4 text-sage-500" />
                            )}
                          </div>
                          <div className="text-xs text-stone-500">
                            {completedGoalTasks}/{goalTasks.length} tasks
                          </div>
                        </div>

                        {/* Goal Details */}
                        {goal.measurement_target && (
                          <p className="text-sm text-stone-600 mb-3">
                            <span className="font-medium">Target:</span> {goal.measurement_target}
                          </p>
                        )}

                        {goal.deadline && (
                          <div className="flex items-center gap-1 text-xs text-stone-500 mb-3">
                            <Calendar className="w-3 h-3" />
                            Due: {new Date(goal.deadline).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                        )}

                        {/* Tasks */}
                        {goalTasks.length > 0 && (
                          <div className="border-t border-stone-100 pt-3 mt-3">
                            <p className="text-xs font-medium text-stone-500 mb-2">TASKS</p>
                            <div className="space-y-1.5">
                              {goalTasks.map(task => (
                                <div 
                                  key={task.id}
                                  className="flex items-center gap-2 text-sm"
                                >
                                  {task.status === 'completed' ? (
                                    <CheckCircle2 className="w-4 h-4 text-sage-500 flex-shrink-0" />
                                  ) : (
                                    <Circle className="w-4 h-4 text-stone-300 flex-shrink-0" />
                                  )}
                                  <span className={task.status === 'completed' ? 'text-stone-400 line-through' : 'text-stone-700'}>
                                    {task.title}
                                  </span>
                                  {task.due_date && (
                                    <span className="text-xs text-stone-400 ml-auto">
                                      {new Date(task.due_date).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {valueGoals.length === 0 && (
                    <p className="text-sm text-stone-400 italic">No goals defined yet</p>
                  )}
                </div>
              </div>
            );
          })}

          {/* Orphan Goals (no value) */}
          {goals.filter(g => !g.value_id).length > 0 && (
            <div className="break-inside-avoid">
              <h2 className="text-lg font-semibold text-stone-600 mb-4">Other Goals</h2>
              <div className="space-y-4">
                {goals.filter(g => !g.value_id).map(goal => {
                  const goalTasks = getTasksForGoal(goal.id);
                  
                  return (
                    <div key={goal.id} className="border border-stone-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-stone-700">{goal.title}</span>
                        {goal.status === 'completed' && (
                          <CheckCircle2 className="w-4 h-4 text-sage-500" />
                        )}
                      </div>
                      {goalTasks.length > 0 && (
                        <div className="space-y-1">
                          {goalTasks.map(task => (
                            <div key={task.id} className="flex items-center gap-2 text-sm">
                              {task.status === 'completed' ? (
                                <CheckCircle2 className="w-3 h-3 text-sage-500" />
                              ) : (
                                <Circle className="w-3 h-3 text-stone-300" />
                              )}
                              <span className={task.status === 'completed' ? 'line-through text-stone-400' : ''}>
                                {task.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-stone-200 text-center text-sm text-stone-400">
          <p>Generated by Aythya Strategy</p>
          <p className="mt-1">aythya.io</p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-content,
          #printable-content * {
            visibility: visible;
          }
          #printable-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .break-inside-avoid {
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}

export default PrintableList;
