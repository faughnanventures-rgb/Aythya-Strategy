import Link from 'next/link';
import { ArrowLeft, Leaf, Cookie, Shield, Settings } from 'lucide-react';

export const metadata = {
  title: 'Cookie Policy',
  description: 'Cookie Policy for Aythya Strategy',
};

export default function CookiePolicyPage() {
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
            Cookie Policy
          </h1>
          <p className="text-stone-500 mb-8">Last updated: {lastUpdated}</p>

          {/* Summary */}
          <div className="bg-sage-50 border border-sage-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Cookie className="w-5 h-5 text-sage-600" />
              <h2 className="font-display text-lg text-stone-800">
                Simple Summary
              </h2>
            </div>
            <p className="text-stone-600">
              We use <strong>essential cookies only</strong> — the minimum required 
              to make the service work. No tracking, no advertising, no third-party 
              cookies. Your privacy is protected.
            </p>
          </div>

          <div className="prose-calm space-y-8">
            <section>
              <h2 className="font-display text-xl text-stone-800 mb-3">
                1. What Are Cookies?
              </h2>
              <p>
                Cookies are small text files stored on your device when you visit 
                websites. They help websites remember information about your visit, 
                like your preferences or login status.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-stone-800 mb-3">
                2. Cookies We Use
              </h2>
              <p>
                We only use essential cookies necessary for the service to function:
              </p>

              <div className="mt-4 space-y-4">
                {/* Cookie 1 */}
                <div className="bg-stone-50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sage-100 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-4 h-4 text-sage-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-stone-700">session_id</p>
                        <span className="text-xs bg-sage-100 text-sage-700 px-2 py-1 rounded-full">
                          Essential
                        </span>
                      </div>
                      <p className="text-stone-500 text-sm mt-1">
                        Maintains your planning session so you can continue where 
                        you left off.
                      </p>
                      <div className="flex gap-4 mt-2 text-xs text-stone-400">
                        <span>Duration: 30 days</span>
                        <span>HttpOnly: Yes</span>
                        <span>Secure: Yes (production)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cookie 2 */}
                <div className="bg-stone-50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sage-100 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-4 h-4 text-sage-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-stone-700">csrf_token</p>
                        <span className="text-xs bg-sage-100 text-sage-700 px-2 py-1 rounded-full">
                          Security
                        </span>
                      </div>
                      <p className="text-stone-500 text-sm mt-1">
                        Protects against cross-site request forgery attacks. 
                        Ensures requests come from your browser session.
                      </p>
                      <div className="flex gap-4 mt-2 text-xs text-stone-400">
                        <span>Duration: 24 hours</span>
                        <span>HttpOnly: Yes</span>
                        <span>Secure: Yes (production)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cookie 3 */}
                <div className="bg-stone-50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                      <Settings className="w-4 h-4 text-stone-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-stone-700">cookie_consent</p>
                        <span className="text-xs bg-stone-100 text-stone-600 px-2 py-1 rounded-full">
                          Preference
                        </span>
                      </div>
                      <p className="text-stone-500 text-sm mt-1">
                        Remembers that you&apos;ve acknowledged the cookie notice so 
                        we don&apos;t show it again.
                      </p>
                      <div className="flex gap-4 mt-2 text-xs text-stone-400">
                        <span>Duration: 1 year</span>
                        <span>HttpOnly: No</span>
                        <span>Secure: Yes (production)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl text-stone-800 mb-3">
                3. What We Don&apos;t Use
              </h2>
              <p>We explicitly do <strong>not</strong> use:</p>
              <ul className="list-disc pl-5 mt-2 space-y-2">
                <li>
                  <strong>Analytics cookies</strong> — No Google Analytics, Mixpanel, 
                  or similar tracking
                </li>
                <li>
                  <strong>Advertising cookies</strong> — No ad networks, no retargeting
                </li>
                <li>
                  <strong>Social media cookies</strong> — No Facebook Pixel, Twitter 
                  tags, etc.
                </li>
                <li>
                  <strong>Third-party cookies</strong> — No external services that 
                  track you across sites
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl text-stone-800 mb-3">
                4. Local Storage
              </h2>
              <p>
                In addition to cookies, we use your browser&apos;s localStorage to 
                store your planning data:
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-3">
                <p className="text-blue-700 text-sm">
                  <strong>aythya_plans</strong> — Your strategic plans<br />
                  <strong>aythya_conversations</strong> — Your chat history with the AI<br />
                  <br />
                  This data never leaves your browser unless you&apos;re actively 
                  chatting (in which case messages are temporarily sent to generate 
                  AI responses).
                </p>
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl text-stone-800 mb-3">
                5. Managing Cookies
              </h2>
              <p>
                You can control cookies through your browser settings. Most browsers 
                allow you to:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-2">
                <li>View what cookies are stored</li>
                <li>Delete specific cookies or all cookies</li>
                <li>Block cookies from certain sites</li>
                <li>Block all third-party cookies</li>
              </ul>
              <p className="mt-4">
                <strong>Note:</strong> Blocking our essential cookies will prevent 
                the service from working properly. Your session won&apos;t be 
                maintained, and security features won&apos;t function.
              </p>

              <div className="mt-4">
                <p className="text-sm text-stone-600 mb-2">
                  Browser-specific instructions:
                </p>
                <ul className="text-sm space-y-1">
                  <li>
                    <a 
                      href="https://support.google.com/chrome/answer/95647" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sage-600 hover:text-sage-700 underline"
                    >
                      Google Chrome
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sage-600 hover:text-sage-700 underline"
                    >
                      Mozilla Firefox
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sage-600 hover:text-sage-700 underline"
                    >
                      Safari
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sage-600 hover:text-sage-700 underline"
                    >
                      Microsoft Edge
                    </a>
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl text-stone-800 mb-3">
                6. Changes to This Policy
              </h2>
              <p>
                If we change our cookie practices, we&apos;ll update this policy and 
                the &ldquo;Last updated&rdquo; date. For significant changes, we may also 
                show a new cookie notice.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-stone-800 mb-3">
                7. Contact Us
              </h2>
              <p>
                Questions about our cookie practices? Contact us at:{' '}
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
          <Link href="/privacy" className="hover:text-stone-700 transition-colors">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
