// frontend/public/sidepanel.js

// Use the specific Vercel URL from your logs to ensure connectivity
const API_BASE_URL = 'https://product-shift-site-git-plugin-paluza-jeans-projects-3cddd625.vercel.app';

let currentUserEmail = ''; // Store email for admin actions

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
    if (statusDiv) {
      statusDiv.textContent = msg;
      statusDiv.className = `status ${type}`;
    }
  };

  const toggleView = (isAuthenticated) => {
    if (isAuthenticated) {
      if (loginView) loginView.style.display = 'none';
      if (appView) appView.style.display = 'block';
    } else {
      if (loginView) loginView.style.display = 'block';
      if (appView) appView.style.display = 'none';
    }
  };

  // --- Auth Logic ---
  const checkAuth = async (silent = false) => {
    if (!silent) setStatus('Checking authentication...', 'neutral');
    try {
      // We must include credentials (cookies) for the auth check to work
      // Add timestamp to prevent caching of auth status
      const res = await fetch(`${API_BASE_URL}/api/auth/status?t=${Date.now()}`, { 
        credentials: 'include' 
      });
      
      if (!res.ok) throw new Error('Auth check failed');
      
      const data = await res.json();
      if (data.authenticated) {
        currentUserEmail = data.email;
        setStatus('Logged in!', 'success');
        toggleView(true);
      } else {
        if (!silent) {
          setStatus('Please log in.', 'neutral');
          console.log('Auth Debug:', data.debug); // Log the reason from backend
        }
      }
    } catch (err) {
      console.error('Auth Error:', err);
      if (!silent) setStatus('Not logged in.', 'neutral');
      toggleView(false);
    }
  };

  if (sendMagicLinkBtn) {
    sendMagicLinkBtn.addEventListener('click', async () => {
      const email = emailInput.value;
      if (!email) return setStatus('Please enter an email.', 'error');

      sendMagicLinkBtn.disabled = true;
      sendMagicLinkBtn.innerText = 'Sending...';
      setStatus('Sending login link...', 'neutral');
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to send link');
        }
        
        setStatus('Magic link sent! Check your email.', 'success');
        
        // UI Update: Simple hide/show (No innerHTML replacement)
        emailInput.style.display = 'none';
        sendMagicLinkBtn.style.display = 'none';
        
        // Create Retry Button if it doesn't exist
        let retryBtn = document.getElementById('checkAuthBtnRetry');
        if (!retryBtn) {
          retryBtn = document.createElement('button');
          retryBtn.id = 'checkAuthBtnRetry';
          retryBtn.className = 'btn';
          retryBtn.textContent = "I've Logged In (Check Again)";
          retryBtn.style.marginTop = '10px';
          retryBtn.style.width = '100%';
          // Insert after the send button
          sendMagicLinkBtn.parentNode.insertBefore(retryBtn, sendMagicLinkBtn.nextSibling);
          retryBtn.addEventListener('click', () => checkAuth(false));
        }
        retryBtn.style.display = 'block';

        // Create Reset Link
        let resetBtn = document.getElementById('resetLoginBtn');
        if (!resetBtn) {
            resetBtn = document.createElement('button');
            resetBtn.id = 'resetLoginBtn';
            resetBtn.textContent = 'Use different email / Retry';
            resetBtn.style.background = 'none';
            resetBtn.style.border = 'none';
            resetBtn.style.color = '#666';
            resetBtn.style.textDecoration = 'underline';
            resetBtn.style.fontSize = '12px';
            resetBtn.style.marginTop = '10px';
            resetBtn.style.cursor = 'pointer';
            resetBtn.style.width = '100%';
            sendMagicLinkBtn.parentNode.insertBefore(resetBtn, retryBtn.nextSibling);
            resetBtn.addEventListener('click', () => window.location.reload());
        }
        resetBtn.style.display = 'block';

      } catch (err) {
        setStatus(`Error: ${err.message}`, 'error');
      } finally {
        if (sendMagicLinkBtn) {
          sendMagicLinkBtn.disabled = false;
          sendMagicLinkBtn.innerText = 'Send Login Link';
        }
      }
    });
  }

  if (checkAuthBtn) {
    checkAuthBtn.addEventListener('click', () => checkAuth(false));
  }

  // --- Auto-Login Polling ---
  // Check every 4 seconds if we are still on the login screen
  setInterval(() => {
    if (appView && appView.style.display === 'none') {
      checkAuth(true); // Silent check
    }
  }, 4000);

  // --- Analysis Logic ---
  if (analyzeBtn) {
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

        setStatus('Analyzing with AI... (this may take a moment)', 'neutral');

        // 2. Send to Backend
        const res = await fetch(`${API_BASE_URL}/api/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // Important for auth
          body: JSON.stringify({
            url: tab.url,
            personaIds: ['alex-busy-pro'],
            goal: 'Identify immediate UX friction points.',
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
  }

  const renderResults = (data) => {
    const { scores, userSessions, expertReport, reportId } = data;
    
    let html = '';

    // Scores
    if (scores) {
      html += `
        <div class="card">
          <h3>Scores</h3>
          <div class="score-container">
            <div class="score-row">
              <span class="score-label">Usability</span>
              <div class="score-bar-bg"><div class="score-bar-fill" style="width: ${scores.usability}%"></div></div>
              <span class="score-value">${scores.usability}</span>
            </div>
            <div class="score-row">
              <span class="score-label">Desirability</span>
              <div class="score-bar-bg"><div class="score-bar-fill" style="width: ${scores.desirability}%"></div></div>
              <span class="score-value">${scores.desirability}</span>
            </div>
            <div class="score-row">
              <span class="score-label">Clarity</span>
              <div class="score-bar-bg"><div class="score-bar-fill" style="width: ${scores.clarity}%"></div></div>
              <span class="score-value">${scores.clarity}</span>
            </div>
          </div>
        </div>
      `;
    }

    // Sessions
    if (userSessions && userSessions.length > 0) {
      html += `<h2>User Feedback</h2>`;
      userSessions.forEach(session => {
        // Parse the analysis string to extract specific sections
        const parts = session.analysis.split('|||');
        const moodIndex = parts.indexOf('USER_MOOD');
        const bubbleIndex = parts.indexOf('USER_BUBBLE');
        const detailsIndex = parts.indexOf('USER_DETAILS');

        const mood = moodIndex !== -1 ? parts[moodIndex + 1].trim() : 'Neutral';
        const bubble = bubbleIndex !== -1 ? parts[bubbleIndex + 1].trim() : '';
        const details = detailsIndex !== -1 ? parts[detailsIndex + 1].trim() : '';

        // Format details (Markdown to HTML)
        const formattedDetails = details
          .replace(/^### (.*$)/gm, '<h4>$1</h4>')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\n/g, '<br>');

        html += `
          <div class="card">
            <div class="persona-header">
              <img src="${session.avatar}" class="avatar" alt="${session.persona}" />
              <div>
                <div class="persona-name">${session.persona}</div>
                <div class="persona-desc">${session.description || 'Persona'}</div>
              </div>
            </div>
            <div class="mood-bubble ${mood.toLowerCase().includes('positive') ? 'mood-positive' : 'mood-negative'}">
              "${bubble}"
            </div>
            <div class="details">
              ${formattedDetails}
            </div>
          </div>
        `;
      });
    }

    // Expert Analysis
    if (expertReport) {
       const formattedExpert = expertReport
          .replace(/^### (.*$)/gm, '<h4>$1</h4>')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/^- (.*$)/gm, '<li>$1</li>')
          .replace(/\n/g, '<br>');
       
       html += `
        <div class="card">
          <h3>Expert Analysis</h3>
          <div class="details">${formattedExpert}</div>
        </div>
       `;
    }

    // Actions (Share / Blog)
    if (reportId) {
      const publicUrl = `${API_BASE_URL}/api/public-report/${reportId}`;
      html += `
        <div style="display: flex; gap: 8px; flex-direction: column; margin-top: 16px;">
          <a href="${publicUrl}" target="_blank" class="btn" style="text-decoration: none;">
            Share Full Report
          </a>
          <button id="draftBlogBtn" class="btn-outline" data-report-id="${reportId}">
            Draft to Blog (Admin)
          </button>
        </div>
      `;
    }

    resultsContainer.innerHTML = html;

    // Attach listener for Draft Blog
    const draftBtn = document.getElementById('draftBlogBtn');
    if (draftBtn) {
      draftBtn.addEventListener('click', async () => {
        if (!currentUserEmail) return setStatus('Error: Email not found. Please re-login.', 'error');
        
        setStatus('Drafting blog post...', 'neutral');
        try {
           const res = await fetch(`${API_BASE_URL}/api/admin/draft-blog-post`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ reportId: reportId, email: currentUserEmail })
           });
           const d = await res.json();
           if (d.success) {
             setStatus('Draft created! Check CMS.', 'success');
           } else {
             setStatus('Failed: ' + (d.error || 'Unknown error'), 'error');
           }
        } catch (e) {
          setStatus('Error drafting blog.', 'error');
        }
      });
    }
  };

  // Initial check
  checkAuth(false);
});
