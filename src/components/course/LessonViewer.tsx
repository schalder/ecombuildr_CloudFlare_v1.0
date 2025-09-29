import React from 'react';
import { LessonCountdown } from '@/components/drip-content/LessonCountdown';
import { isLessonAvailable } from '@/utils/dripContentUtils';
interface LessonViewerProps {
  lesson: {
    id: string;
    title: string;
    content: string;
    drip_enabled?: boolean;
    drip_type?: 'days_after_purchase' | 'specific_date';
    drip_days?: number;
    drip_release_date?: string;
    drip_lock_message?: string;
  };
  courseOrder?: {
    id: string;
    created_at: string;
    course_id: string;
  } | null;
  courseOrderLoading?: boolean;
}

export function LessonViewer({ lesson, courseOrder, courseOrderLoading = false }: LessonViewerProps) {
  if (!lesson.drip_enabled) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{lesson.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
      </div>
    );
  }

  const { available, releaseDate } = isLessonAvailable(lesson as any, courseOrder);

  if (!available && releaseDate) {
    return (
      <LessonCountdown
        releaseDate={releaseDate}
        lockMessage={lesson.drip_lock_message || 'This lesson will be available after you complete the prerequisites.'}
        lessonTitle={lesson.title}
      />
    );
  }

  // Show loading state while fetching course order for drip content
  if (courseOrderLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (lesson.drip_type === 'days_after_purchase' && !courseOrder) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{lesson.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{lesson.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
    </div>
  );
}