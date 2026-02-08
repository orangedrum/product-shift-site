document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('analyzeBtn');
  const preview = document.getElementById('preview');
  const img = document.getElementById('screenshot');
  const status = document.getElementById('status');
  const testBtn = document.getElementById('testConnBtn');
  const resultsContainer = document.getElementById('results-container');
  
  // Auth Elements
  const loginView = document.getElementById('login-view');
  const appView = document.getElementById('app-view');
  const checkAuthBtn = document.getElementById('checkAuthBtn');
  const sendMagicLinkBtn = document.getElementById('sendMagicLinkBtn');
  const emailInput = document.getElementById('emailInput');

  const API_BASE = 'https://product-shift-site-git-plugin-paluza-jeans-projects-3cddd625.vercel.app';
  let currentUserEmail = '';

  // --- Auth Check Function ---
  const checkAuth = async () => {
    try {
      // Add timestamp to prevent caching of auth status
      const res = await fetch(`${API_BASE}/api/auth/status?t=${Date.now()}`, { credentials: 'include' });
      const data = await res.json();
      console.log('[Extension] Auth Check Result:', data);
      
      if (data.authenticated) {
        currentUserEmail = data.email || '';
        loginView.style.display = 'none';
        appView.style.display = 'block';
      } else {
        loginView.style.display = 'block';
        appView.style.display = 'none';
        if (data.debug) console.warn('Auth Failed Reason:', data.debug);
      }
    } catch (e) {
      console.error('Auth check failed', e);
      // Default to login view on error
      loginView.style.display = 'block';
      appView.style.display = 'none';
    }
  };

  // Check on load
  checkAuth();
  
  if (checkAuthBtn) {
    checkAuthBtn.addEventListener('click', () => {
      checkAuthBtn.innerText = 'Checking...';
      checkAuth().then(() => checkAuthBtn.innerText = "I've Logged In (Check Again)");
    });
  }

  // --- Send Magic Link Function ---
  if (sendMagicLinkBtn && emailInput) {
    sendMagicLinkBtn.addEventListener('click', async () => {
      const email = emailInput.value.trim();
      if (!email) {
        alert('Please enter your email address.');
        return;
      }

      sendMagicLinkBtn.disabled = true;
      sendMagicLinkBtn.innerText = 'Sending...';

      try {
        // We tell the backend to redirect the user back to THIS specific API Base URL after login.
        // This ensures the auth cookie is set on the correct domain (the Vercel preview URL).
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email, 
            redirectTo: `${API_BASE}/ai-powered-ux` 
          })
        });

        const data = await res.json();
        if (data.success) {
          alert('Magic Link Sent! Check your inbox, click the link, then come back here and click "Check Again".');
          sendMagicLinkBtn.innerText = 'Link Sent!';
          
          // UI Update: Hide Input to reduce confusion (Matches Login.tsx flow)
          emailInput.style.display = 'none';
          sendMagicLinkBtn.style.display = 'none';
          checkAuthBtn.innerText = "I've Logged In (Check Again)";
        } else {
          // Use the specific error from the backend if available
          throw new Error(data.error || `Failed to send link (${res.status})`);
        }
      } catch (e) {
        console.error('Login error:', e);
        alert(`Error: ${e.message}`);
        sendMagicLinkBtn.disabled = false;
        sendMagicLinkBtn.innerText = 'Send Login Link';
      }
    });
  }

  // Diagnostic Tool
  if (testBtn) {
    testBtn.addEventListener('click', async () => {
    status.innerText = 'Testing connection...';
    status.className = 'status';
    try {
      const res = await fetch(`${API_BASE}/api/health`);
      if (res.ok) {
        const json = await res.json();
        const routeCheck = json.activeRoutes && json.activeRoutes.length > 0
          ? 'Analyze Route Active' 
          : 'Analyze Route MISSING';
        
        status.innerText = `✅ Connected! (${routeCheck})`;
        status.className = 'status success';
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (e) {
      status.innerText = `❌ Connection Failed: ${e.message}`;
      status.className = 'status error';
    }
  });
  }

  btn.addEventListener('click', async () => {
    // 1. Reset UI State
    btn.disabled = true;
    btn.innerText = 'Capturing...';
    status.innerText = '';
    status.className = 'status';
    preview.style.display = 'none';
    resultsContainer.innerHTML = ''; // Clear previous results

    try {
      // 2. Get the Active Tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        throw new Error("No active tab found.");
      }

      // 3. Capture Screenshot (Client-Side)
      // This uses the 'activeTab' permission to grab what the user sees
      const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
      
      // Show the screenshot to the user immediately
      img.src = dataUrl;
      preview.style.display = 'block';
      btn.innerText = 'Analyzing...';

      // 4. Send to Backend (Production)
      // We send the URL to our existing scraping engine.
      // Note: This relies on the user being logged into the main site for cookies.
      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Critical: Send auth cookies with the request
        body: JSON.stringify({ 
          url: tab.url
        }),
      });

      if (response.status === 401) {
        status.innerHTML = `<a href="${API_BASE}/login" target="_blank">Please Log In First</a>`;
        status.className = 'status error';
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        
        // Deductive Reasoning Fix: Detect HTML 404s (SPA Fallback)
        if (errorText.trim().startsWith('<!DOCTYPE html>')) {
          throw new Error(`Server Error (404): The API endpoint '/api/analyze' does not exist on the server.`);
        }

        let errorMessage = `Error (${response.status})`;
        try {
          const json = JSON.parse(errorText);
          if (json.error) errorMessage += `: ${json.error}`;
        } catch (e) {
          errorMessage += `: ${errorText.substring(0, 60)}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      status.innerText = 'Analysis Complete!';
      status.className = 'status success';

      // --- Render Usability Scores ---
      const scores = data.scores || { usability: 0, desirability: 0, clarity: 0 };
      const scoreHtml = `
        <div class="card score-container">
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
      `;
      resultsContainer.innerHTML = scoreHtml;

      // --- Render Analysis Results ---
      if (data.userSessions && data.userSessions.length > 0) {
        data.userSessions.forEach(session => {
            // Parse the AI's structured response string
            const analysisParts = session.analysis.split('|||');
            const mood = analysisParts.find((part, i) => analysisParts[i-1] === 'USER_MOOD')?.trim() || 'Neutral';
            const bubble = analysisParts.find((part, i) => analysisParts[i-1] === 'USER_BUBBLE')?.trim() || 'No immediate thoughts.';
            let details = analysisParts.find((part, i) => analysisParts[i-1] === 'USER_DETAILS')?.trim() || 'No detailed feedback provided.';

            // Convert simple markdown to HTML for display
            details = details
                .replace(/### (.*?)\n/g, '<h4>$1</h4>')
                .replace(/### (.*)/g, '<h4>$1</h4>')
                .replace(/\n/g, '<br>');

            const sessionHtml = `
                <div class="card result-card">
                    <div class="persona-header">
                        <img src="${session.avatar}" class="avatar" alt="${session.persona}">
                        <div>
                            <div class="persona-name">${session.persona}</div>
                            <div class="persona-desc">${session.description}</div>
                        </div>
                    </div>
                    <div class="mood-bubble mood-${mood.toLowerCase()}">
                        "${bubble}"
                    </div>
                    <div class="details">
                        ${details}
                    </div>
                </div>
            `;
            resultsContainer.innerHTML += sessionHtml;
        });

        // --- Share Button ---
        if (data.reportId) {
          const shareUrl = `${API_BASE}/api/public-report/${data.reportId}`;
          resultsContainer.innerHTML += `
            <div style="margin-top: 16px;">
              <a href="${shareUrl}" target="_blank" class="btn btn-outline" style="text-decoration: none; flex: 1; text-align: center;">
                Share Report
              </a>
            </div>
            `;

          // --- Admin Only: Draft to Blog ---
          // Check if user is admin (simple check for now)
          const isAdmin = currentUserEmail && (currentUserEmail.includes('@theproductshift.com') || currentUserEmail.includes('+smb') || currentUserEmail.includes('test'));
          
          if (isAdmin && data.seoSchema) {
             resultsContainer.innerHTML += `
            <div style="margin-top: 8px;">
              <button id="draftBlogBtn" class="btn btn-outline" style="width: 100%; background-color: #f0fdf4; border-color: #16a34a; color: #15803d;">
                Draft to Blog (Admin)
              </button>
            </div>`;
            
             setTimeout(() => {
                // Attach event listener for Draft button
                const draftBtn = document.getElementById('draftBlogBtn');
                if(draftBtn) {
                    draftBtn.addEventListener('click', async () => {
                        draftBtn.innerText = 'Drafting...';
                        try {
                          const res = await fetch(`${API_BASE}/api/admin/draft-blog-post`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ reportId: data.reportId, email: currentUserEmail })
                          });
                          const json = await res.json();
                          if (json.success) {
                            draftBtn.innerText = 'Open Draft';
                            draftBtn.onclick = (e) => {
                              e.preventDefault();
                              window.open(`${API_BASE}${json.cmsLink}`, '_blank');
                            };
                          }
                          else draftBtn.innerText = 'Failed';
                        } catch(e) {
                          console.error('Draft Error:', e);
                          draftBtn.innerText = 'Error (See Console)';
                        }
                    });
                }
             }, 50);
          }
        }
      } else {
        resultsContainer.innerHTML = '<p class="error">No analysis results were returned from the server.</p>';
      }

    } catch (err) {
      status.innerText = err.message || 'An error occurred';
      status.className = 'status error';
    } finally {
      btn.disabled = false;
      if (status.className !== 'status success') btn.innerText = 'Analyze Page';
      else btn.innerText = 'Analyze Again';
    }
  });
});