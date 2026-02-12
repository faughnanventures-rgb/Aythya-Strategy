'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Leaf,
  Plus,
  FileText,
  Trash2,
  Clock,
  CheckCircle2,
  ArrowRight,
  MoreVertical,
  Archive,
  Target,
  Zap,
  LogOut,
  Settings,
  User,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabaseStorage } from '@/lib/supabase/storage';
import type { StrategicPlan, PlanPhase } from '@/types';

const PHASE_LABELS: Record<PlanPhase, string> = {
  current_state: 'Current State',
  energy_audit: 'Energy Audit',
  minimum_viable_stability: 'Minimum Viable Stability',
  strategic_pillars: 'Strategic Pillars',
  tactical_mapping: 'Tactical Mapping',
  goal_setting: 'Goal Setting',
  relationship_audit: 'Relationship Audit',
  reflection: 'Reflection',
  completed: 'Completed',
};

const PHASE_ORDER: PlanPhase[] = [
  'current_state',
  'energy_audit',
  'minimum_viable_stability',
  'strategic_pillars',
  'tactical_mapping',
  'goal_setting',
  'relationship_audit',
  'reflection',
  'completed',
];

function getPhaseIndex(phase: PlanPhase): number {
  return PHASE_ORDER.indexOf(phase);
}

function getProgressPercentage(phase: PlanPhase): number {
  const index = getPhaseIndex(phase);
  if (phase === 'completed') return 100;
  return Math.round((index / 8) * 100);
}

function formatRelativeTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface PlanCardProps {
  plan: StrategicPlan;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
}

function PlanCard({ plan, onDelete, onArchive }: PlanCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const progress = getProgressPercentage(plan.currentPhase);
  const isCompleted = plan.status === 'completed';
  const isArchived = plan.status === 'archived';

  return (
    <div className={`card-elevated group relative ${isArchived ? 'opacity-60' : ''}`}>
      {/* Progress bar at top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-stone-100 rounded-t-2xl overflow-hidden">
        <div
          className={`h-full transition-all ${isCompleted ? 'bg-sage-500' : 'bg-sage-400'}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-3 pt-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg text-stone-800 truncate">
            {plan.title}
          </h3>
          <p className="text-sm text-stone-500 mt-0.5 flex items-center gap-1">
            {isCompleted ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-sage-500" />
                <span className="text-sage-600">Completed</span>
              </>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5" />
                {formatRelativeTime(plan.updatedAt)}
              </>
            )}
          </p>
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-stone-400" />
          </button>
          
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-soft-lg border border-stone-200 py-1 z-20 min-w-[140px]">
                <button
                  onClick={() => { onArchive(plan.id); setMenuOpen(false); }}
                  className="w-full px-3 py-2 text-left text-sm text-stone-600 hover:bg-stone-50 flex items-center gap-2"
                >
                  <Archive className="w-4 h-4" />
                  {isArchived ? 'Unarchive' : 'Archive'}
                </button>
                <button
                  onClick={() => {
                    if (confirm('Delete this plan?')) onDelete(plan.id);
                    setMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Phase indicator */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-stone-500 mb-1.5">
          <span>{PHASE_LABELS[plan.currentPhase]}</span>
          <span>{progress}%</span>
        </div>
        <div className="flex gap-1">
          {PHASE_ORDER.slice(0, 8).map((phase, i) => {
            const currentIdx = getPhaseIndex(plan.currentPhase);
            return (
              <div
                key={phase}
                className={`flex-1 h-1.5 rounded-full ${
                  i < currentIdx || isCompleted ? 'bg-sage-400' :
                  i === currentIdx ? 'bg-sage-300' : 'bg-stone-200'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => router.push(`/plan/${plan.id}`)}
          className="btn-primary btn-sm flex-1"
        >
          {isCompleted ? 'Review' : 'Continue'}
          <ArrowRight className="w-4 h-4" />
        </button>
        {isCompleted && (
          <button
            onClick={() => router.push(`/plan/${plan.id}/report`)}
            className="btn-ghost btn-sm"
            title="Report"
          >
            <FileText className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, signOut, loading: authLoading } = useAuth();
  const [plans, setPlans] = useState<StrategicPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    if (user) {
      loadPlans();
    }
  }, [user]);

  async function loadPlans() {
    if (!user) return;
    try {
      const allPlans = await supabaseStorage.listPlans(user.id);
      setPlans(allPlans.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ));
    } catch (error) {
      console.error('Failed to load plans:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeletePlan(id: string) {
    await supabaseStorage.deletePlan(id);
    setPlans(plans.filter(p => p.id !== id));
  }

  async function handleArchivePlan(id: string) {
    const plan = plans.find(p => p.id === id);
    if (!plan) return;
    const newStatus = plan.status === 'archived' ? 'in_progress' : 'archived';
    await supabaseStorage.updatePlan(id, { status: newStatus as StrategicPlan['status'] });
    setPlans(plans.map(p => p.id === id ? { ...p, status: newStatus as StrategicPlan['status'] } : p));
  }

  const handleSignOut = async () => {
    await signOut();
  };

  const activePlans = plans.filter(p => p.status !== 'archived');
  const archivedPlans = plans.filter(p => p.status === 'archived');
  const completedCount = plans.filter(p => p.status === 'completed').length;
  const inProgressCount = plans.filter(p => p.status === 'in_progress' || p.status === 'draft').length;
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="texture-subtle" />
      
      {/* Header */}
      <header className="relative z-20 border-b border-stone-200/60 bg-white/80 backdrop-blur-sm sticky top-0">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-sage-500 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-xl text-stone-800">Aythya Strategy</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link href="/onboarding" className="btn-primary">
              <Plus className="w-4 h-4" />
              New Plan
            </Link>
            
            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-9 h-9 rounded-full bg-sage-100 flex items-center justify-center hover:bg-sage-200 transition-colors"
                aria-label="User menu"
              >
                <User className="w-5 h-5 text-sage-600" />
              </button>
              
              {showUserMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-stone-200 py-2 z-20">
                    <div className="px-4 py-2 border-b border-stone-100">
                      <p className="text-sm font-medium text-stone-700 truncate">
                        {user?.email}
                      </p>
                    </div>
                    <Link
                      href="/settings"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        handleSignOut();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-10">
        {/* Stats */}
        {plans.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="card-base flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center">
                <Target className="w-5 h-5 text-stone-500" />
              </div>
              <div>
                <p className="text-2xl font-display text-stone-800">{plans.length}</p>
                <p className="text-xs text-stone-500">Total Plans</p>
              </div>
            </div>
            <div className="card-base flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sage-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-sage-600" />
              </div>
              <div>
                <p className="text-2xl font-display text-sage-700">{completedCount}</p>
                <p className="text-xs text-stone-500">Completed</p>
              </div>
            </div>
            <div className="card-base flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-display text-amber-700">{inProgressCount}</p>
                <p className="text-xs text-stone-500">In Progress</p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-sage-200 border-t-sage-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-stone-500">Loading...</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-sage-100 flex items-center justify-center mx-auto mb-6">
              <FileText className="w-8 h-8 text-sage-500" />
            </div>
            <h2 className="font-display text-xl text-stone-800 mb-2">No plans yet</h2>
            <p className="text-stone-500 mb-6 max-w-md mx-auto">
              Create your first strategic plan to bring clarity to your next chapter.
            </p>
            <Link href="/onboarding" className="btn-primary">
              <Plus className="w-4 h-4" />
              Create Your First Plan
            </Link>
          </div>
        ) : (
          <>
            <h2 className="font-display text-lg text-stone-800 mb-4">Your Plans</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {activePlans.map(plan => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onDelete={handleDeletePlan}
                  onArchive={handleArchivePlan}
                />
              ))}
            </div>

            {archivedPlans.length > 0 && (
              <div className="mt-8">
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className="text-sm text-stone-500 hover:text-stone-700 flex items-center gap-1 mb-4"
                >
                  <Archive className="w-4 h-4" />
                  {showArchived ? 'Hide' : 'Show'} Archived ({archivedPlans.length})
                </button>
                {showArchived && (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {archivedPlans.map(plan => (
                      <PlanCard
                        key={plan.id}
                        plan={plan}
                        onDelete={handleDeletePlan}
                        onArchive={handleArchivePlan}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
