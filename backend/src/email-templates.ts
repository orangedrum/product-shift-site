// Marketing Control Center
// Edit these templates to update your email content.

export const waitlistSubject = "You're on the list! 🚀";
export const waitlistBody = (baseUrl: string) => `
<h2>Thanks for joining the Product Shift waitlist.</h2>
<p>We're onboarding new users every week to ensure the best experience. You've secured your spot.</p>
<p><strong>While you wait:</strong></p>
<ul>
  <li><a href="${baseUrl}/blog">Read our latest UX Audits</a></li>
  <li><a href="${baseUrl}/agency-user-testing">Check out our Agency services</a></li>
</ul>
<p>We'll be in touch soon!</p>
`;

export const welcomeSubject = "Welcome to User Mirror ⚡️";
export const welcomeBody = (baseUrl: string) => `
<h2>You're in!</h2>
<p>Thanks for joining User Mirror. You now have access to advanced AI analysis and detailed reports.</p>
<h3>Getting Started:</h3>
<ol>
  <li><strong>Run your first audit:</strong> Go to the dashboard and enter your URL.</li>
  <li><strong>Download the Extension:</strong> Audit pages while you browse.</li>
  <li><strong>Share reports:</strong> Use the public link feature to share findings with your team.</li>
</ol>
<p><a href="${baseUrl}/ai-powered-ux" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Go to User Mirror</a></p>
`;

// --- Marketing Email Sequence (Daniel Priestley Method) ---
export const marketingEmails = {
  welcome: {
    subject: welcomeSubject,
    body: welcomeBody
  },
  day1: {
    subject: "Your AI test results are ready (and they’re honest)",
    body: (baseUrl: string) => `
      <p>You just saw your website through a stranger's eyes. That uncomfortable feeling? That's where your growth is hiding.</p>
      <p><strong>UX Fact:</strong> Users form an opinion about your site in 0.05 seconds. If they're confused, they leave.</p>
      <p>Use your <strong>3 free credits</strong> to test your most important page (Checkout or Pricing). Don't waste them on the About page.</p>
      <div style="text-align: center; margin-top: 20px;">
        <a href="${baseUrl}/ai-powered-ux" style="background-color: #000; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Run Your First Test</a>
      </div>
    `
  },
  day3: {
    subject: "Pro Tip: Use the User Mirror Chrome Extension 🧩",
    body: (baseUrl: string) => `
      <h2>Audit faster with our Chrome Extension</h2>
      <p>Did you know you don't have to leave your tab to run an audit? Our Chrome Extension lets you capture and analyze any page instantly.</p>
      <div style="text-align: center; margin-top: 20px;">
        <a href="${baseUrl}/extension" style="background-color: #000; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Download Extension</a>
      </div>
    `
  },
  day5: {
    subject: "Stop arguing about button colors",
    body: (baseUrl: string) => `
      <p>Most teams waste hours debating design based on personal preference. "I like blue, you like green." Who cares? What does the <em>user</em> need?</p>
      <p><strong>Priestley Principle:</strong> Become a Key Person of Influence by using data, not opinions.</p>
      <p><strong>CRM Tip:</strong> Data-backed decisions speed up approval cycles by 40%.</p>
      <p>Run a test on a competitor's site. See what they do wrong, and steal what they do right.</p>
      <div style="text-align: center; margin-top: 20px;">
        <a href="${baseUrl}/ai-powered-ux" style="background-color: #000; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Test a Competitor</a>
      </div>
    `
  },
  day7: {
    subject: "The $10,000 mistake on your homepage",
    body: (baseUrl: string) => `
      <p>We analyzed 1,000+ sites. The #1 revenue killer isn't price—it's <em>clarity</em>. If a user has to ask "What do I do next?", you've lost them.</p>
      <p><strong>UX Fact:</strong> Every $1 invested in UX brings $100 in return (Forrester).</p>
      <p>Use the <strong>'Busy Professional'</strong> persona on your site. They have zero patience. If they can't buy in 2 minutes, fix your flow.</p>
      <div style="text-align: center; margin-top: 20px;">
        <a href="${baseUrl}/ai-powered-ux" style="background-color: #000; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Test for Clarity</a>
      </div>
    `
  },
  day10: {
    subject: "How agencies cut bounce rates in half",
    body: (baseUrl: string) => `
      <p>They thought their new design was perfect. User Mirror showed them that the 'Sign Up' button looked like a banner ad. They fixed it in 5 minutes.</p>
      <p><strong>Priestley Principle:</strong> "Signaling"—show that others are getting results.</p>
      <p>You have credits left. Use them before you launch your next campaign.</p>
      <div style="text-align: center; margin-top: 20px;">
        <a href="${baseUrl}/ai-powered-ux" style="background-color: #000; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Use Your Credits</a>
      </div>
    `
  },
  day12: {
    subject: "I want to help you scale this",
    body: (baseUrl: string) => `
      <p>You've seen the insights. Now it's time to make this a habit. Consistent testing is the difference between a stagnant site and a growth engine.</p>
      <p>Upgrade to the <strong>Agency Plan</strong> today and get unlimited tests with your own API key. Stop guessing, start knowing.</p>
      <div style="text-align: center; margin-top: 20px;">
        <a href="${baseUrl}/agency-user-testing" style="background-color: #000; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Get the Agency Plan</a>
      </div>
    `
  }
};