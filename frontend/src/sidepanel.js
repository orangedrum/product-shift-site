document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('analyzeBtn');
  const preview = document.getElementById('preview');
  const img = document.getElementById('screenshot');
  const status = document.getElementById('status');
  const testBtn = document.getElementById('testConnBtn');

  // Diagnostic Tool
  testBtn.addEventListener('click', async () => {
    status.innerText = 'Testing connection...';
    status.className = 'status';
    try {
      const res = await fetch('https://www.theproductshift.com/api/health');
      if (res.ok) {
        const json = await res.json();
        status.innerText = `✅ Connected! (Status: ${json.status})`;
        status.className = 'status success';
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (e) {
      status.innerText = `❌ Connection Failed: ${e.message}`;
      status.className = 'status error';
    }
  });

  btn.addEventListener('click', async () => {
    // 1. Reset UI State
    btn.disabled = true;
    btn.innerText = 'Capturing...';
    status.innerText = '';
    status.className = 'status';
    preview.style.display = 'none';

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
      const response = await fetch('https://www.theproductshift.com/api/analyze', {
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
        status.innerHTML = '<a href="https://www.theproductshift.com/login" target="_blank">Please Log In First</a>';
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