import React, { useState, useEffect } from 'react';
import './InstallPrompt.css';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    console.log('=== PWA Installation Debug ===');
    console.log('User Agent:', navigator.userAgent);
    console.log('Is iOS:', /iPad|iPhone|iPod/.test(navigator.userAgent));
    console.log('Is Android:', /Android/.test(navigator.userAgent));
    console.log('Is standalone:', window.matchMedia('(display-mode: standalone)').matches);
    console.log('Is Chrome:', /Chrome/.test(navigator.userAgent));
    console.log('Is Safari:', /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent));
    console.log('==============================');

    const handler = (e) => {
      console.log('beforeinstallprompt event fired!', e);
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Save the event so it can be triggered later
      setDeferredPrompt(e);
      // Show our custom install prompt
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('App is already installed (standalone mode)');
      setShowPrompt(false);
    }

    // For iOS, show a different prompt since iOS doesn't support beforeinstallprompt
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    
    if (isIOS && !isInStandaloneMode) {
      console.log('iOS detected, showing iOS-specific install guidance');
      // Show iOS install instructions after a delay
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`User response to the install prompt: ${outcome}`);
    
    // Clear the deferredPrompt for next time
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Remember user dismissed it (could store in localStorage)
    localStorage.setItem('pwa-prompt-dismissed', Date.now());
  };

  // Don't show if user recently dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      if (dismissedTime > oneDayAgo) {
        setShowPrompt(false);
      }
    }
  }, []);

  if (!showPrompt) {
    return null;
  }

  // Detect iOS for different install instructions
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <div className="install-prompt">
      <div className="install-prompt-content">
        <div className="install-prompt-icon">📱</div>
        <div className="install-prompt-text">
          <h3>Install Toronto Events</h3>
          {isIOS ? (
            <p>
              Tap the <strong>Share</strong> button <span style={{fontSize: '1.2em'}}>↗️</span> in Safari, 
              then select <strong>"Add to Home Screen"</strong>
            </p>
          ) : (
            <p>Get quick access to the Toronto event calendar right from your home screen!</p>
          )}
        </div>
        <div className="install-prompt-actions">
          {deferredPrompt ? (
            <button 
              className="btn btn-primary install-btn"
              onClick={handleInstall}
            >
              Install
            </button>
          ) : isIOS ? (
            <button 
              className="btn btn-primary install-btn"
              onClick={handleDismiss}
            >
              Got it!
            </button>
          ) : null}
          <button 
            className="btn btn-secondary dismiss-btn"
            onClick={handleDismiss}
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;