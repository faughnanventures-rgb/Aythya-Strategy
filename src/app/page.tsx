import Link from 'next/link';
import { ArrowRight, Feather, Sparkles, Heart, Compass, Leaf } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-hero relative">
      {/* Subtle texture overlay */}
      <div className="texture-subtle" />
      
      {/* Navigation */}
      <nav className="relative z-10 max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-sage-500 flex items-center justify-center shadow-soft-sm group-hover:shadow-glow transition-all duration-400">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-xl text-stone-800 tracking-tight">
              Aythya Strategy
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-stone-500 hover:text-stone-700 font-medium px-4 py-2 transition-colors duration-300"
            >
              My Plans
            </Link>
            <Link href="/onboarding" className="btn-primary btn-sm">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-12 pb-16 sm:pt-16 sm:pb-20">
        <div className="max-w-3xl">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-sage-50 rounded-full border border-sage-200/50 mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-sage-500" />
            <span className="text-sm font-medium text-sage-700">
              Strategic clarity for life&apos;s transitions
            </span>
          </div>
          
          {/* Headline */}
          <h1 className="font-display text-display-2xl text-stone-800 mb-6 text-balance animate-fade-in-up">
            Find your direction
            <span className="block text-sage-600">with intention</span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-xl text-stone-500 mb-10 max-w-2xl leading-relaxed text-pretty animate-fade-in-up delay-100">
            A thoughtful framework for creating your personal strategic plan. 
            Navigate career changes, life transitions, and personal growth with 
            the same rigor businesses use—adapted for the complexity of human life.
          </p>
          
          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up delay-200">
            <Link href="/onboarding" className="btn-primary btn-lg group">
              Begin Your Journey
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="#approach" className="btn-secondary btn-lg">
              Learn More
            </Link>
          </div>
        </div>
        
        {/* Floating accent element */}
        <div className="hidden lg:block absolute right-12 top-32 w-72 h-72 bg-gradient-radial from-sage-200/30 to-transparent rounded-full blur-3xl animate-breathe" />
      </section>

      {/* Divider */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="divider" />
      </div>

      {/* Approach Section */}
      <section id="approach" className="relative z-10 max-w-6xl mx-auto px-6 py-16 sm:py-20">
        <div className="max-w-2xl mb-16">
          <h2 className="font-display text-display-lg text-stone-800 mb-4">
            A different kind of planning
          </h2>
          <p className="text-lg text-stone-500 leading-relaxed">
            Not therapy. Not life coaching. This is strategic thinking for your life—
            bringing structure to complexity without losing the human element.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Feather,
              title: 'Reflective',
              description:
                'Start by understanding where you are. Map your assets, constraints, and what gives you energy before deciding where to go.',
            },
            {
              icon: Compass,
              title: 'Strategic',
              description:
                'Define 2-3 focus areas that organize your energy. Set meaningful goals with realistic timelines—not a to-do list.',
            },
            {
              icon: Heart,
              title: 'Human',
              description:
                'Acknowledge the complexity of real life. Relationships, health, transitions—all woven into a coherent plan.',
            },
          ].map((item, index) => (
            <div
              key={item.title}
              className="card-elevated group animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-xl bg-sage-50 flex items-center justify-center mb-5 group-hover:bg-sage-100 transition-colors duration-300">
                <item.icon className="w-6 h-6 text-sage-600" />
              </div>
              <h3 className="font-display text-xl text-stone-800 mb-3">
                {item.title}
              </h3>
              <p className="text-stone-500 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Process Section */}
      <section className="relative z-10 bg-cream-50/50 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-display text-display-lg text-stone-800 mb-6">
                Eight phases to clarity
              </h2>
              <p className="text-lg text-stone-500 mb-10 leading-relaxed">
                Work through a comprehensive framework at your own pace. 
                Each phase builds understanding, creating a complete picture 
                of where you are and where you&apos;re going.
              </p>
              
              <div className="space-y-3">
                {[
                  'Current State Analysis',
                  'Energy Audit',
                  'Minimum Viable Stability',
                  'Strategic Pillars',
                  'Tactical Mapping',
                  'Goal Setting',
                  'Relationship Audit',
                  'Reflection & Meaning',
                ].map((phase, index) => (
                  <div
                    key={phase}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/60 transition-colors duration-300 group"
                  >
                    <span className="w-8 h-8 rounded-lg bg-sage-100 flex items-center justify-center text-sage-600 font-mono text-sm font-medium group-hover:bg-sage-200 transition-colors">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-stone-700 font-medium">{phase}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Visual element */}
            <div className="relative">
              <div className="aspect-[4/3] bg-gradient-to-br from-sage-100 to-cream-100 rounded-3xl flex items-center justify-center overflow-hidden">
                <div className="text-center p-8">
                  <div className="w-16 h-16 rounded-2xl bg-white shadow-soft-md mx-auto mb-6 flex items-center justify-center">
                    <Leaf className="w-8 h-8 text-sage-500" />
                  </div>
                  <p className="font-display text-xl text-stone-700 mb-2">
                    Guided by thoughtful questions
                  </p>
                  <p className="text-stone-500">
                    AI-facilitated conversations that help you discover your own answers
                  </p>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-sage-200/30 rounded-full blur-2xl" />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-cream-300/40 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-16 sm:py-20">
        <div className="text-center mb-16">
          <h2 className="font-display text-display-lg text-stone-800 mb-4">
            For people navigating change
          </h2>
          <p className="text-lg text-stone-500">
            Especially useful during life&apos;s pivotal moments
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-3">
          {[
            'Career Transitions',
            'Starting Over',
            'Health Journeys',
            'Relationship Changes',
            'Empty Nest',
            'Retirement Planning',
            'Personal Reinvention',
            'Finding Purpose',
          ].map((item) => (
            <span
              key={item}
              className="px-5 py-2.5 bg-white rounded-full text-stone-600 border border-stone-200/60 hover:border-sage-300 hover:bg-sage-50/50 transition-all duration-300 cursor-default"
            >
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-16 sm:pb-20">
        <div className="card-elevated text-center py-16 sm:py-20 bg-gradient-to-b from-sage-50/50 to-cream-50/30">
          <h2 className="font-display text-display-md text-stone-800 mb-4 max-w-xl mx-auto text-balance">
            Ready to create your strategic plan?
          </h2>
          <p className="text-lg text-stone-500 mb-8 max-w-lg mx-auto">
            Take the first step toward clarity. Complete in one session or across multiple conversations.
          </p>
          <Link href="/onboarding" className="btn-primary btn-lg group">
            Begin Your Journey
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-stone-200/60 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sage-500 flex items-center justify-center">
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <span className="font-display text-stone-700">Aythya Strategy</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-stone-500">
              <Link href="/terms" className="hover:text-stone-700 transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-stone-700 transition-colors">
                Privacy
              </Link>
              <Link href="/cookies" className="hover:text-stone-700 transition-colors">
                Cookies
              </Link>
            </div>
            <p className="text-sm text-stone-400">
              © {new Date().getFullYear()} Aythya Strategy
            </p>
          </div>
          
          {/* AI Disclaimer */}
          <div className="mt-6 pt-6 border-t border-stone-100">
            <p className="text-xs text-stone-400 text-center max-w-2xl mx-auto">
              Aythya Strategy uses AI to facilitate planning conversations. It is not a 
              substitute for professional financial, legal, medical, or mental health advice. 
              Always consult qualified professionals for important decisions.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
