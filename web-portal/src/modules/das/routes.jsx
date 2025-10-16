/**
 * DAS Module Routes
 * Defines all routes for the Data Analysis Service module
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DasHome from './pages/DasHome';
import DatasetDetails from './pages/DatasetDetails';
import RoutesGuard from './pages/RoutesGuard';
import { DAS_SECTIONS } from '@/config/permissions-constants';

/**
 * DAS Routes Component
 * Handles routing for the Data Analysis Service module with permission checks
 */
export default function DASRoutes() {
  return (
    <RoutesGuard requiredSection={DAS_SECTIONS.DATASETS} requiredAction="List">
      <Routes>
        <Route index element={<DasHome />} />
        <Route path="datasets/:datasetId" element={<DatasetDetails />} />
        <Route path="*" element={<Navigate to="/das" replace />} />
      </Routes>
    </RoutesGuard>
  );
}

