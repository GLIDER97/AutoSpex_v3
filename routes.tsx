import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Page Components
import HomePage from './components/HomePage';
import FaultCodeDecoder from './components/FaultCodeDecoder';
import VinLookup from './components/VinLookup';
import InsuranceEstimator from './components/InsuranceEstimator';
import MpgCalculator from './components/MpgCalculator';
import AffordabilityPredictor from './components/AffordabilityPredictor';
import MaintenanceValidator from './components/MaintenanceValidator';
import ValueShockCalculator from './components/ValueShockCalculator';
import OwnershipCalculator from './components/OwnershipCalculator';
import PlateGenerator from './components/PlateGenerator';
import WrapDesigner from './components/WrapDesigner';
import MechanicFinder from './components/MechanicFinder';
import ResourceHub from './components/ResourceHub';
import DiyToolkits from './components/DiyToolkits';
import { PrivacyPolicy, TermsOfService, CookiePolicy, ContactUs, AboutUs } from './components/LegalPages';

const AppRoutes: React.FC = () => {
  return (
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
      <Route path="/diy-toolkits" element={<DiyToolkits />} />
      <Route path="/coupons" element={<ResourceHub type="coupons" />} />
      
      {/* Legal Pages */}
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/cookie-policy" element={<CookiePolicy />} />
      <Route path="/contact" element={<ContactUs />} />
      <Route path="/about" element={<AboutUs />} />
      
      {/* Fallback - redirect to home */}
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
};

export default AppRoutes;
