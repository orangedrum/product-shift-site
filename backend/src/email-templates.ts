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

export const welcomeSubject = "Welcome to Product Shift Pro ⚡️";
export const welcomeBody = (baseUrl: string) => `
<h2>You're in!</h2>
<p>Thanks for upgrading to Product Shift. You now have access to advanced AI analysis and detailed reports.</p>
<h3>Getting Started:</h3>
<ol>
  <li><strong>Run your first audit:</strong> Go to the dashboard and enter your URL.</li>
  <li><strong>Download the Extension:</strong> Audit pages while you browse.</li>
  <li><strong>Share reports:</strong> Use the public link feature to share findings with your team.</li>
</ol>
<p><a href="${baseUrl}/ai-powered-ux" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Go to Dashboard</a></p>
`;

export const onboardingSubject = "Pro Tip: Use the Chrome Extension 🧩";
export const onboardingBody = (baseUrl: string) => `
<h2>Audit faster with our Chrome Extension</h2>
<p>Did you know you don't have to leave your tab to run an audit?</p>
<p>Our Chrome Extension lets you capture and analyze any page instantly.</p>
`;