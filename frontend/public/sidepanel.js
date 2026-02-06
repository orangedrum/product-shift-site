// frontend/public/sidepanel.js

// Use the specific Vercel URL from your logs to ensure connectivity
const API_BASE_URL = 'https://product-shift-site-git-plugin-paluza-jeans-projects-3cddd625.vercel.app';

document.addEventListener('DOMContentLoaded', () => {
  const loginView = document.getElementById('login-view');
  const appView = document.getElementById('app-view');
  const emailInput = document.getElementById('emailInput');
  const sendMagicLinkBtn = document.getElementById('sendMagicLinkBtn');
  const checkAuthBtn = document.getElementById('checkAuthBtn');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const statusDiv = document.getElementById('status');
  const resultsContainer = document.getElementById('results-container');
  const screenshotImg = document.getElementById('screenshot');
  const previewContainer = document.getElementById('preview');

  // --- Helper Functions ---
  const setStatus = (msg, type = 'neutral') => {
    statusDiv.textContent = msg;
    statusDiv.className = `status ${type}`;
  };

  const toggleView = (isAuthenticated) => {
    if (isAuthenticated) {
      loginView.style.display = 'none';
      appView.style.display = 'block';
    } else {
      loginView.style.display = 'block';
      appView.style.display = 'none';
    }
  };

  // --- Auth Logic ---
  const checkAuth = async () => {
    setStatus('Checking authentication...', 'neutral');
    try {
      // We must include credentials (cookies) for the auth check to work
      const res = await fetch(`${API_BASE_URL}/api/auth/status`, { 
        credentials: 'include' 
      });
      
      if (!res.ok) throw new Error('Auth check failed');
      
      const data = await res.json();
      if (data.authenticated) {
        setStatus('Logged in!', 'success');
        toggleView(true);
      } else {
        setStatus('Please log in.', 'neutral');
        toggleView(false);
      }
    } catch (err) {
      console.error('Auth Error:', err);
      setStatus('Not logged in.', 'neutral');
      toggleView(false);
    }
  };

  sendMagicLinkBtn.addEventListener('click', async () => {
    const email = emailInput.value;
    if (!email) return setStatus('Please enter an email.', 'error');

    setStatus('Sending login link...', 'neutral');
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      if (!res.ok) throw new Error('Failed to send link');
      
      setStatus('Magic link sent! Check your email, then click "I\'ve Logged In".', 'success');
    } catch (err) {
      setStatus('Error sending link. Try again.', 'error');
    }
  });

  checkAuthBtn.addEventListener('click', checkAuth);

  // --- Analysis Logic ---
  analyzeBtn.addEventListener('click', async () => {
    setStatus('Capturing page...', 'neutral');
    resultsContainer.innerHTML = '';
    previewContainer.style.display = 'none';

    try {
      // 1. Capture Visible Tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) throw new Error('No active tab found');

      // Capture screenshot using Chrome API
      const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'jpeg', quality: 60 });
      
      // Show preview
      screenshotImg.src = dataUrl;
      previewContainer.style.display = 'block';

      setStatus('Analyzing with AI... (this may take 30s)', 'neutral');

      // 2. Send to Backend
      const res = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important for auth
        body: JSON.stringify({
          url: tab.url,
          personaIds: ['alex-busy-pro'],
          goal: 'Identify immediate UX friction points.',
          // We don't send the screenshot here to save bandwidth; 
          // the backend will re-scrape or we can add it if needed.
          // For now, let's stick to the backend scraping pattern to match your index.ts logic.
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Server Error: ${res.status} ${errText}`);
      }

      const data = await res.json();

      // 3. Render Results
      setStatus('Analysis Complete!', 'success');
      renderResults(data);

    } catch (err) {
      console.error(err);
      setStatus(`Analysis Failed: ${err.message}`, 'error');
    }
  });

  const renderResults = (data) => {
    // Simple rendering of the HTML returned or constructing it from JSON
    // Since your backend returns structured JSON + HTML report, let's use the JSON data
    
    const { scores, userSessions } = data;
    
    let html = '';

    // Scores
    if (scores) {
      html += `
        <div class="card">
          <h3>Scores</h3>
          <p>Usability: <strong>${scores.usability}</strong></p>
          <p>Desirability: <strong>${scores.desirability}</strong></p>
          <p>Clarity: <strong>${scores.clarity}</strong></p>
        </div>
      `;
    }

    // Sessions
    if (userSessions && userSessions.length > 0) {
      userSessions.forEach(session => {
        // Strip the internal markers for display
        const cleanAnalysis = session.analysis.replace(/\|\|\|.*?\|\|\|/g, '').substring(0, 150) + '...';
        html += `<div class="card"><strong>${session.persona}</strong>: ${cleanAnalysis}</div>`;
      });
    }

    resultsContainer.innerHTML = html;
  };

  // Initial check
  checkAuth();
});