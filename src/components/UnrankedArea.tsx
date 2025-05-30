'use client';

import { Comic } from '@/types';
import { useDrop } from 'react-dnd';
import ComicItem from './ComicItem';
import { useRef, memo } from 'react';

interface UnrankedAreaProps {
  comics: Comic[];
  onDropComic: (comic: Comic, source: string) => void;
}

function UnrankedArea({ comics, onDropComic }: UnrankedAreaProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'comic',
    drop: (item: { comic: Comic; source: string }) => {
      onDropComic(item.comic, item.source);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  drop(ref);

  return (
    <div className="h-full">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden h-full lg:max-h-[calc(100vh-200px)]">
        <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Unranked Comics ({comics.length})
          </h2>
        </div>
        
        <div
          ref={ref}
          className={`p-4 transition-colors lg:overflow-y-auto lg:h-[calc(100vh-280px)] ${
            isOver 
              ? 'bg-yellow-50 dark:bg-yellow-900/20' 
              : 'bg-white dark:bg-gray-800'
          }`}
        >
          {comics.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-400 dark:text-gray-600">
              <span className="text-center">
                All comics ranked!<br />Import more or drag comics back here.
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {comics.map((comic) => (
                <ComicItem key={comic.id} comic={comic} source="unranked" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(UnrankedArea);