// app/privacy-policy/page.tsx - Fixed unescaped apostrophe error

import Header from '@/components/Header';

// DISCLAIMER: This is a template and not legal advice.
// For full legal compliance, consult with a legal professional.

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <Header />
      <main className="px-6 py-8">
        <div className="max-w-4xl mx-auto bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8">
          <h1 className="text-3xl font-bold mb-6">Privacy Policy for Seek Clan</h1>
          <p className="text-gray-400 mb-6">Last Updated: [Date of Deployment]</p>

          <div className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold text-orange-400 mb-3">1. Introduction</h2>
              <p>Welcome to the Seek clan website. We are committed to protecting your privacy. This Privacy Policy explains what information we collect, how we use it, and what your rights are. By using our website, you agree to the collection and use of information in accordance with this policy.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-orange-400 mb-3">2. Data We Collect</h2>
              <p>We collect the following types of information:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li><strong>User-Submitted Data:</strong> When you submit a bounty or personal best, we collect your in-game player name and the screenshot you provide as proof.</li>
                <li><strong>Admin Data:</strong> For admin access, we store your email address for authentication purposes.</li>
                <li><strong>Public Game Data:</strong> We fetch public data associated with your in-game name from the Wise Old Man (WOM) API, including your EHB, EHP, TTM, account type, and other gameplay statistics.</li>
                <li><strong>Cookies:</strong> We use cookies to manage your session and consent preferences.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-orange-400 mb-3">3. How We Use Your Data</h2>
              <p>Your data is used for the following purposes:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>To display bounty completions, leaderboards, and personal bests on the website.</li>
                <li>To calculate and display clan ranks based on the criteria outlined on the site.</li>
                <li>To secure and provide access to the admin panel.</li>
                <li>To ensure the functionality of the website through essential cookies.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-orange-400 mb-3">4. Cookie Policy</h2>
              <p>Cookies are small files stored on your device. We use them to make our site work. You can choose to accept or decline our use of cookies.</p>
              <p className="mt-2"><strong className="text-white">Please note:</strong> Declining cookies will prevent the site from remembering your login session, meaning you will be unable to access the admin panel.</p>
              <p className="mt-4">We use the following cookies:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-2">
                <li>
                  <strong className="text-white">cookie_consent:</strong> This cookie stores your preference (accept or decline) for our cookie policy so we don't have to ask you on every visit. It expires after one year.
                </li>
                <li>
                  <strong className="text-white">sb-....-auth-token:</strong> This is a group of essential cookies set by our backend provider, Supabase, when you log in as an administrator. They securely manage your authentication session. These cookies are strictly necessary for the admin functionality to work.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-orange-400 mb-3">5. Data Sharing and Security</h2>
              <p>We do not sell or share your personal data with third-party advertisers. Your data is stored securely with our backend provider, Supabase. We take reasonable measures to protect your information, but no method of transmission over the internet is 100% secure.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-orange-400 mb-3">6. Contact Us</h2>
              <p>If you have any questions about this Privacy Policy, please contact the clan leadership.</p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}