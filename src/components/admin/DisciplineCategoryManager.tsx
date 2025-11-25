/**
 * Discipline Category Manager Component
 * 
 * Provides a unified interface for managing both disciplines and categories
 * with feature flag support for gradual migration.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { DisciplineManager } from './DisciplineManager';
import { CategoryManager } from './CategoryManager';
import { LegacyCategoryManager } from './LegacyCategoryManager';

export interface DisciplineCategoryManagerProps {
  initialTab?: 'disciplines' | 'categories';
  onEntityChange?: (type: 'discipline' | 'category', entity: any) => void;
}

export const DisciplineCategoryManager: React.FC<DisciplineCategoryManagerProps> = ({
  initialTab = 'disciplines',
  onEntityChange
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isLoading, setIsLoading] = useState(true);
  
  const {
    shouldUseDisciplines,
    shouldShowNewUI,
    shouldSupportLegacy,
    isInMigrationMode,
    isLoading: flagsLoading
  } = useFeatureFlags();

  useEffect(() => {
    if (!flagsLoading) {
      setIsLoading(false);
    }
  }, [flagsLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading configuration...</span>
      </div>
    );
  }

  // Migration mode indicator
  const MigrationModeIndicator = () => {
    if (!isInMigrationMode) return null;
    
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Migration Mode Active:</strong> The system is transitioning to separate disciplines from categories.
              {shouldSupportLegacy && " Both old and new interfaces are available."}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Feature status indicator
  const FeatureStatusIndicator = () => (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
      <h4 className="text-sm font-medium text-blue-800 mb-2">Current Configuration</h4>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center">
          <span className={`w-2 h-2 rounded-full mr-2 ${shouldUseDisciplines ? 'bg-green-400' : 'bg-gray-300'}`}></span>
          <span>Disciplines Separation: {shouldUseDisciplines ? 'Enabled' : 'Disabled'}</span>
        </div>
        <div className="flex items-center">
          <span className={`w-2 h-2 rounded-full mr-2 ${shouldShowNewUI ? 'bg-green-400' : 'bg-gray-300'}`}></span>
          <span>New UI: {shouldShowNewUI ? 'Enabled' : 'Disabled'}</span>
        </div>
        <div className="flex items-center">
          <span className={`w-2 h-2 rounded-full mr-2 ${shouldSupportLegacy ? 'bg-yellow-400' : 'bg-gray-300'}`}></span>
          <span>Legacy Support: {shouldSupportLegacy ? 'Active' : 'Inactive'}</span>
        </div>
        <div className="flex items-center">
          <span className={`w-2 h-2 rounded-full mr-2 ${isInMigrationMode ? 'bg-orange-400' : 'bg-gray-300'}`}></span>
          <span>Migration Mode: {isInMigrationMode ? 'Active' : 'Inactive'}</span>
        </div>
      </div>
    </div>
  );

  // Render appropriate interface based on feature flags
  if (!shouldUseDisciplines) {
    // Legacy mode - use existing category manager
    return (
      <div className="space-y-6">
        <MigrationModeIndicator />
        <FeatureStatusIndicator />
        <LegacyCategoryManager onEntityChange={onEntityChange} />
      </div>
    );
  }

  // New separated mode
  return (
    <div className="space-y-6">
      <MigrationModeIndicator />
      <FeatureStatusIndicator />
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('disciplines')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'disciplines'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Medical Disciplines
            <span className="ml-2 bg-blue-100 text-blue-800 py-1 px-2 rounded-full text-xs">
              New
            </span>
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'categories'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Equipment Categories
            <span className="ml-2 bg-green-100 text-green-800 py-1 px-2 rounded-full text-xs">
              Updated
            </span>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'disciplines' ? (
          <DisciplineManager 
            onEntityChange={(entity) => onEntityChange?.('discipline', entity)}
          />
        ) : (
          <CategoryManager 
            onEntityChange={(entity) => onEntityChange?.('category', entity)}
          />
        )}
      </div>

      {/* Migration Help */}
      {shouldSupportLegacy && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
          <h4 className="text-sm font-medium text-gray-800 mb-2">Migration Guide</h4>
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Disciplines:</strong> Medical specialties like Cardiology, Radiology, Oncology</p>
            <p><strong>Categories:</strong> Equipment types like Monitors, Scanners, Pumps</p>
            <p><strong>Products:</strong> Can now belong to multiple disciplines and categories</p>
            {isInMigrationMode && (
              <p className="text-yellow-600 font-medium">
                Legacy data is being migrated automatically. Both systems work simultaneously.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};