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
  console.log('🔍 Checking lesson availability:', {
    lessonId: lesson.id,
    dripEnabled: lesson.drip_enabled,
    dripType: lesson.drip_type,
    dripDays: lesson.drip_days,
    dripReleaseDate: lesson.drip_release_date,
    courseOrder: courseOrder ? { id: courseOrder.id, created_at: courseOrder.created_at } : null
  });

  // If drip content is not enabled, lesson is always available
  if (!lesson.drip_enabled) {
    console.log('✅ Lesson available - drip not enabled');
    return { available: true, releaseDate: null };
  }

  // For days_after_purchase, purchase date is required to compute release
  if (lesson.drip_type === 'days_after_purchase' && !courseOrder) {
    console.log('❌ Lesson not available - days_after_purchase but no course order');
    return { available: false, releaseDate: null };
  }

  const now = new Date();
  let releaseDate: Date;

  if (lesson.drip_type === 'days_after_purchase') {
    // Calculate release date based on purchase date + drip days
    const purchaseDate = new Date(courseOrder!.created_at);
    releaseDate = addDays(purchaseDate, lesson.drip_days);
    console.log('📅 Days after purchase calculation:', {
      purchaseDate: purchaseDate.toISOString(),
      dripDays: lesson.drip_days,
      releaseDate: releaseDate.toISOString(),
      now: now.toISOString()
    });
  } else {
    // Use specific release date
    if (!lesson.drip_release_date) {
      console.log('❌ Lesson not available - specific_date but no release date set');
      return { available: false, releaseDate: null };
    }
    
    // Safe date parsing - handle both timestamp and date-only formats
    try {
      if (lesson.drip_release_date.includes('T')) {
        // Already has time component
        releaseDate = new Date(lesson.drip_release_date);
      } else {
        // Date-only format, add UTC time
        releaseDate = new Date(lesson.drip_release_date + 'T00:00:00.000Z');
      }
      
      // Check if date is valid
      if (isNaN(releaseDate.getTime())) {
        console.log('❌ Invalid release date format:', lesson.drip_release_date);
        return { available: false, releaseDate: null };
      }
      
      console.log('📅 Specific date calculation:', {
        dripReleaseDate: lesson.drip_release_date,
        releaseDate: releaseDate.toISOString(),
        now: now.toISOString(),
        comparison: now >= releaseDate ? 'available' : 'locked'
      });
    } catch (error) {
      console.log('❌ Error parsing release date:', error);
      return { available: false, releaseDate: null };
    }
  }

  const available = now >= releaseDate;
  console.log(available ? '✅ Lesson available' : '⏰ Lesson locked until release date');
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