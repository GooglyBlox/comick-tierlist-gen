'use client';

import { Tier, Comic } from '@/types';
import { useDrop } from 'react-dnd';
import ComicItem from './ComicItem';
import { useRef, memo } from 'react';

interface TierRowProps {
  tier: Tier;
  onDropComic: (comic: Comic, targetTier: string, source: string) => void;
  isLast: boolean;
}

function TierRow({ tier, onDropComic, isLast }: TierRowProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'comic',
    drop: (item: { comic: Comic; source: string }) => {
      onDropComic(item.comic, tier.id, item.source);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  drop(ref);

  return (
    <div className={`flex min-h-28 ${!isLast ? 'border-b border-gray-200 dark:border-gray-700' : ''}`}>
      <div 
        className="w-32 flex-shrink-0 flex flex-col items-center justify-center p-4"
        style={{ backgroundColor: tier.color }}
      >
        <div className="text-2xl font-bold text-black mb-1">
          {tier.label}
        </div>
      </div>
      
      <div
        ref={ref}
        className={`flex-1 p-4 flex flex-wrap gap-3 min-h-28 items-start transition-colors ${
          isOver 
            ? 'bg-blue-50 dark:bg-blue-900/20' 
            : 'bg-gray-50 dark:bg-gray-800/50'
        }`}
      >
        {tier.comics.length === 0 && !isOver ? (
          <div className="flex items-center justify-center w-full h-full text-gray-400 dark:text-gray-600">
            <span className="text-lg"></span>
          </div>
        ) : (
          tier.comics.map((comic) => (
            <ComicItem key={`${tier.id}-${comic.id}`} comic={comic} source={tier.id} />
          ))
        )}
      </div>
    </div>
  );
}

export default memo(TierRow);