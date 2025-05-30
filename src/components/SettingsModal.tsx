/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState } from 'react';
import { Tier } from '@/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tiers: Tier[];
  onUpdateTiers: (tiers: Tier[]) => void;
  onClearAll: () => void;
  onExportData: () => void;
  onImportData: (data: string) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  tiers,
  onUpdateTiers,
  onClearAll,
  onExportData,
  onImportData
}: SettingsModalProps) {
  const [importText, setImportText] = useState('');

  if (!isOpen) return null;

  const handleAddTier = () => {
    const newTier: Tier = {
      id: `tier-${Date.now()}`,
      label: 'NEW',
      color: '#cccccc',
      comics: [],
    };
    onUpdateTiers([...tiers, newTier]);
  };

  const handleRemoveTier = (tierId: string) => {
    if (tiers.length <= 1) return;
    onUpdateTiers(tiers.filter(t => t.id !== tierId));
  };

  const handleUpdateTier = (tierId: string, updates: Partial<Tier>) => {
    onUpdateTiers(tiers.map(tier => 
      tier.id === tierId ? { ...tier, ...updates } : tier
    ));
  };

  const handleMoveTier = (tierId: string, direction: 'up' | 'down') => {
    const currentIndex = tiers.findIndex(t => t.id === tierId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= tiers.length) return;

    const newTiers = [...tiers];
    [newTiers[currentIndex], newTiers[newIndex]] = [newTiers[newIndex], newTiers[currentIndex]];
    onUpdateTiers(newTiers);
  };

  const handleImport = () => {
    try {
      onImportData(importText);
      setImportText('');
      alert('Data imported successfully!');
    } catch (error) {
      alert('Failed to import data. Please check the format.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            <section>
              <h3 className="text-base font-medium text-gray-900 dark:text-white mb-3">Tiers</h3>
              <div className="space-y-2">
                {tiers.map((tier, index) => (
                  <div key={tier.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleMoveTier(tier.id, 'up')}
                        disabled={index === 0}
                        className="w-6 h-6 flex items-center justify-center bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded text-xs hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => handleMoveTier(tier.id, 'down')}
                        disabled={index === tiers.length - 1}
                        className="w-6 h-6 flex items-center justify-center bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded text-xs hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-30"
                      >
                        ↓
                      </button>
                    </div>
                    
                    <input
                      type="color"
                      value={tier.color}
                      onChange={(e) => handleUpdateTier(tier.id, { color: e.target.value })}
                      className="w-10 h-10 rounded border border-gray-300 dark:border-gray-500 cursor-pointer"
                      style={{ backgroundColor: tier.color }}
                    />
                    
                    <input
                      type="text"
                      value={tier.label}
                      onChange={(e) => handleUpdateTier(tier.id, { label: e.target.value.toUpperCase() })}
                      className="flex-1 px-2 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-gray-900 dark:text-white text-sm text-center"
                      maxLength={5}
                    />
                    
                    <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[2rem] text-center">
                      {tier.comics.length}
                    </span>
                    
                    <button
                      onClick={() => handleRemoveTier(tier.id)}
                      disabled={tiers.length <= 1}
                      className="w-8 h-8 flex items-center justify-center bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-30 text-sm"
                    >
                      ×
                    </button>
                  </div>
                ))}
                
                <button
                  onClick={handleAddTier}
                  className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded text-gray-600 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 text-sm"
                >
                  Add Tier
                </button>
              </div>
            </section>

            <section>
              <h3 className="text-base font-medium text-gray-900 dark:text-white mb-3">Data</h3>
              <div className="space-y-2">
                <button
                  onClick={onExportData}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  Export Data
                </button>
                
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Paste exported data here..."
                  className="w-full h-20 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white text-sm resize-none"
                />
                <button
                  onClick={handleImport}
                  disabled={!importText.trim()}
                  className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm"
                >
                  Import Data
                </button>
                
                <button
                  onClick={() => {
                    if (window.confirm('Clear all data? This cannot be undone.')) {
                      onClearAll();
                      onClose();
                    }
                  }}
                  className="w-full px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                >
                  Clear All
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}