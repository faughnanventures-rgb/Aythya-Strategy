'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Leaf, Sparkles, Check, AlertTriangle, Zap, Compass, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabaseStorage } from '@/lib/supabase/storage';

type PlanningMode = 'quick' | 'deep';

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  features?: string[];
  showDisclaimer?: boolean;
  showModeSelection?: boolean;
  showTitleInput?: boolean;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome',
    subtitle: 'A strategic approach to life planning',
    content: `This isn't therapy or life coaching. It's strategic thinking applied to your life—treating yourself as both the CEO and the product of your own enterprise.

We'll work through eight phases together, from understanding where you are now to setting meaningful goals and clarifying relationships.`,
    features: [
      'Understand your current state',
      'Identify what energizes you',
      'Set meaningful goals',
    ],
    showDisclaimer: true,
  },
  {
    id: 'mode',
    title: 'Choose your approach',
    subtitle: 'How deep do you want to go?',
    content: `You can switch between modes anytime during your planning session. Start quick and go deeper when you're ready.`,
    showModeSelection: true,
  },
  {
    id: 'how',
    title: 'How it works',
    subtitle: 'Guided conversations',
    content: `You'll have a conversation with an AI facilitator who guides you through each phase with thoughtful questions.

The AI won't tell you what to do—you're the expert on your own life. Instead, it brings structure and helps you see patterns you might miss.

Take your time. The details matter.`,
    features: [
      'Thoughtful questions',
      'Pattern recognition',
      'Your pace, your answers',
    ],
  },
  {
    id: 'create',
    title: 'What you\'ll create',
    subtitle: 'Your strategic plan',
    content: `By the end of this process, you'll have a comprehensive strategic plan that includes:`,
    features: [
      'Strategic pillars — 2-3 core focus areas',
      'Current state map — assets & constraints',
      'Tactical inventory — opportunities & projects',
      'Meaningful goals — with timelines',
      'Relationship clarity — who to invest in',
      'Personal insights — patterns & reflections',
    ],
    showTitleInput: true,
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState(0);
  const [planTitle, setPlanTitle] = useState('');
  const [planningMode, setPlanningMode] = useState<PlanningMode>('quick');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  const isLastStep = step === ONBOARDING_STEPS.length - 1;
  const currentStep = ONBOARDING_STEPS[step];

  const handleNext = () => {
    // On first step, require disclaimer acceptance
    if (currentStep?.id === 'welcome' && !disclaimerAccepted) {
      return;
    }
    
    if (isLastStep) {
      handleCreatePlan();
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep((s) => s - 1);
    }
  };

  const handleCreatePlan = async () => {
    // Require authentication
    if (!user) {
      router.push('/login?redirectTo=/onboarding');
      return;
    }

    const title = planTitle.trim() || `My Strategic Plan`;
    
    setIsCreating(true);
    setError(null);

    try {
      const plan = await supabaseStorage.createPlan(
        user.id, 
        title, 
        planningMode === 'quick' ? 'short' : 'long'
      );
      // Pass the selected mode via URL parameter
      router.push(`/plan/${plan.id}?mode=${planningMode}`);
    } catch (err) {
      console.error('Failed to create plan:', err);
      setError('Something went wrong. Please try again.');
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero relative">
      <div className="texture-subtle" />
      
      <div className="relative z-10 max-w-xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <Link
            href="/"
            className="flex items-center gap-2 text-stone-400 hover:text-stone-600 transition-colors duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sage-500 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-stone-700">Aythya Strategy</span>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-10">
          {ONBOARDING_STEPS.map((_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                index <= step ? 'bg-sage-400' : 'bg-stone-200'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="card-elevated animate-fade-in" key={step}>
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sage-500 font-mono text-sm font-medium">
              {String(step + 1).padStart(2, '0')}
            </span>
            <span className="text-stone-300">/</span>
            <span className="text-stone-400 font-mono text-sm">
              {String(ONBOARDING_STEPS.length).padStart(2, '0')}
            </span>
          </div>
          
          {/* Title */}
          <h1 className="font-display text-display-md text-stone-800 mb-2">
            {currentStep?.title}
          </h1>
          
          <p className="text-stone-500 mb-8">{currentStep?.subtitle}</p>
          
          {/* Content */}
          <div className="prose-calm mb-8">
            <p className="whitespace-pre-line">{currentStep?.content}</p>
          </div>
          
          {/* Mode Selection */}
          {currentStep?.showModeSelection && (
            <div className="space-y-4 mb-8">
              {/* Quick Mode */}
              <button
                onClick={() => setPlanningMode('quick')}
                className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-300 ${
                  planningMode === 'quick'
                    ? 'border-sage-400 bg-sage-50/50 shadow-soft-sm'
                    : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    planningMode === 'quick' ? 'bg-sage-500' : 'bg-stone-200'
                  }`}>
                    <Zap className={`w-5 h-5 ${planningMode === 'quick' ? 'text-white' : 'text-stone-500'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-semibold ${planningMode === 'quick' ? 'text-sage-700' : 'text-stone-700'}`}>
                        Quick
                      </h3>
                      <span className="text-xs px-2 py-0.5 bg-sage-100 text-sage-600 rounded-full font-medium">
                        Recommended to start
                      </span>
                    </div>
                    <p className="text-sm text-stone-500 mb-2">
                      Get an overview of each phase with essential questions. Perfect for getting started or when time is limited.
                    </p>
                    <div className="flex items-center gap-1 text-xs text-stone-400">
                      <Clock className="w-3 h-3" />
                      <span>~30-45 minutes total</span>
                    </div>
                  </div>
                  {planningMode === 'quick' && (
                    <div className="w-6 h-6 rounded-full bg-sage-500 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </button>

              {/* Deep Dive Mode */}
              <button
                onClick={() => setPlanningMode('deep')}
                className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-300 ${
                  planningMode === 'deep'
                    ? 'border-sage-400 bg-sage-50/50 shadow-soft-sm'
                    : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    planningMode === 'deep' ? 'bg-sage-500' : 'bg-stone-200'
                  }`}>
                    <Compass className={`w-5 h-5 ${planningMode === 'deep' ? 'text-white' : 'text-stone-500'}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold mb-1 ${planningMode === 'deep' ? 'text-sage-700' : 'text-stone-700'}`}>
                      Deep Dive
                    </h3>
                    <p className="text-sm text-stone-500 mb-2">
                      Thorough exploration with follow-up questions and deeper reflection. Best for major life transitions or comprehensive planning.
                    </p>
                    <div className="flex items-center gap-1 text-xs text-stone-400">
                      <Clock className="w-3 h-3" />
                      <span>~2-3 hours total</span>
                    </div>
                  </div>
                  {planningMode === 'deep' && (
                    <div className="w-6 h-6 rounded-full bg-sage-500 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </button>

              {/* Hint */}
              <p className="text-xs text-stone-400 text-center pt-2">
                💡 You can switch between Quick and Deep Dive anytime during your session
              </p>
            </div>
          )}

          {/* Features list */}
          {currentStep?.features && !currentStep.showModeSelection && (
            <div className="space-y-3 mb-8">
              {currentStep.features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-start gap-3 text-stone-600"
                >
                  <div className="w-5 h-5 rounded-full bg-sage-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-sage-600" />
                  </div>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          )}

          {/* AI Disclaimer on first step */}
          {currentStep?.showDisclaimer && (
            <div className="mb-8">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-amber-800 mb-2">
                      Important: AI Limitations
                    </h3>
                    <p className="text-amber-700 text-sm">
                      This tool uses AI to facilitate strategic thinking. It is{' '}
                      <strong>not a substitute</strong> for professional financial, 
                      legal, medical, or mental health advice. You are responsible 
                      for decisions made based on these conversations.
                    </p>
                  </div>
                </div>
                
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                      disclaimerAccepted
                        ? 'bg-sage-500 border-sage-500'
                        : 'border-amber-400 group-hover:border-sage-400'
                    }`}
                  >
                    {disclaimerAccepted && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <input
                    type="checkbox"
                    checked={disclaimerAccepted}
                    onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                    className="sr-only"
                  />
                  <span className="text-sm text-amber-800">
                    I understand and accept the{' '}
                    <Link 
                      href="/terms" 
                      className="text-sage-600 hover:text-sage-700 underline"
                      target="_blank"
                    >
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link 
                      href="/privacy" 
                      className="text-sage-600 hover:text-sage-700 underline"
                      target="_blank"
                    >
                      Privacy Policy
                    </Link>
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Title input on last step */}
          {currentStep?.showTitleInput && (
            <div className="mb-8 p-5 bg-cream-50 rounded-xl border border-cream-200/50">
              <label
                htmlFor="plan-title"
                className="input-label"
              >
                Name your plan (optional)
              </label>
              <input
                id="plan-title"
                type="text"
                value={planTitle}
                onChange={(e) => setPlanTitle(e.target.value)}
                placeholder="My Strategic Plan"
                className="input-base"
              />
              <p className="mt-2.5 text-xs text-stone-400">
                You can always change this later
              </p>
              
              {/* Show selected mode */}
              <div className="mt-4 pt-4 border-t border-cream-200/50">
                <p className="text-xs text-stone-500">
                  Starting in <span className="font-medium text-sage-600">{planningMode === 'quick' ? 'Quick' : 'Deep Dive'}</span> mode
                </p>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200/50 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-100">
            <button
              onClick={handleBack}
              disabled={step === 0}
              className="btn-ghost disabled:opacity-0 disabled:pointer-events-none"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <button
              onClick={handleNext}
              disabled={isCreating || (currentStep?.id === 'welcome' && !disclaimerAccepted)}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </span>
              ) : isLastStep ? (
                <>
                  Begin Planning
                  <Sparkles className="w-4 h-4" />
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bottom note */}
        <p className="text-center text-sm text-stone-400 mt-10">
          Your progress is saved locally in your browser.
          <br />
          No account required to get started.
        </p>
      </div>
    </div>
  );
}
