
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AppRoutes from './routes';

// Type declaration for Google Tag Manager dataLayer
declare global {
  interface Window {
    dataLayer?: Array<Record<string, any>>;
  }
}

function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
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

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-brand-primary selection:text-slate-900 flex flex-col font-sans transition-colors duration-300">

      <ErrorBoundary>
        <Navbar
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
        />

        <main className="flex-grow flex flex-col relative overflow-hidden pt-20">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none mix-blend-multiply dark:mix-blend-screen opacity-70 dark:opacity-100" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[100px] pointer-events-none mix-blend-multiply dark:mix-blend-screen opacity-70 dark:opacity-100" />

          {location.pathname === '/free-obd2-code-decoder-repair-costs' ? (
            <div className="relative z-10 w-full">
              <AppRoutes />
            </div>
          ) : (
            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 flex flex-col items-center">
              <AppRoutes />
            </div>
          )}
        </main>

        <Footer />
      </ErrorBoundary>
    </div>
  );
}

export default App;

