import Link from 'next/link';
import { ArrowLeft, Leaf, Shield, Eye, Trash2, Lock } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for Aythya Strategy',
};

export default function PrivacyPolicyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-stone-500 mb-8">Last updated: {lastUpdated}</p>

          {/* Quick Summary */}
          <div className="bg-sage-50 border border-sage-200 rounded-xl p-6 mb-8">
            <h2 className="font-display text-lg text-stone-800 mb-4">
              Privacy at a Glance
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-sage-100 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-4 h-4 text-sage-600" />
                </div>
                <div>
                  <p className="font-medium text-stone-700 text-sm">Local Storage</p>
                  <p className="text-stone-500 text-xs">Your plans stay in your browser</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-sage-100 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-sage-600" />
                </div>
                <div>
                  <p className="font-medium text-stone-700 text-sm">Encrypted Transmission</p>
                  <p className="text-stone-500 text-xs">HTTPS for all communications</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-sage-100 flex items-center justify-center flex-shrink-0">
                  <Eye className="w-4 h-4 text-sage-600" />
                </div>
                <div>
                  <p className="font-medium text-stone-700 text-sm">No Tracking</p>
                  <p className="text-stone-500 text-xs">No third-party analytics</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-sage-100 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-4 h-4 text-sage-600" />
                </div>
                <div>
                  <p className="font-medium text-stone-700 text-sm">You Control Deletion</p>
                  <p className="text-stone-500 text-xs">Clear your data anytime</p>
                </div>
              </div>
            </div>
          </div>

          <div className="prose-calm space-y-8">
            <section>
              <h2 className="font-display text-xl text-stone-800 mb-3">
                1. Introduction
              </h2>
              <p>
                Aythya Strategy (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;the Service&rdquo;) is committed to 
                protecting your privacy. This policy explains how we handle your 
                information when you use our strategic life planning service.
              </p>
              <p className="mt-2">
                We designed this service with privacy as a priority. Your personal 
                strategic plans and conversations are sensitive, and we treat them accordingly.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-stone-800 mb-3">
                2. Information We Collect
              </h2>
              
              <h3 className="font-medium text-stone-700 mt-4 mb-2">
                2.1 Information You Provide
              </h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Planning Content:</strong> The messages you send during 
                  planning conversations, including personal reflections, goals, 
                  and life circumstances you choose to share.
                </li>
                <li>
                  <strong>Plan Data:</strong> Strategic plans you create, including 
                  pillars, goals, and relationship information.
                </li>
              </ul>

              <h3 className="font-medium text-stone-700 mt-4 mb-2">
                2.2 Automatically Collected Information
              </h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Session Information:</strong> A randomly generated session 
                  identifier stored in your browser to maintain your planning session.
                </li>
                <li>
                  <strong>Technical Data:</strong> Basic technical information needed 
                  to operate the service (browser type, general errors).
                </li>
              </ul>

              <h3 className="font-medium text-stone-700 mt-4 mb-2">
                2.3 What We Don&apos;t Collect
              </h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>We do not use third-party analytics or tracking cookies</li>
                <li>We do not collect your IP address for profiling</li>
                <li>We do not build advertising profiles</li>
                <li>We do not sell or share your data with data brokers</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl text-stone-800 mb-3">
                3. How Your Data is Stored
              </h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 my-4">
                <p className="text-blue-800 font-medium mb-2">
                  📍 Current Implementation: Browser Storage
                </p>
                <p className="text-blue-700 text-sm">
                  In the current version, your planning data is stored locally in 
                  your web browser using localStorage. This means:
                </p>
                <ul className="text-blue-700 text-sm mt-2 space-y-1 list-disc pl-5">
                  <li>Your data stays on your device</li>
                  <li>We cannot access your stored plans</li>
                  <li>Clearing browser data will delete your plans</li>
                  <li>Data is specific to your browser and device</li>
                </ul>
              </div>

              <p>
                When you send a message, it is temporarily transmitted to our servers 
                and forwarded to Anthropic&apos;s AI (Claude) to generate a response. 
                The conversation is then stored back in your browser.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-stone-800 mb-3">
                4. AI Processing & Third Parties
              </h2>
              <p>
                We use Anthropic&apos;s Claude AI to power the planning conversations. 
                When you send a message:
              </p>
              <ol className="list-decimal pl-5 mt-2 space-y-2">
                <li>Your message is sent to our server over HTTPS</li>
                <li>Our server forwards the message to Anthropic&apos;s API</li>
                <li>Claude generates a response</li>
                <li>The response is returned to your browser</li>
              </ol>
              <p className="mt-4">
                <strong>Anthropic&apos;s Data Practices:</strong> Anthropic processes 
                your messages to generate responses. According to Anthropic&apos;s policies, 
                they do not use API customer data to train their models. Please review{' '}
                <a 
                  href="https://www.anthropic.com/privacy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sage-600 hover:text-sage-700 underline"
                >
                  Anthropic&apos;s Privacy Policy
                </a>{' '}
                for complete details.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-stone-800 mb-3">
                5. How We Use Your Information
              </h2>
              <p>We use your information solely to:</p>
              <ul className="list-disc pl-5 mt-2 space-y-2">
                <li>Provide the strategic planning service</li>
                <li>Generate AI-powered responses to your messages</li>
                <li>Maintain your planning session across visits</li>
                <li>Improve the service (using aggregated, anonymized data only)</li>
              </ul>
              <p className="mt-4">
                We do <strong>not</strong> use your personal planning content for:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-2">
                <li>Advertising or marketing profiling</li>
                <li>Selling to third parties</li>
                <li>Training AI models (we do not retain conversation content)</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl text-stone-800 mb-3">
                6. Data Security
              </h2>
              <p>We implement security measures including:</p>
              <ul className="list-disc pl-5 mt-2 space-y-2">
                <li>HTTPS encryption for all data transmission</li>
                <li>Secure HTTP headers (HSTS, CSP, XSS protection)</li>
                <li>Input validation and sanitization</li>
                <li>Rate limiting to prevent abuse</li>
                <li>No storage of sensitive data on our servers</li>
              </ul>
              <p className="mt-4">
                However, no method of electronic transmission or storage is 100% 
                secure. We cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-stone-800 mb-3">
                7. Your Rights & Choices
              </h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-5 mt-2 space-y-2">
                <li>
                  <strong>Access:</strong> View your stored planning data by 
                  accessing the service in the same browser
                </li>
                <li>
                  <strong>Delete:</strong> Clear your browser&apos;s localStorage to 
                  delete all your planning data
                </li>
                <li>
                  <strong>Export:</strong> Copy your plan content before clearing 
                  (feature coming soon)
                </li>
                <li>
                  <strong>Opt-out:</strong> Stop using the service at any time
                </li>
              </ul>
              
              <div className="bg-stone-100 rounded-xl p-4 mt-4">
                <p className="text-stone-700 text-sm">
                  <strong>To delete your data:</strong> Open your browser settings, 
                  find &ldquo;Clear browsing data&rdquo; or &ldquo;Site Settings,&rdquo; and clear 
                  localStorage for this site. This will permanently delete all 
                  your plans and conversations.
                </p>
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl text-stone-800 mb-3">
                8. Cookies & Similar Technologies
              </h2>
              <p>
                We use essential cookies only. See our{' '}
                <Link href="/cookies" className="text-sage-600 hover:text-sage-700 underline">
                  Cookie Policy
                </Link>{' '}
                for details.
              </p>
              <p className="mt-2">
                We do not use advertising cookies or third-party tracking cookies.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-stone-800 mb-3">
                9. Children&apos;s Privacy
              </h2>
              <p>
                This Service is not intended for users under 18 years of age. We do 
                not knowingly collect information from children. If you believe a 
                child has provided us with personal information, please contact us.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-stone-800 mb-3">
                10. International Users
              </h2>
              <p>
                This Service is operated from the United States. If you are accessing 
                from the European Union, United Kingdom, or other regions with data 
                protection laws, please note that your information may be transferred 
                to and processed in the United States.
              </p>
              <p className="mt-2">
                By using the Service, you consent to this transfer. We comply with 
                applicable data protection laws to the extent feasible.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-stone-800 mb-3">
                11. Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify 
                you of changes by updating the &ldquo;Last updated&rdquo; date. We encourage 
                you to review this policy periodically.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-stone-800 mb-3">
                12. Contact Us
              </h2>
              <p>
                If you have questions about this Privacy Policy or our practices, 
                contact us at:{' '}
                <a 
                  href="mailto:privacy@aythya.strategy" 
                  className="text-sage-600 hover:text-sage-700 underline"
                >
                  privacy@aythya.strategy
                </a>
              </p>
            </section>
          </div>
        </div>

        {/* Footer links */}
        <div className="mt-8 flex justify-center gap-6 text-sm text-stone-500">
          <Link href="/terms" className="hover:text-stone-700 transition-colors">
            Terms of Service
          </Link>
          <Link href="/cookies" className="hover:text-stone-700 transition-colors">
            Cookie Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
