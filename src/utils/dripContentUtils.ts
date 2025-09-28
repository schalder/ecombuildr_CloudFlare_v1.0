import { addDays } from 'date-fns';

export interface DripContentLesson {
  id: string;
  drip_enabled: boolean;
  drip_type: 'days_after_purchase' | 'specific_date';
  drip_days: number;
  drip_release_date: string | null;
  drip_lock_message: string;
}

export interface CourseOrder {
  id: string;
  created_at: string;
  course_id: string;
}

export function isLessonAvailable(
  lesson: DripContentLesson,
  courseOrder: CourseOrder | null
): { available: boolean; releaseDate: Date | null } {
  // If drip content is not enabled, lesson is always available
  if (!lesson.drip_enabled) {
    return { available: true, releaseDate: null };
  }

  // If no course order (not purchased), lesson is not available
  if (!courseOrder) {
    return { available: false, releaseDate: null };
  }

  const now = new Date();
  let releaseDate: Date;

  if (lesson.drip_type === 'days_after_purchase') {
    // Calculate release date based on purchase date + drip days
    const purchaseDate = new Date(courseOrder.created_at);
    releaseDate = addDays(purchaseDate, lesson.drip_days);
  } else {
    // Use specific release date
    if (!lesson.drip_release_date) {
      return { available: false, releaseDate: null };
    }
    releaseDate = new Date(lesson.drip_release_date);
  }

  const available = now >= releaseDate;
  return { available, releaseDate };
}

export function getLessonAvailabilityStatus(
  lesson: DripContentLesson,
  courseOrder: CourseOrder | null
): 'available' | 'locked' | 'not_purchased' {
  if (!courseOrder) {
    return 'not_purchased';
  }

  const { available } = isLessonAvailable(lesson, courseOrder);
  return available ? 'available' : 'locked';
}

export function formatDripContentSummary(lesson: DripContentLesson): string {
  if (!lesson.drip_enabled) {
    return 'Available immediately';
  }

  if (lesson.drip_type === 'days_after_purchase') {
    if (lesson.drip_days === 0) {
      return 'Available immediately after purchase';
    }
    return `Available ${lesson.drip_days} day${lesson.drip_days === 1 ? '' : 's'} after purchase`;
  }

  if (lesson.drip_release_date) {
    const releaseDate = new Date(lesson.drip_release_date);
    return `Available on ${releaseDate.toLocaleDateString()}`;
  }

  return 'Release date not set';
}