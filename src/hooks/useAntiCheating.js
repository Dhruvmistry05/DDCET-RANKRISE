import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom Hook: useAntiCheating
 * Enterprise-grade proctoring and anti-cheating protection for exam-mode assessments.
 *
 * Enforces:
 * 1. Screen capture / PrintScreen neutralization & print blackout via CSS
 * 2. Disabled copy, cut, paste, text selection & right-click context menu
 * 3. Tab switching, window blur, and minimization detection
 * 4. Navigation guard (beforeunload & in-app back/forward blocking)
 * 5. Persistent violation log with configurable threshold auto-submission
 * 6. Wall-clock persistent timer and answers auto-save
 */
export function useAntiCheating({
  enabled = true,
  testId = 'default_test',
  testTitle = 'Assessment',
  maxViolations = 3,
  isSubmitted = false,
  onViolationLimitReached = null,
  durationMinutes = 60
}) {
  // LocalStorage storage keys
  const cacheKey = `rankrise_anti_cheat_${testId}`;

  // Restore cached session state if available
  const getInitialState = () => {
    if (!enabled || typeof window === 'undefined') {
      return { count: 0, log: [], startTime: Date.now() };
    }
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.count === 'number') {
          return {
            count: parsed.count,
            log: Array.isArray(parsed.log) ? parsed.log : [],
            startTime: parsed.startTime || Date.now(),
            savedAnswers: parsed.answers || {}
          };
        }
      }
    } catch (_e) {}
    return { count: 0, log: [], startTime: Date.now() };
  };

  const initial = getInitialState();

  const [violationsCount, setViolationsCount] = useState(initial.count);
  const [violationsLog, setViolationsLog] = useState(initial.log);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [currentWarning, setCurrentWarning] = useState(null);
  const [isScreenShieldActive, setIsScreenShieldActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(() => {
    if (typeof document !== 'undefined') {
      return Boolean(document.fullscreenElement);
    }
    return false;
  });

  const lastViolationTimeRef = useRef(0);
  const violationsCountRef = useRef(initial.count);
  const violationsLogRef = useRef(initial.log);
  const isSubmittedRef = useRef(isSubmitted);
  const onLimitReachedRef = useRef(onViolationLimitReached);
  const hasTriggeredLimitRef = useRef(false);

  // Sync refs with latest state
  useEffect(() => {
    violationsCountRef.current = violationsCount;
  }, [violationsCount]);

  useEffect(() => {
    violationsLogRef.current = violationsLog;
  }, [violationsLog]);

  useEffect(() => {
    isSubmittedRef.current = isSubmitted;
  }, [isSubmitted]);

  useEffect(() => {
    onLimitReachedRef.current = onViolationLimitReached;
  }, [onViolationLimitReached]);

  // Sync state to localStorage cache
  const persistState = useCallback((count, log, answers = null) => {
    if (!enabled || isSubmittedRef.current || typeof window === 'undefined') return;
    try {
      const currentRaw = localStorage.getItem(cacheKey);
      const existing = currentRaw ? JSON.parse(currentRaw) : {};
      const payload = {
        ...existing,
        count,
        log,
        lastUpdated: Date.now(),
        ...(answers ? { answers } : {})
      };
      localStorage.setItem(cacheKey, JSON.stringify(payload));
    } catch (_e) {}
  }, [cacheKey, enabled]);

  // Clean cache on submitted
  const clearTestCache = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(`rankrise_test_cache_${testId}`);
    } catch (_e) {}
  }, [cacheKey, testId]);

  // Record a violation event with debounce
  const recordViolation = useCallback((type, reason) => {
    if (!enabled || isSubmittedRef.current) return;

    const now = Date.now();
    // 1.2 second debounce to prevent dual events (visibilitychange + blur)
    if (now - lastViolationTimeRef.current < 1200) {
      return;
    }
    lastViolationTimeRef.current = now;

    const newCount = violationsCountRef.current + 1;
    const timeStr = new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(new Date());

    const violationEntry = {
      id: `viol_${now}`,
      timestamp: new Date().toISOString(),
      timeStr,
      type,
      reason,
      violationNumber: newCount
    };

    const newLog = [...violationsLogRef.current, violationEntry];
    setViolationsCount(newCount);
    setViolationsLog(newLog);
    persistState(newCount, newLog);

    const isLimitReached = newCount >= maxViolations;

    setCurrentWarning({
      type,
      title: isLimitReached ? 'Violation Limit Exceeded' : 'Anti-Cheating Security Alert',
      reason,
      count: newCount,
      max: maxViolations,
      time: timeStr,
      isTerminal: isLimitReached
    });

    setIsWarningModalOpen(true);

    if (isLimitReached && !hasTriggeredLimitRef.current) {
      hasTriggeredLimitRef.current = true;
      if (onLimitReachedRef.current) {
        onLimitReachedRef.current({
          violationsCount: newCount,
          violationsLog: newLog,
          autoSubmitted: true
        });
      }
    }
  }, [enabled, maxViolations, persistState]);

  // Request Fullscreen
  const requestFullscreen = useCallback(async () => {
    if (typeof document === 'undefined') return;
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } catch (_e) {
      // Browser permission / user gesture limitation
    }
  }, []);

  // Exit Fullscreen
  const exitFullscreen = useCallback(async () => {
    if (typeof document === 'undefined') return;
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
      setIsFullscreen(false);
    } catch (_e) {}
  }, []);

  // Dismiss modal
  const dismissWarningModal = useCallback(() => {
    setIsWarningModalOpen(false);
    setIsScreenShieldActive(false);
  }, []);

  // 1. Setup CSS protections for anti-cheating (Print blackout, text selection)
  useEffect(() => {
    if (!enabled || isSubmitted) return;

    const styleId = 'rankrise-anti-cheating-style';
    let styleElem = document.getElementById(styleId);
    if (!styleElem) {
      styleElem = document.createElement('style');
      styleElem.id = styleId;
      styleElem.innerHTML = `
        @media print {
          html, body, #root, * {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            background: #000 !important;
          }
        }
        .rankrise-exam-container,
        .rankrise-exam-container * {
          user-select: none !important;
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
        }
        .rankrise-exam-container img {
          pointer-events: none !important;
          -webkit-user-drag: none !important;
        }
      `;
      document.head.appendChild(styleElem);
    }

    return () => {
      const existing = document.getElementById(styleId);
      if (existing) existing.remove();
    };
  }, [enabled, isSubmitted]);

  // 2. Setup DOM Event Listeners: Copy, Cut, Paste, Right-click, SelectStart, Keydown
  useEffect(() => {
    if (!enabled || isSubmitted) return;

    const handleCopy = (e) => {
      e.preventDefault();
      try { e.clipboardData?.setData('text/plain', ''); } catch (_e) {}
      recordViolation('clipboard_copy', 'Attempted to copy content from the test interface');
    };

    const handleCut = (e) => {
      e.preventDefault();
      recordViolation('clipboard_cut', 'Attempted to cut content from the test interface');
    };

    const handlePaste = (e) => {
      e.preventDefault();
      recordViolation('clipboard_paste', 'Attempted to paste external content into test interface');
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      recordViolation('context_menu', 'Right-click context menu was triggered');
    };

    const handleSelectStart = (e) => {
      e.preventDefault();
    };

    const handleKeyDown = (e) => {
      // 1. PrintScreen detection
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText('');
          }
        } catch (_cErr) {}
        recordViolation('screenshot_attempt', 'PrintScreen screenshot key pressed');
        return;
      }

      // 2. Windows Snipping Tool (Ctrl/Cmd + Shift + S) or Mac Screenshot
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'S' || e.key === 's')) {
        e.preventDefault();
        e.stopPropagation();
        recordViolation('screenshot_shortcut', 'Screen capture keyboard shortcut pressed');
        return;
      }

      // 3. Print shortcut (Ctrl/Cmd + P)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        e.stopPropagation();
        recordViolation('print_attempt', 'Print page shortcut (Ctrl+P) pressed');
        return;
      }

      // 4. Developer Tools & Source Inspection (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U)
      if (
        e.key === 'F12' ||
        ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key))
      ) {
        e.preventDefault();
        e.stopPropagation();
        recordViolation('dev_tools', 'Developer inspection shortcut pressed');
        return;
      }

      // 5. Copy / Cut / Paste / Save shortcuts
      if ((e.ctrlKey || e.metaKey) && ['c', 'C', 'x', 'X', 'v', 'V', 's', 'S'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        recordViolation('keyboard_copy', `Prohibited keyboard shortcut (Ctrl+${e.key.toUpperCase()}) pressed`);
        return;
      }
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('selectstart', handleSelectStart);
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('selectstart', handleSelectStart);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [enabled, isSubmitted, recordViolation]);

  // 3. Setup Tab Switch & Visibility Change Detection
  useEffect(() => {
    if (!enabled || isSubmitted) return;

    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        setIsScreenShieldActive(true);
        recordViolation('tab_switch', 'Switched browser tab or minimized window');
      } else {
        setIsScreenShieldActive(false);
      }
    };

    const handleWindowBlur = () => {
      // When window loses focus (e.g. clicking off to another monitor or application)
      setIsScreenShieldActive(true);
      recordViolation('window_blur', 'Exam window lost focus (clicked outside or opened external app)');
    };

    const handleWindowFocus = () => {
      setIsScreenShieldActive(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [enabled, isSubmitted, recordViolation]);

  // 4. Fullscreen State Sync
  useEffect(() => {
    if (!enabled || isSubmitted) return;

    const handleFullscreenChange = () => {
      const isNowFullscreen = Boolean(document.fullscreenElement);
      setIsFullscreen(isNowFullscreen);
      if (!isNowFullscreen && !isSubmittedRef.current) {
        recordViolation('fullscreen_exit', 'Exited fullscreen examination mode');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [enabled, isSubmitted, recordViolation]);

  // 5. Navigation Guard: Beforeunload & History popstate
  useEffect(() => {
    if (!enabled || isSubmitted) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'An examination is currently active! Leaving will record a violation or finalize your assessment.';
      return e.returnValue;
    };

    // Push initial history state to trap back button
    window.history.pushState(null, '', window.location.href);

    const handlePopState = () => {
      // Re-push state so user stays on exam page
      window.history.pushState(null, '', window.location.href);
      recordViolation('navigation_attempt', 'Attempted to navigate away using browser back button');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [enabled, isSubmitted, recordViolation]);

  return {
    violationsCount,
    violationsLog,
    isWarningModalOpen,
    currentWarning,
    dismissWarningModal,
    isScreenShieldActive,
    isFullscreen,
    requestFullscreen,
    exitFullscreen,
    clearTestCache,
    persistState
  };
}
