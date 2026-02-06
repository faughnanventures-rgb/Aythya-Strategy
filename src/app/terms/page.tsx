import Link from 'next/link';
import { ArrowLeft, Leaf } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for Aythya Strategy',
};

export default function TermsOfServicePage() {
  const lastUpdated = 'February 3, 2025';
  
  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <Link
            href="/"
            className="flex items-center gap-2 text-stone-400 hover:text-stone-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sage-500 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-stone-700">Aythya Strategy</span>
          </div>
        </div>

        {/* Content */}
        <div className="card-elevated">
          <h1 className="font-display text-display-md text-stone-800 mb-2">
            Terms of Service
          </h1>
          <p className="text-stone-500 mb-8">Last updated: {lastUpdated}</p>

          <div className="prose-calm space-y-8">
            <section>
              <h2 className="font-display text-xl text-stone-800 mb-3">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing or using Aythya Strategy (&ldquo;the Service&rdquo;), you agree to be 
                bound by these Terms of Service. If you do not agree to these terms, 
                please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-stone-800 mb-3">
                2. Description of Service
              </h2>
              <p>
                Aythya Strategy is a strategic life planning tool that uses artificial 
                intelligence to facilitate personal planning conversations. The Service 
                is designed to help you think through life decisions, but it is not a 
                substitute for professional advice.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-stone-800 mb-3">
                3. Important Disclaimers
              </h2>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 my-4">
                <p className="text-amber-800 font-medium mb-2">
                  ⚠️ AI Limitations & Professional Advice
                </p>
                <p className="text-amber-700 text-sm">
                  The AI-generated content provided by this Service is for informational 
                  and reflective purposes only. It should NOT be considered:
                </p>
                <ul className="text-amber-700 text-sm mt-2 space-y-1 list-disc pl-5">
                  <li>Professional financial, legal, or investment advice</li>
                  <li>Medical, psychological, or therapeutic treatment</li>
                  <li>Career counseling from a licensed professional</li>
                  <li>A substitute for consultation with qualified experts</li>
                </ul>
              </div>
              <p>
                Always consult with qualified professionals for important life decisions 
                involving finances, legal matters, health, or mental wellbeing.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-stone-800 mb-3">
                4. User Responsibilities
              </h2>
              <p>You agree to:</p>
              <ul className="list-disc pl-5 mt-2 space-y-2">
                <li>Provide accurate information when using the Service</li>
                <li>Use the Service only for lawful purposes</li>
                <li>Not attempt to circumvent security measures</li>
                <li>Not use the Service to harm yourself or others</li>
                <li>Take responsibility for decisions made based on AI conversations</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl text-stone-800 mb-3">
                5. Intellectual Property
              </h2>
              <p>
                Your inputs and the strategic plans you create remain yours. However, 
                you grant us a limited license to process your inputs through our AI 
                system to provide the Service.
              </p>
              <p className="mt-2">
                The Service itself, including its design, code, and AI prompts, is 
                owned by Aythya Strategy and protected by intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-stone-800 mb-3">
                6. Data & Privacy
              </h2>
              <p>
                Your use of the Service is also governed by our{' '}
                <Link href="/privacy" className="text-sage-600 hover:text-sage-700 underline">
                  Privacy Policy
                </Link>
                , which describes how we collect, use, and protect your data.
              </p>
              <p className="mt-2">
                In the current version, your data is stored locally in your browser. 
                We do not have access to your personal planning information unless 
                you explicitly share it with us.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-stone-800 mb-3">
                7. AI & Third-Party Services
              </h2>
              <p>
                This Service uses Anthropic&apos;s Claude AI to power conversations. 
                When you use the Service, your messages are processed by Anthropic&apos;s 
                API. Anthropic&apos;s use of data is governed by their own privacy policy 
                and terms of service.
              </p>
              <p className="mt-2">
                We do not share your data with other third parties except as necessary 
                to provide the Service.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-stone-800 mb-3">
                8. Limitation of Liability
              </h2>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, AYTHYA STRATEGY SHALL NOT BE 
                LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE 
                DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR OTHER 
                INTANGIBLE LOSSES, RESULTING FROM:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-2">
                <li>Your use or inability to use the Service</li>
                <li>Any decisions made based on AI-generated content</li>
                <li>Unauthorized access to your data</li>
                <li>Service interruptions or errors</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl text-stone-800 mb-3">
                9. Service Availability
              </h2>
              <p>
                We strive to keep the Service available but do not guarantee 
                uninterrupted access. We may modify, suspend, or discontinue the 
                Service at any time without notice.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-stone-800 mb-3">
                10. Changes to Terms
              </h2>
              <p>
                We may update these Terms from time to time. Continued use of the 
                Service after changes constitutes acceptance of the new terms. We 
                will make reasonable efforts to notify users of significant changes.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-stone-800 mb-3">
                11. Termination
              </h2>
              <p>
                We reserve the right to terminate or suspend your access to the 
                Service at our discretion, without notice, for conduct that we 
                believe violates these Terms or is harmful to other users or the Service.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-stone-800 mb-3">
                12. Governing Law
              </h2>
              <p>
                These Terms shall be governed by and construed in accordance with 
                the laws of the United States, without regard to conflict of law principles.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-stone-800 mb-3">
                13. Contact
              </h2>
              <p>
                If you have questions about these Terms, please contact us at:{' '}
                <a 
                  href="mailto:legal@aythya.strategy" 
                  className="text-sage-600 hover:text-sage-700 underline"
                >
                  legal@aythya.strategy
                </a>
              </p>
            </section>
          </div>
        </div>

        {/* Footer links */}
        <div className="mt-8 flex justify-center gap-6 text-sm text-stone-500">
          <Link href="/privacy" className="hover:text-stone-700 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/cookies" className="hover:text-stone-700 transition-colors">
            Cookie Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
