// DualView Panel Client Application
document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const panelsContainer = document.getElementById('panelsContainer');
  const viewSplitBtn = document.getElementById('viewSplitBtn');
  const viewYoutubeBtn = document.getElementById('viewYoutubeBtn');
  const viewWebsiteBtn = document.getElementById('viewWebsiteBtn');
  const splitOrientationBtn = document.getElementById('splitOrientationBtn');
  const proxyBadge = document.getElementById('proxyBadge');

  // YouTube Elements
  const youtubeUrlInput = document.getElementById('youtubeUrlInput');
  const youtubeLoadBtn = document.getElementById('youtubeLoadBtn');
  const ytPasteBtn = document.getElementById('ytPasteBtn');
  const ytClearBtn = document.getElementById('ytClearBtn');
  const ytEmptyState = document.getElementById('ytEmptyState');
  const ytPlayerContainer = document.getElementById('ytPlayerContainer');
  const ytIframe = document.getElementById('ytIframe');
  const ytStatusBadge = document.getElementById('ytStatusBadge');
  const ytHistorySection = document.getElementById('ytHistorySection');
  const ytHistoryChips = document.getElementById('ytHistoryChips');

  // Website Elements
  const websiteUrlInput = document.getElementById('websiteUrlInput');
  const websiteLoadBtn = document.getElementById('websiteLoadBtn');
  const webPasteBtn = document.getElementById('webPasteBtn');
  const webClearBtn = document.getElementById('webClearBtn');
  const webReloadBtn = document.getElementById('webReloadBtn');
  const webExternalBtn = document.getElementById('webExternalBtn');
  const webEmptyState = document.getElementById('webEmptyState');
  const webFrameContainer = document.getElementById('webFrameContainer');
  const webIframe = document.getElementById('webIframe');
  const webLoadingBar = document.getElementById('webLoadingBar');
  const proxyModeToggle = document.getElementById('proxyModeToggle');
  const proxyModeLabel = document.getElementById('proxyModeLabel');
  const modeBadge = document.getElementById('modeBadge');
  const activeUrlText = document.getElementById('activeUrlText');
  const iframeBlockedHelper = document.getElementById('iframeBlockedHelper');
  const enableProxyAndReloadBtn = document.getElementById('enableProxyAndReloadBtn');
  const openExternalFallbackBtn = document.getElementById('openExternalFallbackBtn');
  const webHistorySection = document.getElementById('webHistorySection');
  const webHistoryChips = document.getElementById('webHistoryChips');

  const toast = document.getElementById('toast');

  // --- State ---
  let isProxySupported = false;
  let activeWebRawUrl = '';
  let activeYtVideoId = '';

  // ================= 1. SERVER & PROXY CAPABILITY CHECK =================
  async function checkServerStatus() {
    try {
      const res = await fetch('/api/status', { method: 'GET', cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.proxySupported) {
          isProxySupported = true;
          proxyBadge.classList.add('active');
          proxyBadge.querySelector('.status-text').textContent = 'Smart Proxy Active';
          proxyBadge.title = 'Local Node proxy is active. Iframe restrictions (X-Frame-Options/CSP) will be bypassed.';
          proxyModeToggle.checked = true;
          updateProxyToggleUI();
          return;
        }
      }
    } catch {
      // Running via file:// or non-node static server
    }

    isProxySupported = false;
    proxyBadge.classList.add('fallback');
    proxyBadge.querySelector('.status-text').textContent = 'Direct Mode';
    proxyBadge.title = 'Running directly. Run "npm start" for smart bypass of restricted websites.';
    proxyModeToggle.checked = false;
    updateProxyToggleUI();
  }

  function updateProxyToggleUI() {
    if (proxyModeToggle.checked) {
      proxyModeLabel.textContent = 'Smart Bypass: ON';
      modeBadge.textContent = 'Bypass Active';
      modeBadge.className = 'mode-indicator badge-proxy';
    } else {
      proxyModeLabel.textContent = 'Direct Mode';
      modeBadge.textContent = 'Direct Mode';
      modeBadge.className = 'mode-indicator badge-direct';
    }
  }

  proxyModeToggle.addEventListener('change', () => {
    if (proxyModeToggle.checked && !isProxySupported) {
      showToast('Start the local server ("npm start") to enable Smart Bypass.', 'error');
      proxyModeToggle.checked = false;
      return;
    }
    updateProxyToggleUI();
    if (activeWebRawUrl) {
      loadWebsite(activeWebRawUrl);
    }
  });

  // ================= 2. VIEW & LAYOUT SWITCHER =================
  function setViewMode(mode) {
    viewSplitBtn.classList.remove('active');
    viewYoutubeBtn.classList.remove('active');
    viewWebsiteBtn.classList.remove('active');

    panelsContainer.classList.remove('split-columns', 'split-rows', 'single-youtube', 'single-website');

    if (mode === 'youtube') {
      viewYoutubeBtn.classList.add('active');
      panelsContainer.classList.add('single-youtube');
      splitOrientationBtn.style.display = 'none';
    } else if (mode === 'website') {
      viewWebsiteBtn.classList.add('active');
      panelsContainer.classList.add('single-website');
      splitOrientationBtn.style.display = 'none';
    } else {
      viewSplitBtn.classList.add('active');
      const isRows = splitOrientationBtn.dataset.orientation === 'rows';
      panelsContainer.classList.add(isRows ? 'split-rows' : 'split-columns');
      splitOrientationBtn.style.display = 'flex';
    }
  }

  viewSplitBtn.addEventListener('click', () => setViewMode('split'));
  viewYoutubeBtn.addEventListener('click', () => setViewMode('youtube'));
  viewWebsiteBtn.addEventListener('click', () => setViewMode('website'));

  splitOrientationBtn.addEventListener('click', () => {
    const isCurrentlyRows = splitOrientationBtn.dataset.orientation === 'rows';
    if (isCurrentlyRows) {
      splitOrientationBtn.dataset.orientation = 'columns';
      panelsContainer.classList.replace('split-rows', 'split-columns');
      splitOrientationBtn.title = 'Switch to Stacked View';
      showToast('Switched to Side-by-Side layout');
    } else {
      splitOrientationBtn.dataset.orientation = 'rows';
      panelsContainer.classList.replace('split-columns', 'split-rows');
      splitOrientationBtn.title = 'Switch to Side-by-Side View';
      showToast('Switched to Stacked layout');
    }
  });

  // ================= 3. YOUTUBE PARSER & LOADER =================
  /**
   * Robust YouTube URL parser supporting:
   * - https://www.youtube.com/watch?v=VIDEO_ID
   * - https://youtu.be/VIDEO_ID
   * - https://www.youtube.com/embed/VIDEO_ID
   * - https://www.youtube.com/shorts/VIDEO_ID
   * - https://www.youtube.com/live/VIDEO_ID
   * - timestamps: ?t=1m30s, ?t=90, etc.
   */
  function parseYouTubeUrl(rawUrl) {
    if (!rawUrl) return null;
    let urlString = rawUrl.trim();

    // If only an 11-char video ID was entered
    if (/^[a-zA-Z0-9_-]{11}$/.test(urlString)) {
      return { videoId: urlString, startTime: 0 };
    }

    if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
      urlString = 'https://' + urlString;
    }

    try {
      const parsed = new URL(urlString);
      let videoId = null;
      let startTime = 0;

      // Extract timestamp if present
      const tParam = parsed.searchParams.get('t') || parsed.searchParams.get('start');
      if (tParam) {
        if (/^\d+$/.test(tParam)) {
          startTime = parseInt(tParam, 10);
        } else {
          // Format like 1h2m30s or 2m30s
          const matchH = tParam.match(/(\d+)h/);
          const matchM = tParam.match(/(\d+)m/);
          const matchS = tParam.match(/(\d+)s/);
          let total = 0;
          if (matchH) total += parseInt(matchH[1], 10) * 3600;
          if (matchM) total += parseInt(matchM[1], 10) * 60;
          if (matchS) total += parseInt(matchS[1], 10);
          startTime = total;
        }
      }

      // Check various YouTube path styles
      if (parsed.hostname.includes('youtu.be')) {
        videoId = parsed.pathname.slice(1).split('/')[0];
      } else if (parsed.hostname.includes('youtube.com')) {
        if (parsed.searchParams.has('v')) {
          videoId = parsed.searchParams.get('v');
        } else if (parsed.pathname.startsWith('/shorts/')) {
          videoId = parsed.pathname.replace('/shorts/', '').split('/')[0];
        } else if (parsed.pathname.startsWith('/live/')) {
          videoId = parsed.pathname.replace('/live/', '').split('/')[0];
        } else if (parsed.pathname.startsWith('/embed/')) {
          videoId = parsed.pathname.replace('/embed/', '').split('/')[0];
        }
      }

      if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        return { videoId, startTime };
      }
    } catch {
      // Invalid URL string
    }

    return null;
  }

  function loadYouTubeVideo(rawUrl) {
    const result = parseYouTubeUrl(rawUrl);
    if (!result) {
      showToast('Invalid YouTube URL. Please check the link.', 'error');
      return;
    }

    activeYtVideoId = result.videoId;
    let embedUrl = `https://www.youtube-nocookie.com/embed/${result.videoId}?autoplay=1&rel=0`;
    if (result.startTime > 0) {
      embedUrl += `&start=${result.startTime}`;
    }

    ytEmptyState.style.display = 'none';
    ytPlayerContainer.style.display = 'flex';
    ytIframe.src = embedUrl;

    ytStatusBadge.textContent = `ID: ${result.videoId}`;
    ytStatusBadge.className = 'mini-badge playing';

    saveHistory('ytHistory', rawUrl.trim());
    renderHistory('ytHistory', ytHistoryChips, ytHistorySection, loadYouTubeVideo);
    showToast('YouTube video loaded!', 'success');
  }

  function clearYouTubeVideo() {
    ytIframe.src = '';
    ytPlayerContainer.style.display = 'none';
    ytEmptyState.style.display = 'flex';
    youtubeUrlInput.value = '';
    ytStatusBadge.textContent = 'Ready';
    ytStatusBadge.className = 'mini-badge';
    activeYtVideoId = '';
  }

  youtubeLoadBtn.addEventListener('click', () => {
    loadYouTubeVideo(youtubeUrlInput.value);
  });

  youtubeUrlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      loadYouTubeVideo(youtubeUrlInput.value);
    }
  });

  ytClearBtn.addEventListener('click', clearYouTubeVideo);

  // Quick Preset Chips (YouTube)
  document.querySelectorAll('.yt-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.getAttribute('data-url');
      youtubeUrlInput.value = url;
      loadYouTubeVideo(url);
    });
  });

  // Paste handler for YouTube
  ytPasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        youtubeUrlInput.value = text;
        showToast('Link pasted from clipboard!');
        loadYouTubeVideo(text);
      }
    } catch {
      youtubeUrlInput.focus();
      showToast('Clipboard access denied. Please press Cmd+V to paste.', 'error');
    }
  });

  // ================= 4. WEBSITE LOADER =================
  function normalizeWebUrl(raw) {
    if (!raw) return '';
    let url = raw.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    return url;
  }

  function loadWebsite(rawUrl) {
    const normalized = normalizeWebUrl(rawUrl);
    if (!normalized) {
      showToast('Please enter a valid website URL.', 'error');
      return;
    }

    try {
      new URL(normalized);
    } catch {
      showToast('Malformed URL. Please check your link.', 'error');
      return;
    }

    activeWebRawUrl = normalized;
    activeUrlText.textContent = normalized;

    // Reset iframe blocking warning
    iframeBlockedHelper.style.display = 'none';
    webEmptyState.style.display = 'none';
    webFrameContainer.style.display = 'flex';

    // Loading indicator animation
    webLoadingBar.className = 'loading-bar active';

    let finalIframeSrc = normalized;
    if (proxyModeToggle.checked && isProxySupported) {
      finalIframeSrc = `/proxy?url=${encodeURIComponent(normalized)}`;
      modeBadge.textContent = 'Bypass Active';
      modeBadge.className = 'mode-indicator badge-proxy';
    } else {
      modeBadge.textContent = 'Direct Mode';
      modeBadge.className = 'mode-indicator badge-direct';
    }

    webIframe.src = finalIframeSrc;

    // Handle frame load complete
    webIframe.onload = () => {
      webLoadingBar.className = 'loading-bar complete';
    };

    // If using direct mode, provide a helper after short delay in case site blocks embedding
    if (!proxyModeToggle.checked) {
      setTimeout(() => {
        if (!proxyModeToggle.checked && webFrameContainer.style.display !== 'none') {
          // If in direct mode, give user easy toggle in case of X-Frame-Options block
          iframeBlockedHelper.style.display = 'flex';
        }
      }, 2500);
    }

    saveHistory('webHistory', normalized);
    renderHistory('webHistory', webHistoryChips, webHistorySection, loadWebsite);
    showToast(`Loading: ${normalized}`, 'success');
  }

  function clearWebsite() {
    webIframe.src = 'about:blank';
    webFrameContainer.style.display = 'none';
    webEmptyState.style.display = 'flex';
    websiteUrlInput.value = '';
    activeUrlText.textContent = 'about:blank';
    iframeBlockedHelper.style.display = 'none';
    activeWebRawUrl = '';
  }

  websiteLoadBtn.addEventListener('click', () => {
    loadWebsite(websiteUrlInput.value);
  });

  websiteUrlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      loadWebsite(websiteUrlInput.value);
    }
  });

  webClearBtn.addEventListener('click', clearWebsite);

  webReloadBtn.addEventListener('click', () => {
    if (activeWebRawUrl) {
      loadWebsite(activeWebRawUrl);
      showToast('Reloading website...');
    }
  });

  webExternalBtn.addEventListener('click', () => {
    if (activeWebRawUrl) {
      window.open(activeWebRawUrl, '_blank', 'noopener,noreferrer');
    } else {
      showToast('No website currently active to open.', 'error');
    }
  });

  // Helper buttons on the blocked banner
  enableProxyAndReloadBtn.addEventListener('click', () => {
    if (!isProxySupported) {
      showToast('Run "npm start" in terminal to enable Smart Bypass server.', 'error');
      return;
    }
    proxyModeToggle.checked = true;
    updateProxyToggleUI();
    loadWebsite(activeWebRawUrl);
  });

  openExternalFallbackBtn.addEventListener('click', () => {
    if (activeWebRawUrl) {
      window.open(activeWebRawUrl, '_blank', 'noopener,noreferrer');
    }
  });

  // Quick Preset Chips (Web)
  document.querySelectorAll('.web-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.getAttribute('data-url');
      websiteUrlInput.value = url;
      loadWebsite(url);
    });
  });

  // Paste handler for Website
  webPasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        websiteUrlInput.value = text;
        showToast('Website URL pasted from clipboard!');
        loadWebsite(text);
      }
    } catch {
      websiteUrlInput.focus();
      showToast('Clipboard access denied. Please press Cmd+V to paste.', 'error');
    }
  });

  // ================= 5. RECENT HISTORY (localStorage) =================
  function saveHistory(key, url) {
    if (!url) return;
    try {
      let list = JSON.parse(localStorage.getItem(key) || '[]');
      list = list.filter(item => item !== url);
      list.unshift(url);
      if (list.length > 5) list = list.slice(0, 5);
      localStorage.setItem(key, JSON.stringify(list));
    } catch {
      // Storage unavailable
    }
  }

  function renderHistory(key, containerEl, sectionEl, callback) {
    try {
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      if (!list || list.length === 0) {
        sectionEl.style.display = 'none';
        return;
      }
      sectionEl.style.display = 'flex';
      containerEl.innerHTML = '';
      list.forEach(url => {
        const chip = document.createElement('button');
        chip.className = 'history-chip';
        // Display pretty domain or video id
        let label = url;
        try {
          const u = new URL(url.startsWith('http') ? url : 'https://' + url);
          label = u.hostname + (u.pathname !== '/' ? u.pathname : '');
        } catch {}
        chip.textContent = label;
        chip.title = url;
        chip.addEventListener('click', () => {
          if (key === 'ytHistory') {
            youtubeUrlInput.value = url;
          } else {
            websiteUrlInput.value = url;
          }
          callback(url);
        });
        containerEl.appendChild(chip);
      });
    } catch {
      sectionEl.style.display = 'none';
    }
  }

  // ================= 6. TOAST NOTIFICATION UTILITY =================
  let toastTimer = null;
  function showToast(message, type = 'info') {
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.className = 'toast';
    }, 3200);
  }

  // Initialize
  checkServerStatus();
  renderHistory('ytHistory', ytHistoryChips, ytHistorySection, loadYouTubeVideo);
  renderHistory('webHistory', webHistoryChips, webHistorySection, loadWebsite);
});

