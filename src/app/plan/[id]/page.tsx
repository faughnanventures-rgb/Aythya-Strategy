'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Leaf,
  Send,
  ChevronRight,
  ChevronLeft,
  Check,
  Menu,
  X,
  Home,
  Loader2,
  MessageCircle,
  FileText,
  Share2,
  RotateCcw,
  Zap,
  Clock,
  Target,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabaseStorage } from '@/lib/supabase/storage';
import type { StrategicPlan, PlanPhase, ConversationMessage } from '@/types';

// ============================================
// CSRF TOKEN HELPER
// ============================================

function getCSRFToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/csrf_token=([^;]+)/);
  return match?.[1] ?? '';
}

// ============================================
// PHASE CONFIGURATION
// ============================================

interface PhaseConfig {
  id: PlanPhase;
  title: string;
  shortTitle: string;
  description: string;
  estimatedTime: string;
  icon: typeof Target;
}

const PHASES: PhaseConfig[] = [
  {
    id: 'current_state',
    title: 'Current State Analysis',
    shortTitle: 'Current State',
    description: 'Understanding where you are right now',
    estimatedTime: '15-20 min',
    icon: Target,
  },
  {
    id: 'energy_audit',
    title: 'Energy Audit',
    shortTitle: 'Energy',
    description: 'What energizes and drains you',
    estimatedTime: '10-15 min',
    icon: Zap,
  },
  {
    id: 'minimum_viable_stability',
    title: 'Minimum Viable Stability',
    shortTitle: 'Stability',
    description: 'Defining "okay" for now',
    estimatedTime: '10-15 min',
    icon: Target,
  },
  {
    id: 'strategic_pillars',
    title: 'Strategic Pillars',
    shortTitle: 'Pillars',
    description: 'Your core focus areas',
    estimatedTime: '15-20 min',
    icon: Target,
  },
  {
    id: 'tactical_mapping',
    title: 'Tactical Mapping',
    shortTitle: 'Tactics',
    description: "What's in play",
    estimatedTime: '15-20 min',
    icon: Target,
  },
  {
    id: 'goal_setting',
    title: 'Goal Setting',
    shortTitle: 'Goals',
    description: 'Meaningful milestones',
    estimatedTime: '15-20 min',
    icon: CheckCircle2,
  },
  {
    id: 'relationship_audit',
    title: 'Relationship Audit',
    shortTitle: 'Relationships',
    description: 'Who adds to your life',
    estimatedTime: '10-15 min',
    icon: Target,
  },
  {
    id: 'reflection',
    title: 'Reflection & Meaning',
    shortTitle: 'Reflection',
    description: 'Making sense of it all',
    estimatedTime: '10-15 min',
    icon: Sparkles,
  },
];

const TOTAL_PHASES = PHASES.length;

// ============================================
// HELPER FUNCTIONS
// ============================================

function getPhaseIndex(phase: PlanPhase): number {
  return PHASES.findIndex((p) => p.id === phase);
}

function getPhaseProgress(phase: PlanPhase): number {
  const index = getPhaseIndex(phase);
  if (phase === 'completed') return 100;
  return Math.round((index / TOTAL_PHASES) * 100);
}

function getNextPhase(currentPhase: PlanPhase): PlanPhase | null {
  const index = getPhaseIndex(currentPhase);
  if (index >= PHASES.length - 1) return 'completed';
  return PHASES[index + 1]?.id || null;
}

// ============================================
// CHAT MESSAGE COMPONENT
// ============================================

interface ChatMessageProps {
  message: ConversationMessage;
  isLatest: boolean;
}

function ChatMessage({ message, isLatest }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${
        isLatest ? 'animate-fade-in-up' : ''
      }`}
    >
      <div
        className={`chat-bubble ${
          isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'
        }`}
      >
        <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
      </div>
    </div>
  );
}

// ============================================
// TYPING INDICATOR
// ============================================

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="typing-indicator">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </div>
  );
}

// ============================================
// PROGRESS BAR COMPONENT
// ============================================

interface ProgressBarProps {
  progress: number;
  completedPhases: number;
}

function ProgressBar({ progress, completedPhases }: ProgressBarProps) {
  return (
    <div className="px-4 py-3 border-b border-stone-200/60 bg-white/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-stone-500">
          Progress: {completedPhases} of {TOTAL_PHASES} phases
        </span>
        <span className="text-xs font-medium text-sage-600">{progress}%</span>
      </div>
      <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-sage-400 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      {/* Phase dots */}
      <div className="flex items-center gap-1 mt-2">
        {PHASES.map((phase, i) => {
          const isComplete = i < completedPhases;
          const isCurrent = i === completedPhases;
          return (
            <div
              key={phase.id}
              className={`flex-1 h-1 rounded-full transition-colors ${
                isComplete
                  ? 'bg-sage-400'
                  : isCurrent
                  ? 'bg-sage-300'
                  : 'bg-stone-200'
              }`}
              title={phase.title}
            />
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// PHASE SIDEBAR
// ============================================

interface PhaseSidebarProps {
  currentPhase: PlanPhase;
  completedPhases: PlanPhase[];
  phaseMessageCounts: Record<PlanPhase, number>;
  onPhaseSelect: (phase: PlanPhase) => void;
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  planTitle: string;
}

function PhaseSidebar({
  currentPhase,
  completedPhases,
  phaseMessageCounts,
  onPhaseSelect,
  isOpen,
  onClose,
  planId,
  planTitle,
}: PhaseSidebarProps) {
  const getPhaseStatus = (phaseId: PlanPhase) => {
    if (completedPhases.includes(phaseId)) return 'completed';
    if (phaseId === currentPhase) return 'current';
    const currentIndex = getPhaseIndex(currentPhase);
    const phaseIndex = getPhaseIndex(phaseId);
    if (phaseIndex < currentIndex) return 'visited';
    return 'upcoming';
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-stone-900/10 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 w-72 bg-white/80 backdrop-blur-md border-r border-stone-200/60 z-50 transform transition-transform duration-400 ease-smooth ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 p-5 border-b border-stone-200/60">
            <div className="flex items-center justify-between">
              <Link href="/dashboard" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-sage-500 flex items-center justify-center shadow-soft-xs">
                  <Leaf className="w-5 h-5 text-white" />
                </div>
                <span className="font-display text-lg text-stone-800">
                  Aythya Strategy
                </span>
              </Link>
              <button
                onClick={onClose}
                className="lg:hidden p-2 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </div>
            {/* Plan title */}
            <p className="mt-3 text-sm text-stone-500 truncate">{planTitle}</p>
          </div>

          {/* Phases */}
          <nav className="flex-1 overflow-y-auto p-4">
            <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-4 px-3">
              Planning Phases
            </p>
            <ul className="phase-nav space-y-1">
              {PHASES.map((phase, index) => {
                const status = getPhaseStatus(phase.id);
                const messageCount = phaseMessageCounts[phase.id] || 0;
                const canAccess = status !== 'upcoming' || index === 0;

                return (
                  <li key={phase.id}>
                    <button
                      onClick={() => {
                        if (canAccess) {
                          onPhaseSelect(phase.id);
                          onClose();
                        }
                      }}
                      disabled={!canAccess}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                        status === 'current'
                          ? 'bg-sage-50 border border-sage-200'
                          : status === 'completed' || status === 'visited'
                          ? 'hover:bg-stone-50 cursor-pointer'
                          : 'opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium ${
                          status === 'completed'
                            ? 'bg-sage-500 text-white'
                            : status === 'current'
                            ? 'bg-sage-100 text-sage-700 ring-2 ring-sage-300'
                            : status === 'visited'
                            ? 'bg-stone-200 text-stone-600'
                            : 'bg-stone-100 text-stone-400'
                        }`}
                      >
                        {status === 'completed' ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <div className="flex-1 text-left min-w-0">
                        <span
                          className={`block text-sm font-medium truncate ${
                            status === 'current'
                              ? 'text-sage-700'
                              : status === 'completed' || status === 'visited'
                              ? 'text-stone-700'
                              : 'text-stone-400'
                          }`}
                        >
                          {phase.shortTitle}
                        </span>
                        {messageCount > 0 && (
                          <span className="text-xs text-stone-400">
                            {messageCount} messages
                          </span>
                        )}
                      </div>
                      {status === 'current' && (
                        <ChevronRight className="w-4 h-4 text-sage-500" />
                      )}
                      {(status === 'completed' || status === 'visited') && (
                        <RotateCcw className="w-3.5 h-3.5 text-stone-400 opacity-0 group-hover:opacity-100" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer Actions */}
          <div className="flex-shrink-0 p-4 border-t border-stone-200/60 space-y-2">
            <Link
              href={`/plan/${planId}/report`}
              className="flex items-center gap-2.5 px-3 py-2 text-stone-500 hover:text-stone-700 hover:bg-stone-50 rounded-lg text-sm transition-colors"
            >
              <FileText className="w-4 h-4" />
              View Report
            </Link>
            <Link
              href={`/plan/${planId}/share`}
              className="flex items-center gap-2.5 px-3 py-2 text-stone-500 hover:text-stone-700 hover:bg-stone-50 rounded-lg text-sm transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share Plan
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 px-3 py-2 text-stone-500 hover:text-stone-700 hover:bg-stone-50 rounded-lg text-sm transition-colors"
            >
              <Home className="w-4 h-4" />
              All Plans
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}

// ============================================
// PHASE TRANSITION MODAL
// ============================================

interface PhaseTransitionProps {
  currentPhase: PhaseConfig;
  nextPhase: PhaseConfig | null;
  onContinue: () => void;
  onStay: () => void;
  isVisible: boolean;
}

function PhaseTransition({
  currentPhase,
  nextPhase,
  onContinue,
  onStay,
  isVisible,
}: PhaseTransitionProps) {
  if (!isVisible || !nextPhase) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-soft-xl max-w-md w-full p-6 animate-scale-in">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-sage-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-sage-500" />
          </div>
          <h2 className="font-display text-xl text-stone-800 mb-2">
            Phase Complete!
          </h2>
          <p className="text-stone-500">
            You've finished <strong>{currentPhase.title}</strong>. Ready to move
            on to the next phase?
          </p>
        </div>

        {/* Next phase preview */}
        <div className="bg-stone-50 rounded-xl p-4 mb-6">
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">
            Up Next
          </p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sage-100 flex items-center justify-center">
              <Target className="w-5 h-5 text-sage-600" />
            </div>
            <div>
              <p className="font-medium text-stone-800">{nextPhase.title}</p>
              <p className="text-sm text-stone-500">{nextPhase.description}</p>
            </div>
          </div>
          <p className="text-xs text-stone-400 mt-2 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Estimated: {nextPhase.estimatedTime}
          </p>
        </div>

        <div className="flex gap-3">
          <button onClick={onStay} className="btn-ghost flex-1">
            Stay Here
          </button>
          <button onClick={onContinue} className="btn-primary flex-1">
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MODE TOGGLE (Short vs Long)
// ============================================

interface ModeToggleProps {
  mode: 'short' | 'long';
  onToggle: (mode: 'short' | 'long') => void;
}

function ModeToggle({ mode, onToggle }: ModeToggleProps) {
  return (
    <div className="flex items-center gap-2 p-1 bg-stone-100 rounded-lg">
      <button
        onClick={() => onToggle('short')}
        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
          mode === 'short'
            ? 'bg-white text-stone-800 shadow-soft-xs'
            : 'text-stone-500 hover:text-stone-700'
        }`}
      >
        Quick
      </button>
      <button
        onClick={() => onToggle('long')}
        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
          mode === 'long'
            ? 'bg-white text-stone-800 shadow-soft-xs'
            : 'text-stone-500 hover:text-stone-700'
        }`}
      >
        Deep Dive
      </button>
    </div>
  );
}

// ============================================
// MAIN PLANNING PAGE
// ============================================

export default function PlanPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = params.id as string;

  // Get initial mode from URL parameter (quick -> short, deep -> long)
  const urlMode = searchParams.get('mode');
  const initialMode: 'short' | 'long' = urlMode === 'deep' ? 'long' : 'short';

  // State
  const [plan, setPlan] = useState<StrategicPlan | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [completedPhases, setCompletedPhases] = useState<PlanPhase[]>([]);
  const [phaseMessageCounts, setPhaseMessageCounts] = useState<Record<PlanPhase, number>>({} as any);
  const [showTransition, setShowTransition] = useState(false);
  const [planningMode, setPlanningMode] = useState<'short' | 'long'>(initialMode);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Get current phase info
  const currentPhase = plan?.currentPhase || 'current_state';
  const currentPhaseInfo = PHASES.find((p) => p.id === currentPhase);
  const currentPhaseIndex = getPhaseIndex(currentPhase);
  const progress = getPhaseProgress(currentPhase);

  // Scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load plan and conversation
  useEffect(() => {
    async function loadPlan() {
      try {
        const loadedPlan = await supabaseStorage.getPlan(planId);

        if (!loadedPlan) {
          router.push('/onboarding');
          return;
        }

        setPlan(loadedPlan);

        // Load message counts for all phases
        const counts: Record<PlanPhase, number> = {} as any;
        const completed: PlanPhase[] = [];
        
        for (const phase of PHASES) {
          const conv = await supabaseStorage.getConversation(planId, phase.id);
          counts[phase.id] = conv.length;
          // Consider a phase complete if it has more than 6 messages (3 exchanges)
          if (conv.length >= 6) {
            completed.push(phase.id);
          }
        }
        
        setPhaseMessageCounts(counts);
        setCompletedPhases(completed);

        // Load conversation for current phase
        const conversation = await supabaseStorage.getConversation(
          planId,
          loadedPlan.currentPhase
        );
        setMessages(conversation);

        // If no messages yet, send initial greeting
        if (conversation.length === 0) {
          await sendInitialGreeting(loadedPlan.currentPhase);
        }
      } catch (err) {
        console.error('Failed to load plan:', err);
        setError('Unable to load your plan. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    loadPlan();
  }, [planId, router]);

  // Send initial greeting for a phase
  const sendInitialGreeting = async (phase: PlanPhase) => {
    setIsSending(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCSRFToken(),
        },
        body: JSON.stringify({
          planId,
          message: `[Starting ${planningMode} mode] Hello, I'm ready to begin.`,
          phase,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to start conversation');
      }

      const assistantMessage: ConversationMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: data.data.message,
        timestamp: new Date(),
      };

      setMessages([assistantMessage]);

      // Save to storage
      await supabaseStorage.saveConversation(planId, phase, [assistantMessage]);
      
      // Update message count
      setPhaseMessageCounts(prev => ({ ...prev, [phase]: 1 }));
    } catch (err) {
      console.error('Failed to send initial greeting:', err);
      const phaseInfo = PHASES.find(p => p.id === phase);
      const fallbackMessage: ConversationMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `Welcome to ${phaseInfo?.title || 'this phase'}.\n\nLet's begin. ${phaseInfo?.description || ''}\n\nWhat's on your mind?`,
        timestamp: new Date(),
      };
      setMessages([fallbackMessage]);
    } finally {
      setIsSending(false);
    }
  };

  // Switch to a different phase
  const handlePhaseSelect = async (phase: PlanPhase) => {
    if (phase === currentPhase) return;

    setIsLoading(true);
    try {
      // Update plan's current phase
      await supabaseStorage.updatePlan(planId, { currentPhase: phase });
      setPlan(prev => prev ? { ...prev, currentPhase: phase } : null);

      // Load conversation for new phase
      const conversation = await supabaseStorage.getConversation(planId, phase);
      setMessages(conversation);

      // If no messages yet, send initial greeting
      if (conversation.length === 0) {
        await sendInitialGreeting(phase);
      }
    } catch (err) {
      console.error('Failed to switch phase:', err);
      setError('Failed to switch phases. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle phase transition
  const handleMoveToNextPhase = async () => {
    const nextPhase = getNextPhase(currentPhase);
    if (nextPhase && nextPhase !== 'completed') {
      // Mark current phase as completed
      if (!completedPhases.includes(currentPhase)) {
        setCompletedPhases(prev => [...prev, currentPhase]);
      }
      setShowTransition(false);
      await handlePhaseSelect(nextPhase);
    } else if (nextPhase === 'completed') {
      // Plan is complete - go to report
      await supabaseStorage.updatePlan(planId, { 
        currentPhase: 'completed',
        status: 'completed',
        completedAt: new Date(),
      });
      router.push(`/plan/${planId}/report`);
    }
  };

  // Send message
  const handleSendMessage = async () => {
    const message = inputValue.trim();
    if (!message || isSending) return;

    setInputValue('');
    setError(null);

    const userMessage: ConversationMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCSRFToken(),
        },
        body: JSON.stringify({
          planId,
          message,
          phase: currentPhase,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to send message');
      }

      const assistantMessage: ConversationMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: data.data.message,
        timestamp: new Date(),
      };

      const updatedMessages = [...messages, userMessage, assistantMessage];
      setMessages(updatedMessages);

      // Save to storage
      await supabaseStorage.saveConversation(planId, currentPhase, updatedMessages);
      
      // Update message count
      setPhaseMessageCounts(prev => ({ 
        ...prev, 
        [currentPhase]: updatedMessages.length 
      }));

      // Check if AI suggests moving to next phase
      if (data.data.suggestedNextPhase && data.data.suggestedNextPhase !== currentPhase) {
        // Show transition modal
        setTimeout(() => setShowTransition(true), 1000);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      // Remove the user message on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  // Handle input
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    // Auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Loading state
  if (isLoading && !plan) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-sage-200 border-t-sage-500 rounded-full animate-spin" />
          <p className="text-stone-500">Loading your plan...</p>
        </div>
      </div>
    );
  }

  const nextPhaseInfo = PHASES.find(p => p.id === getNextPhase(currentPhase));

  return (
    <div className="min-h-screen bg-gradient-hero flex">
      {/* Sidebar */}
      <PhaseSidebar
        currentPhase={currentPhase}
        completedPhases={completedPhases}
        phaseMessageCounts={phaseMessageCounts}
        onPhaseSelect={handlePhaseSelect}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        planId={planId}
        planTitle={plan?.title || 'Strategic Plan'}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex-shrink-0 bg-white/80 backdrop-blur-md border-b border-stone-200/60 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5 text-stone-500" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-sage-600 bg-sage-100 px-2 py-0.5 rounded-full">
                    Phase {currentPhaseIndex + 1}/{TOTAL_PHASES}
                  </span>
                  <h1 className="font-display text-lg text-stone-800">
                    {currentPhaseInfo?.title}
                  </h1>
                </div>
                <p className="text-sm text-stone-500 hidden sm:block">
                  {currentPhaseInfo?.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ModeToggle mode={planningMode} onToggle={setPlanningMode} />
            </div>
          </div>

          {/* Progress bar */}
          <ProgressBar 
            progress={progress} 
            completedPhases={completedPhases.length}
          />
        </header>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6">
            {/* Phase introduction card */}
            {messages.length === 0 && !isSending && (
              <div className="card-elevated mb-6 text-center py-8">
                <div className="w-14 h-14 rounded-2xl bg-sage-100 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-7 h-7 text-sage-500" />
                </div>
                <h2 className="font-display text-xl text-stone-800 mb-2">
                  {currentPhaseInfo?.title}
                </h2>
                <p className="text-stone-500 max-w-md mx-auto">
                  {currentPhaseInfo?.description}. Take your time with this phase.
                </p>
                <p className="text-sm text-stone-400 mt-4 flex items-center justify-center gap-1">
                  <Clock className="w-4 h-4" />
                  Estimated: {currentPhaseInfo?.estimatedTime}
                </p>
              </div>
            )}

            {/* Messages */}
            <div className="space-y-4">
              {messages.map((message, index) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isLatest={index === messages.length - 1}
                />
              ))}
              {isSending && <TypingIndicator />}
            </div>

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-200">
            <div className="max-w-3xl mx-auto flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="flex-shrink-0 bg-white/80 backdrop-blur-md border-t border-stone-200/60">
          <div className="max-w-3xl mx-auto px-4 py-4">
            {/* Quick actions */}
            <div className="flex items-center gap-2 mb-3">
              {currentPhaseIndex > 0 && (
                <button
                  onClick={() => {
                    const prevPhase = PHASES[currentPhaseIndex - 1];
                    if (prevPhase) handlePhaseSelect(prevPhase.id);
                  }}
                  className="text-xs text-stone-500 hover:text-stone-700 flex items-center gap-1"
                >
                  <ChevronLeft className="w-3 h-3" />
                  Previous phase
                </button>
              )}
              <div className="flex-1" />
              {messages.length >= 4 && (
                <button
                  onClick={() => setShowTransition(true)}
                  className="text-xs text-sage-600 hover:text-sage-700 flex items-center gap-1"
                >
                  Ready to move on?
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Share your thoughts..."
                  rows={1}
                  className="chat-input resize-none"
                  disabled={isSending}
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isSending}
                className="btn-primary btn-icon flex-shrink-0"
              >
                {isSending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Phase transition modal */}
      <PhaseTransition
        currentPhase={currentPhaseInfo!}
        nextPhase={nextPhaseInfo || null}
        onContinue={handleMoveToNextPhase}
        onStay={() => setShowTransition(false)}
        isVisible={showTransition}
      />
    </div>
  );
}
