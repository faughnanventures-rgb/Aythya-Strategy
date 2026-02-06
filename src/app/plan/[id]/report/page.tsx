'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Leaf,
  ArrowLeft,
  Download,
  FileText,
  File,
  Copy,
  Check,
  Share2,
  Printer,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  Target,
  Lightbulb,
  ListTodo,
} from 'lucide-react';
import { getStorageAdapter } from '@/lib/storage/adapter';
import {
  generateOnePager,
  generateFullReport,
  formatOnePagerMarkdown,
  formatFullReportMarkdown,
  formatOnePagerHTML,
  type OnePagerData,
  type FullReportData,
} from '@/lib/reports/generator';
import type { StrategicPlan, PlanPhase, ConversationMessage } from '@/types';

// ============================================
// PHASE CONFIGURATION
// ============================================

const PHASES: PlanPhase[] = [
  'current_state',
  'energy_audit',
  'minimum_viable_stability',
  'strategic_pillars',
  'tactical_mapping',
  'goal_setting',
  'relationship_audit',
  'reflection',
];

// ============================================
// COMPONENTS
// ============================================

interface ReportSectionProps {
  title: string;
  content: string;
  insights: string[];
  actions: string[];
  isComplete: boolean;
  defaultOpen?: boolean;
}

function ReportSection({ 
  title, 
  content, 
  insights, 
  actions, 
  isComplete,
  defaultOpen = false 
}: ReportSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-stone-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-white hover:bg-stone-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isComplete ? (
            <CheckCircle2 className="w-5 h-5 text-sage-500" />
          ) : (
            <Circle className="w-5 h-5 text-stone-300" />
          )}
          <span className="font-medium text-stone-800">{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-5 h-5 text-stone-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-stone-400" />
        )}
      </button>

      {isOpen && (
        <div className="p-4 pt-0 bg-white border-t border-stone-100">
          <div className="prose-calm text-sm mt-4">
            <p>{content}</p>
          </div>

          {insights.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-2 text-sm font-medium text-stone-700 mb-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                Key Insights
              </div>
              <ul className="space-y-1">
                {insights.map((insight, i) => (
                  <li key={i} className="text-sm text-stone-600 pl-6 relative">
                    <span className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-amber-400" />
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {actions.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-2 text-sm font-medium text-stone-700 mb-2">
                <ListTodo className="w-4 h-4 text-sage-500" />
                Action Items
              </div>
              <ul className="space-y-1">
                {actions.map((action, i) => (
                  <li key={i} className="text-sm text-stone-600 pl-6 relative">
                    <span className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-sage-400" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN REPORT PAGE
// ============================================

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.id as string;

  const [plan, setPlan] = useState<StrategicPlan | null>(null);
  const [onePager, setOnePager] = useState<OnePagerData | null>(null);
  const [fullReport, setFullReport] = useState<FullReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'full'>('summary');
  const [copied, setCopied] = useState(false);

  // Load plan and generate reports
  useEffect(() => {
    async function loadAndGenerate() {
      try {
        const storage = getStorageAdapter();
        const loadedPlan = await storage.getPlan(planId);

        if (!loadedPlan) {
          router.push('/dashboard');
          return;
        }

        setPlan(loadedPlan);

        // Load all conversations
        const conversations: Record<PlanPhase, ConversationMessage[]> = {} as any;
        for (const phase of PHASES) {
          conversations[phase] = await storage.getConversation(planId, phase);
        }

        // Generate reports
        const onePagerData = await generateOnePager(loadedPlan, conversations);
        const fullReportData = await generateFullReport(loadedPlan, conversations);

        setOnePager(onePagerData);
        setFullReport(fullReportData);
      } catch (err) {
        console.error('Failed to generate report:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadAndGenerate();
  }, [planId, router]);

  // Download handlers
  const downloadMarkdown = () => {
    if (!onePager && !fullReport) return;

    const content = activeTab === 'summary' 
      ? formatOnePagerMarkdown(onePager!)
      : formatFullReportMarkdown(fullReport!);
    
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${plan?.title.replace(/\s+/g, '-').toLowerCase()}-${activeTab}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadHTML = () => {
    if (!onePager) return;

    const content = formatOnePagerHTML(onePager);
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${plan?.title.replace(/\s+/g, '-').toLowerCase()}-summary.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    if (!onePager && !fullReport) return;

    const content = activeTab === 'summary' 
      ? formatOnePagerMarkdown(onePager!)
      : formatFullReportMarkdown(fullReport!);

    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-sage-200 border-t-sage-500 rounded-full animate-spin" />
          <p className="text-stone-500">Generating your report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero print:bg-white">
      <div className="texture-subtle print:hidden" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 print:hidden">
          <Link
            href={`/plan/${planId}`}
            className="flex items-center gap-2 text-stone-400 hover:text-stone-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Plan</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sage-500 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-stone-700">Aythya Strategy</span>
          </div>
        </div>

        {/* Report Header */}
        <div className="card-elevated mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-display text-display-md text-stone-800">
                {plan?.title}
              </h1>
              <p className="text-stone-500 mt-1">
                Strategic Plan Report • {fullReport?.overallProgress}% Complete
              </p>
            </div>

            {/* Progress Ring */}
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke="#e7e5e4"
                  strokeWidth="6"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke="#6b8e6b"
                  strokeWidth="6"
                  strokeDasharray={`${(fullReport?.overallProgress || 0) * 2.26} 226`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-display text-stone-800">
                  {fullReport?.overallProgress}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 print:hidden">
          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-stone-100 rounded-xl">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'summary'
                  ? 'bg-white text-stone-800 shadow-soft-xs'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              One-Page Summary
            </button>
            <button
              onClick={() => setActiveTab('full')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'full'
                  ? 'bg-white text-stone-800 shadow-soft-xs'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <File className="w-4 h-4 inline mr-2" />
              Full Report
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={copyToClipboard}
              className="btn-ghost btn-sm"
            >
              {copied ? (
                <Check className="w-4 h-4 text-sage-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button onClick={handlePrint} className="btn-ghost btn-sm">
              <Printer className="w-4 h-4" />
              Print
            </button>
            <div className="relative group">
              <button className="btn-primary btn-sm">
                <Download className="w-4 h-4" />
                Download
              </button>
              <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-soft-lg border border-stone-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button
                  onClick={downloadMarkdown}
                  className="w-full px-3 py-2 text-left text-sm text-stone-600 hover:bg-stone-50"
                >
                  Markdown (.md)
                </button>
                <button
                  onClick={downloadHTML}
                  className="w-full px-3 py-2 text-left text-sm text-stone-600 hover:bg-stone-50"
                >
                  HTML (.html)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* One-Page Summary */}
        {activeTab === 'summary' && onePager && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="card-elevated">
              <h2 className="font-display text-lg text-stone-800 mb-3">
                Overview
              </h2>
              <p className="text-stone-600">{onePager.summary}</p>
            </div>

            {/* Pillars */}
            <div className="card-elevated">
              <h2 className="font-display text-lg text-stone-800 mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-sage-500" />
                Strategic Pillars
              </h2>
              <ol className="space-y-2">
                {onePager.pillars.map((pillar, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-sage-100 flex items-center justify-center flex-shrink-0 text-sm font-medium text-sage-700">
                      {i + 1}
                    </span>
                    <span className="text-stone-700">{pillar}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Goals */}
            <div className="card-elevated">
              <h2 className="font-display text-lg text-stone-800 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Top Goals
              </h2>
              <ol className="space-y-2">
                {onePager.topGoals.map((goal, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 text-sm font-medium text-emerald-700">
                      {i + 1}
                    </span>
                    <span className="text-stone-700">{goal}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Insights */}
            <div className="card-elevated">
              <h2 className="font-display text-lg text-stone-800 mb-3 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                Key Insights
              </h2>
              <ul className="space-y-2">
                {onePager.keyInsights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                    <span className="text-stone-700">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Next Steps */}
            <div className="card-elevated">
              <h2 className="font-display text-lg text-stone-800 mb-3 flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-blue-500" />
                Next Steps
              </h2>
              <ol className="space-y-2">
                {onePager.nextSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-sm font-medium text-blue-700">
                      {i + 1}
                    </span>
                    <span className="text-stone-700">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {/* Full Report */}
        {activeTab === 'full' && fullReport && (
          <div className="space-y-4">
            {fullReport.sections.map((section) => (
              <ReportSection
                key={section.phase}
                title={section.title}
                content={section.content}
                insights={section.keyInsights}
                actions={section.actionItems}
                isComplete={section.content !== 'This phase has not been started yet.'}
                defaultOpen={section.phase === 'current_state'}
              />
            ))}

            {/* Overall Insights */}
            {fullReport.conversationHighlights.length > 0 && (
              <div className="card-elevated mt-6">
                <h2 className="font-display text-lg text-stone-800 mb-3">
                  Overall Insights
                </h2>
                <ul className="space-y-2">
                  {fullReport.conversationHighlights.map((highlight, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-sage-400 mt-2 flex-shrink-0" />
                      <span className="text-stone-700">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Share CTA */}
        <div className="mt-8 p-6 bg-sage-50 rounded-2xl border border-sage-200 print:hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <h3 className="font-display text-lg text-stone-800 mb-1">
                Share your plan
              </h3>
              <p className="text-stone-600 text-sm">
                Share your strategic plan with a coach, mentor, or trusted friend
                for feedback and accountability.
              </p>
            </div>
            <Link
              href={`/plan/${planId}/share`}
              className="btn-primary flex-shrink-0"
            >
              <Share2 className="w-4 h-4" />
              Create Share Link
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
