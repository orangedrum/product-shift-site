import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl">
      <h1 className="text-4xl font-black mb-8 text-black">Privacy Policy</h1>
      <div className="prose prose-lg text-gray-600">
        <p className="font-bold">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <h3 className="text-xl font-bold text-black mt-6 mb-2">1. Introduction</h3>
        <p>Product Shift ("we", "us", or "our") operates the User Mirror Chrome Extension and theproductshift.com website. We respect your privacy and are committed to protecting your personal data.</p>

        <h3 className="text-xl font-bold text-black mt-6 mb-2">2. Data We Collect</h3>
        <p>When you use our services, we collect the following types of information:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Account Information:</strong> Your email address is used for authentication and account management.</li>
          <li><strong>Usage Data:</strong> We collect the URLs of the websites you analyze to generate UX reports.</li>
          <li><strong>Page Content:</strong> To perform the analysis, our extension captures a screenshot and the text content of the active tab when you click "Analyze". This data is processed by our AI models and is not permanently stored in a way that links it to your identity outside of the generated report history.</li>
        </ul>

        <h3 className="text-xl font-bold text-black mt-6 mb-2">3. How We Use Your Data</h3>
        <p>We use your data to:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Provide the AI-powered UX analysis service.</li>
          <li>Maintain your history of past audits.</li>
          <li>Improve our AI models and service quality.</li>
        </ul>

        <h3 className="text-xl font-bold text-black mt-6 mb-2">4. Data Sharing</h3>
        <p>We do not sell your personal data. We share data with:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>AI Providers:</strong> Text and screenshots are sent to third-party AI providers (e.g., Google Gemini, OpenAI) solely for the purpose of generating the analysis.</li>
          <li><strong>Service Providers:</strong> We use trusted third-party services for hosting (Vercel), database (Supabase), and payments (Stripe).</li>
        </ul>

        <h3 className="text-xl font-bold text-black mt-6 mb-2">5. Contact Us</h3>
        <p>If you have any questions about this Privacy Policy, please contact us at support@theproductshift.com.</p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;