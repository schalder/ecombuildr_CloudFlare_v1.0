import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

interface ProductGridSkeletonProps {
  count?: number;
}

export const ProductGridSkeleton: React.FC<ProductGridSkeletonProps> = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="overflow-hidden animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
          <div className="aspect-square relative">
            <Skeleton className="w-full h-full" />
          </div>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-3 w-3 rounded-full" />
              ))}
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-20" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};