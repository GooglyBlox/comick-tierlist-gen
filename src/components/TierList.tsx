'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import html2canvas from 'html2canvas';
import { Comic, Tier, TierListData } from '@/types';
import { saveTierListData, loadTierListData, defaultTiers } from '@/lib/cookies';
import { extractUserIdFromUrl } from '@/lib/utils';
import TierRow from './TierRow';
import UnrankedArea from './UnrankedArea';
import SettingsModal from './SettingsModal';

const isTouchDevice = () => {
  return typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
};

export default function TierList() {
  const [comics, setComics] = useState<Comic[]>([]);
  const [tiers, setTiers] = useState<Tier[]>(defaultTiers);
  const [unrankedComics, setUnrankedComics] = useState<Comic[]>([]);
  const [comickUrl, setComickUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const tierListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedData = loadTierListData();
    if (savedData) {
      setComics(savedData.comics || []);
      setTiers(savedData.tiers || defaultTiers);
      setUnrankedComics(savedData.unrankedComics || []);
      setLastUpdated(savedData.lastUpdated || '');
      setComickUrl(savedData.sourceUrl || '');
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const data: TierListData = {
        comics,
        tiers,
        unrankedComics,
        lastUpdated,
        sourceUrl: comickUrl,
      };
      saveTierListData(data);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [comics, tiers, unrankedComics, lastUpdated, comickUrl]);

  const handleImportComics = useCallback(async () => {
    if (!comickUrl.trim()) return;

    setIsLoading(true);
    setError('');
    
    try {
      const userId = extractUserIdFromUrl(comickUrl);
      if (!userId) {
        throw new Error('Invalid Comick.io URL. Please use a valid user profile URL like: https://comick.io/user/[user-id]/list');
      }

      const response = await fetch('/api/comick', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      const newComics = data.comics || [];

      if (newComics.length === 0) {
        throw new Error('No comics found. Make sure the user profile exists and has public follows.');
      }

      const existingTitles = new Set(comics.map(c => c.title));
      const uniqueNewComics = newComics.filter(
        (comic: Comic) => !existingTitles.has(comic.title)
      );

      setComics(prev => [...prev, ...uniqueNewComics]);
      setUnrankedComics(prev => [...prev, ...uniqueNewComics]);
      setLastUpdated(new Date().toISOString());

      if (uniqueNewComics.length === 0) {
        setError('No new comics found. All comics from this list are already imported.');
      } else {
        setError('');
      }
    } catch (error) {
      console.error('Import error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [comickUrl, comics]);

  const handleDropComic = useCallback((comic: Comic, targetTier: string, source: string) => {
    if (source === targetTier) return;

    setTiers(prev => {
      const newTiers = prev.map(tier => {
        if (tier.id === source) {
          return { ...tier, comics: tier.comics.filter(c => c.id !== comic.id) };
        }
        if (tier.id === targetTier) {
          return { ...tier, comics: [...tier.comics, comic] };
        }
        return tier;
      });
      return newTiers;
    });

    if (source === 'unranked') {
      setUnrankedComics(prev => prev.filter(c => c.id !== comic.id));
    }
  }, []);

  const handleDropToUnranked = useCallback((comic: Comic, source: string) => {
    if (source === 'unranked') return;

    setTiers(prev => prev.map(tier => 
      tier.id === source 
        ? { ...tier, comics: tier.comics.filter(c => c.id !== comic.id) }
        : tier
    ));

    setUnrankedComics(prev => [...prev, comic]);
  }, []);

  const handleClearAll = useCallback(() => {
    setComics([]);
    setTiers(defaultTiers);
    setUnrankedComics([]);
    setComickUrl('');
    setLastUpdated('');
    setError('');
  }, []);

  const handleExportData = useCallback(() => {
    const data: TierListData = {
      comics,
      tiers,
      unrankedComics,
      lastUpdated,
      sourceUrl: comickUrl,
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `comick-tierlist-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [comics, tiers, unrankedComics, lastUpdated, comickUrl]);

  const handleExportImage = useCallback(async () => {
    if (!tierListRef.current) return;
    
    setIsExporting(true);
    
    try {
      const canvas = await html2canvas(tierListRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        ignoreElements: (element) => {
          return element.classList.contains('no-export');
        }
      });
      
      const link = document.createElement('a');
      link.download = `comick-tierlist-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error exporting image:', error);
      alert('Failed to export image. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, []);

  const handleImportData = useCallback((dataString: string) => {
    const data: TierListData = JSON.parse(dataString);
    setComics(data.comics || []);
    setTiers(data.tiers || defaultTiers);
    setUnrankedComics(data.unrankedComics || []);
    setLastUpdated(data.lastUpdated || '');
    setComickUrl(data.sourceUrl || '');
  }, []);

  const rankedComicsCount = useMemo(() => 
    tiers.reduce((total, tier) => total + tier.comics.length, 0), 
    [tiers]
  );

  const totalComicsCount = comics.length;

  return (
    <DndProvider backend={isTouchDevice() ? TouchBackend : HTML5Backend}>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Comick.io Tier List Generator
              </h1>
            </div>
            
            <div className="flex flex-col lg:flex-row gap-3 mb-6">
              <input
                type="text"
                value={comickUrl}
                onChange={(e) => setComickUrl(e.target.value)}
                placeholder="https://comick.io/user/[user-id]/list"
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleImportComics}
                  disabled={isLoading || !comickUrl.trim()}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Importing...' : 'Import'}
                </button>
                <button
                  onClick={handleExportImage}
                  disabled={isExporting || tiers.every(tier => tier.comics.length === 0)}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExporting ? 'Exporting...' : 'Export Image'}
                </button>
                <button
                  onClick={() => setShowSettings(true)}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded transition-colors"
                >
                  Settings
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                <p className="text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            {(lastUpdated || totalComicsCount > 0) && (
              <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                {totalComicsCount > 0 && <span>{totalComicsCount} imported</span>}
                {rankedComicsCount > 0 && <span>{rankedComicsCount} ranked</span>}
                {lastUpdated && <span>Updated {new Date(lastUpdated).toLocaleDateString()}</span>}
              </div>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex gap-6">
            <div className="flex-1">
              <div 
                ref={tierListRef}
                className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {tiers.map((tier, index) => (
                  <TierRow
                    key={tier.id}
                    tier={tier}
                    onDropComic={handleDropComic}
                    isLast={index === tiers.length - 1}
                  />
                ))}
              </div>
            </div>

            <div className="hidden lg:block w-80 no-export">
              <UnrankedArea
                comics={unrankedComics}
                onDropComic={handleDropToUnranked}
              />
            </div>
          </div>

          <div className="lg:hidden mt-6 no-export">
            <UnrankedArea
              comics={unrankedComics}
              onDropComic={handleDropToUnranked}
            />
          </div>
        </div>

        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          tiers={tiers}
          onUpdateTiers={setTiers}
          onClearAll={handleClearAll}
          onExportData={handleExportData}
          onImportData={handleImportData}
        />
      </div>
    </DndProvider>
  );
}