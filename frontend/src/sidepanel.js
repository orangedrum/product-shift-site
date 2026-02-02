document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('analyzeBtn');
  const preview = document.getElementById('preview');
  const img = document.getElementById('screenshot');
  const status = document.getElementById('status');
  const testBtn = document.getElementById('testConnBtn');
  const resultsContainer = document.getElementById('results-container');

  const API_BASE = 'https://product-shift-site-git-plugin-paluza-jeans-projects-3cddd625.vercel.app';

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