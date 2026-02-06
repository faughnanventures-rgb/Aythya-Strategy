'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Leaf, Sparkles, Check, AlertTriangle } from 'lucide-react';
import { getStorageAdapter } from '@/lib/storage/adapter';

interface OnboardingStep {
  title: string;
  subtitle: string;
  content: string;
  features: string[];
  showDisclaimer?: boolean;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: 'Welcome',
    subtitle: 'A strategic approach to life planning',
    content: `This isn't therapy or life coaching. It's strategic thinking applied to your life—treating yourself as both the CEO and the product of your own enterprise.

We'll work through eight phases together, from understanding where you are now to setting meaningful goals and clarifying relationships.

The process typically takes 2-3 hours total, but you can save your progress and return anytime.`,
    features: [
      'Understand your current state',
      'Identify what energizes you',
      'Set meaningful goals',
    ],
    showDisclaimer: true,
  },
  {
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
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [planTitle, setPlanTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  const isLastStep = step === ONBOARDING_STEPS.length - 1;
  const currentStep = ONBOARDING_STEPS[step];

  const handleNext = () => {
    // On first step, require disclaimer acceptance
    if (step === 0 && !disclaimerAccepted) {
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
    const title = planTitle.trim() || `My Strategic Plan`;
    
    setIsCreating(true);
    setError(null);

    try {
      const storage = getStorageAdapter();
      const userId = 'dev-user-local';
      const plan = await storage.createPlan(userId, title);
      router.push(`/plan/${plan.id}`);
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
          
          {/* Features list */}
          {currentStep?.features && (
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
          {isLastStep && (
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
              disabled={isCreating || (step === 0 && !disclaimerAccepted)}
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
