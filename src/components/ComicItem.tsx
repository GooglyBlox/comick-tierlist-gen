'use client';

import { Comic } from '@/types';
import { useDrag } from 'react-dnd';
import Image from 'next/image';
import { useRef, memo } from 'react';

interface ComicItemProps {
  comic: Comic;
  source: string;
}

function ComicItem({ comic, source }: ComicItemProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'comic',
    item: { comic, source },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  drag(ref);

  return (
    <div
      ref={ref}
      className={`relative cursor-move transition-opacity select-none hover:scale-105 ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
      title={`${comic.title}${comic.status ? ` (${comic.status})` : ''}`}
    >
      <div className="w-20 h-28 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden border border-gray-300 dark:border-gray-600 shadow-sm">
        <Image
          src={comic.imageUrl}
          alt={comic.title}
          width={80}
          height={112}
          className="w-full h-full object-cover"
          unoptimized
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://via.placeholder.com/160x200/374151/ffffff?text=Error';
          }}
        />
      </div>
    </div>
  );
}

export default memo(ComicItem);