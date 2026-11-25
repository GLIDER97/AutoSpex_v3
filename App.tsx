
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AppRoutes from './routes';
import SEO from './components/SEO';
import { ToolGuides } from './components/GuideList';
import { findStaticPage } from './seo/site';
import { isEmbedPath } from './data/embedIds';

// Type declaration for Google Tag Manager dataLayer
declare global {
  interface Window {
    dataLayer?: Array<Record<string, any>>;
  }
}

function App() {
  // Light is the default. A visitor's own choice is remembered in this browser.
  const [isDarkMode, setIsDarkMode] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem('theme') === 'dark') setIsDarkMode(true);
    } catch {
      // Storage unavailable (private mode): stay on the default.
    }
  }, []);
  const location = useLocation();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Push route changes to GTM dataLayer for SPA tracking
  useEffect(() => {
    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'page_view',
        page_path: location.pathname,
        page_title: document.title
      });
    }
  }, [location.pathname]);

  const toggleTheme = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch {
      // Storage unavailable: the choice lasts for this visit only.
    }
  };
  const pageMeta = findStaticPage(location.pathname);

  // Embeddable charts (/embed/chart/<id>) sit in iframes on other sites: no header, footer or site chrome.
  if (isEmbedPath(location.pathname)) {
    return (
      <div className="min-h-screen bg-background p-3 font-sans text-foreground sm:p-4">
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-sign-yellow selection:text-sign-ink flex flex-col font-sans">

      {/* Title, description and canonical for tool and info pages. Articles and the 404 page set their own. */}
      {pageMeta && (
        <SEO title={pageMeta.title} description={pageMeta.description} rawTitle={pageMeta.rawTitle} />
      )}

      <ErrorBoundary>
        <Navbar
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
        />

        <main className="grow flex flex-col relative overflow-hidden">
          {/* The homepage lays out its own full-width sections. */}
          {location.pathname === '/' || location.pathname === '/free-obd2-code-decoder-repair-costs' ? (
            <div className="relative z-10 w-full">
              <AppRoutes />
            </div>
          ) : (
            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 flex flex-col items-center">
              <AppRoutes />
              {/* Tool pages link to the guides that cover them. */}
              <ToolGuides path={location.pathname} />
            </div>
          )}
        </main>

        <Footer />
      </ErrorBoundary>
    </div>
  );
}

export default App;

