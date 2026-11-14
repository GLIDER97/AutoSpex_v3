import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoadingSpinner from './components/LoadingSpinner';
import NotFound from './components/NotFound';

const ArticleLoader = React.lazy(() => import('./Article/components/ArticleLoader')); // Import Loader
// Lazy Load Pages
const HomePage = React.lazy(() => import('./components/HomePage'));
const FaultCodeDecoder = React.lazy(() => import('./components/FaultCodeDecoder'));
const VinLookup = React.lazy(() => import('./components/VinLookup'));
const InsuranceEstimator = React.lazy(() => import('./components/InsuranceEstimator'));
const MpgCalculator = React.lazy(() => import('./components/MpgCalculator'));
const AffordabilityPredictor = React.lazy(() => import('./components/AffordabilityPredictor'));
const MaintenanceValidator = React.lazy(() => import('./components/MaintenanceValidator'));
const ValueShockCalculator = React.lazy(() => import('./components/ValueShockCalculator'));
const OwnershipCalculator = React.lazy(() => import('./components/OwnershipCalculator'));
const PlateGenerator = React.lazy(() => import('./components/PlateGenerator'));
const WrapDesigner = React.lazy(() => import('./components/WrapDesigner'));
const MechanicFinder = React.lazy(() => import('./components/MechanicFinder'));
const ResourceHub = React.lazy(() => import('./components/ResourceHub'));
const DiyToolkits = React.lazy(() => import('./components/DiyToolkits'));
const Blog = React.lazy(() => import('./components/Blog'));
// const FreeObd2CodeDecoderPost - Removed (Handled by ArticleLoader + Redirect)
const LegalPages = React.lazy(() => import('./components/LegalPages').then(module => ({ default: module.PrivacyPolicy })));
// Actually, LegalPages exports multiple components. React.lazy expects a default export.
// We should import normally for small pages or wrap them. 
// For now, let's keep LegalPages sync if they are small, or just lazy load the component file if it was a default export.
// The code says: import { PrivacyPolicy ... } from './LegalPages'
// So we can't easily lazy load named exports without intermediate format: React.lazy(() => import('./LegalPages').then(module => ({ default: module.PrivacyPolicy })))
// Let's keep LegalPages synchronous to avoid complexity for now, or just lazy load the heavy tools.

// For named exports, we'll keep using the direct import for now to avoid the `then` chain complexity for multiple exports from same file
import { PrivacyPolicy, TermsOfService, CookiePolicy, ContactUs, AboutUs } from './components/LegalPages';

const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Home */}
        <Route path="/" element={<HomePage />} />

        {/* Tools */}
        <Route path="/fault-code-decoder" element={<FaultCodeDecoder />} />
        <Route path="/vin-lookup" element={<VinLookup />} />
        <Route path="/insurance-estimator" element={<InsuranceEstimator />} />
        <Route path="/mpg-calculator" element={<MpgCalculator />} />
        <Route path="/affordability-predictor" element={<AffordabilityPredictor />} />
        <Route path="/maintenance-validator" element={<MaintenanceValidator />} />
        <Route path="/value-shock-calculator" element={<ValueShockCalculator />} />
        <Route path="/ownership-calculator" element={<OwnershipCalculator />} />
        <Route path="/plate-generator" element={<PlateGenerator />} />
        <Route path="/wrap-designer" element={<WrapDesigner />} />
        <Route path="/mechanic-finder" element={<MechanicFinder />} />

        {/* Resources */}
        <Route path="/recalls" element={<ResourceHub type="recalls" />} />
        <Route path="/coupons" element={<ResourceHub type="coupons" />} />
        <Route path="/diy-toolkits" element={<DiyToolkits />} />
        <Route path="/blog" element={<Blog />} />

        {/* Legacy Redirect for SEO/Bookmarking */}
        <Route path="/free-obd2-code-decoder-repair-costs" element={<Navigate to="/article/free-obd2-code-decoder-repair-costs" replace />} />

        <Route path="/article/:slug" element={<ArticleLoader />} />


        {/* Legal Pages */}
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/cookie-policy" element={<CookiePolicy />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/about" element={<AboutUs />} />

        {/* Unknown URLs get a real "not found" page (served with a 404 status by Vercel) */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
