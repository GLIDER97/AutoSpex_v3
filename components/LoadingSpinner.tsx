import React from 'react';
import { CarLoader } from './tool/CarLoader';

// Shown while a page's code loads.
const LoadingSpinner: React.FC = () => <CarLoader label="Loading…" size="xl" className="min-h-[50vh] w-full" />;

export default LoadingSpinner;
