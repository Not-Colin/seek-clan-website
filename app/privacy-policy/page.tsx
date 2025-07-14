// app/privacy-policy/page.tsx - FINAL with GDPR enhancements and contact info

import Header from '@/components/Header';

// DISCLAIMER: This is a template and not legal advice.
// For full legal compliance, consult with a legal professional.

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <Header />
      <main className="px-6 py-8">
        <div className="max-w-4xl mx-auto bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8">
          <h1 className="text-3xl font-bold mb-6">{"Privacy Policy for Seek Clan"}</h1>
          <p className="text-gray-400 mb-6">{"Last Updated: 14th of July 2025"}</p>

          <div className="space-y-8 text-gray-300">
            {/* Section 1: Introduction (Unchanged) */}
            <section>
              <h2 className="text-2xl font-semibold text-orange-400 mb-3">{"1. Introduction"}</h2>
              <p>{"Welcome to the Seek clan website. We are committed to protecting your privacy. This Privacy Policy explains what information we collect, how we use it, and what your rights are."}</p>
            </section>

            {/* Section 2: Data We Collect (Unchanged) */}
            <section>
              <h2 className="text-2xl font-semibold text-orange-400 mb-3">{"2. Data We Collect"}</h2>
              <p>{"We collect the following types of information:"}</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li><strong>{"User-Submitted Data:"}</strong> {"When you submit a bounty or personal best, we collect your in-game player name and the screenshot you provide as proof."}</li>
                <li><strong>{"Admin Data:"}</strong> {"For admin access, we store your email address for authentication purposes."}</li>
                <li><strong>{"Public Game Data:"}</strong> {"We fetch public data associated with your in-game name from the Wise Old Man (WOM) API, including your EHB, EHP, TTM, account type, and other gameplay statistics."}</li>
              </ul>
            </section>

            {/* Section 3: How We Use Your Data (Unchanged) */}
            <section>
              <h2 className="text-2xl font-semibold text-orange-400 mb-3">{"3. How We Use Your Data"}</h2>
              <p>{"Your data is used for the following purposes:"}</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>{"To display bounty completions, leaderboards, and personal bests on the website."}</li>
                <li>{"To calculate and display clan ranks based on the criteria outlined on the site."}</li>
                <li>{"To secure and provide access to the admin panel."}</li>
              </ul>
            </section>

            {/* Section 4: Lawful Basis (NEW) */}
            <section>
              <h2 className="text-2xl font-semibold text-orange-400 mb-3">{"4. Lawful Basis for Processing"}</h2>
              <p>{"We process your data based on our "}<strong className="text-white">{"Legitimate Interest"}</strong>{" to operate a functional and engaging community website for the members of the Seek clan. This includes features like highscores and activity tracking that are standard for such communities."}</p>
            </section>

            {/* Section 5: Data Retention (NEW) */}
            <section>
              <h2 className="text-2xl font-semibold text-orange-400 mb-3">{"5. Data Retention"}</h2>
              <p>{"We retain user-submitted data and cached game data indefinitely to maintain historical clan records and leaderboards. However, you have the right to request the deletion of your data at any time, as outlined in the sections below."}</p>
            </section>

            {/* Section 6: Data Sharing and Security (Unchanged, renumbered) */}
            <section>
              <h2 className="text-2xl font-semibold text-orange-400 mb-3">{"6. Data Sharing and Security"}</h2>
              <p>{"We do not sell or share your personal data with third-party advertisers. Your data is stored securely with our backend provider, Supabase, and the website is hosted on Vercel. We take reasonable measures to protect your information, but no method of transmission over the internet is 100% secure."}</p>
            </section>

            {/* Section 7: Cookie Policy (Unchanged, renumbered) */}
            <section>
              <h2 className="text-2xl font-semibold text-orange-400 mb-3">{"7. Cookie Policy"}</h2>
              <p>{"Cookies are small files stored on your device. We use them to make our site work. You can choose to accept or decline our use of non-essential cookies via the cookie banner."}</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-2">
                <li>
                  <strong className="text-white">{"cookie_consent:"}</strong> {"This cookie stores your preference (accept or decline) for our cookie policy so we don't have to ask you on every visit. It expires after one year."}
                </li>
                <li>
                  <strong className="text-white">{"sb-....-auth-token:"}</strong> {"This is a group of essential cookies set by Supabase when you log in as an administrator. They securely manage your authentication session and are strictly necessary for the admin functionality to work."}
                </li>
              </ul>
            </section>

            {/* Section 8: Your Data Protection Rights (NEW) */}
            <section>
              <h2 className="text-2xl font-semibold text-orange-400 mb-3">{"8. Your Data Protection Rights"}</h2>
              <p>{"Under GDPR, you have the following rights regarding your data:"}</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li><strong>{"The right to access"}</strong> – {"You can ask for copies of your personal data."}</li>
                <li><strong>{"The right to rectification"}</strong> – {"You can ask us to correct any information you believe is inaccurate or incomplete."}</li>
                <li><strong>{"The right to erasure (Right to be Forgotten)"}</strong> – {"You can ask us to erase your personal data, such as your submissions and payout proofs."}</li>
                <li><strong>{"The right to restrict processing"}</strong> – {"You can ask us to restrict the processing of your data under certain conditions."}</li>
              </ul>
            </section>

            {/* Section 9: How to Exercise Your Rights (NEW, replaces Contact Us) */}
            <section>
              <h2 className="text-2xl font-semibold text-orange-400 mb-3">{"9. How to Exercise Your Rights"}</h2>
              <p>{"To exercise any of your rights listed above, please contact our data protection point of contact directly on Discord. We will respond to your request within a reasonable timeframe."}</p>
              <p className="mt-2">{"Discord Username: "}<strong className="text-white">{"not_colin"}</strong></p>
            </section>

            {/* Section 10: Changes to this Policy (NEW) */}
            <section>
              <h2 className="text-2xl font-semibold text-orange-400 mb-3">{"10. Changes to This Privacy Policy"}</h2>
              <p>{"We may update this policy from time to time. The latest version will always be available on this page, with the 'Last Updated' date reflecting the most recent changes."}</p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}