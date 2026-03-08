import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import { Lesson } from '../types/coach';

/**
 * CalendarService - Device calendar integration for lesson management
 * 
 * Handles creation, updates, and deletion of calendar events
 * Manages permissions and calendar initialization
 */
export class CalendarService {
  private static defaultCalendarId: string | null = null;
  private static isInitialized: boolean = false;

  /**
   * Initialize calendar service and get/create default calendar
   * @returns Promise<boolean> - true if initialized successfully
   */
  static async initialize(): Promise<boolean> {
    try {
      // Check if already initialized
      if (this.isInitialized && this.defaultCalendarId) {
        return true;
      }

      // Request permissions
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      
      if (status !== 'granted') {
        if (__DEV__) {
          console.warn('📅 Calendar permissions not granted');
        }
        return false;
      }

      // Get or create default calendar
      if (Platform.OS === 'ios') {
        const defaultCalendar = await Calendar.getDefaultCalendarAsync();
        this.defaultCalendarId = defaultCalendar.id;
      } else {
        // Android: Get primary calendar or create one
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        const primaryCalendar = calendars.find(cal => cal.isPrimary) || calendars[0];
        
        if (primaryCalendar) {
          this.defaultCalendarId = primaryCalendar.id;
        } else {
          // Create new calendar for CoachOS
          this.defaultCalendarId = await Calendar.createCalendarAsync({
            title: 'CoachOS Lessons',
            color: '#1E88E5',
            entityType: Calendar.EntityTypes.EVENT,
            source: { 
              isLocalAccount: true, 
              name: 'CoachOS Calendar',
              type: Calendar.SourceType.LOCAL 
            },
            name: 'coachos_lessons',
            ownerAccount: 'personal',
            accessLevel: Calendar.CalendarAccessLevel.OWNER,
          });
        }
      }

      this.isInitialized = true;

      if (__DEV__) {
        console.log('📅 Calendar service initialized:', this.defaultCalendarId);
      }

      return true;
    } catch (error) {
      if (__DEV__) {
        console.error('📅 Failed to initialize calendar service:', error);
      }
      return false;
    }
  }

  /**
   * Create a calendar event for a lesson
   * @param lesson - Lesson object to create event for
   * @returns Promise<string | null> - Calendar event ID or null if failed
   */
  static async createLessonEvent(lesson: Lesson): Promise<string | null> {
    try {
      if (!this.defaultCalendarId) {
        const initialized = await this.initialize();
        if (!initialized) return null;
      }

      if (!this.defaultCalendarId) {
        return null;
      }

      const startDate = new Date(`${lesson.date}T${lesson.startTime}`);
      const endDate = new Date(`${lesson.date}T${lesson.endTime}`);

      const eventId = await Calendar.createEventAsync(this.defaultCalendarId, {
        title: `Lesson: ${lesson.studentName}`,
        startDate,
        endDate,
        location: this.formatLessonLocation(lesson),
        notes: this.formatLessonNotes(lesson),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        allDay: false,
        availability: Calendar.Availability.BUSY,
      });

      if (__DEV__) {
        console.log('📅 Created calendar event:', eventId, 'for', lesson.studentName);
      }

      return eventId;
    } catch (error) {
      if (__DEV__) {
        console.error('📅 Failed to create calendar event:', error);
      }
      return null;
    }
  }

  /**
   * Update an existing calendar event
   * @param eventId - Calendar event ID to update
   * @param lesson - Updated lesson data
   * @returns Promise<boolean> - true if updated successfully
   */
  static async updateLessonEvent(eventId: string, lesson: Lesson): Promise<boolean> {
    try {
      const startDate = new Date(`${lesson.date}T${lesson.startTime}`);
      const endDate = new Date(`${lesson.date}T${lesson.endTime}`);

      await Calendar.updateEventAsync(eventId, {
        title: `Lesson: ${lesson.studentName}`,
        startDate,
        endDate,
        location: this.formatLessonLocation(lesson),
        notes: this.formatLessonNotes(lesson),
      });

      if (__DEV__) {
        console.log('📅 Updated calendar event:', eventId);
      }

      return true;
    } catch (error) {
      if (__DEV__) {
        console.error('📅 Failed to update calendar event:', error);
      }
      return false;
    }
  }

  /**
   * Delete a calendar event
   * @param eventId - Calendar event ID to delete
   * @returns Promise<boolean> - true if deleted successfully
   */
  static async deleteLessonEvent(eventId: string): Promise<boolean> {
    try {
      await Calendar.deleteEventAsync(eventId);

      if (__DEV__) {
        console.log('📅 Deleted calendar event:', eventId);
      }

      return true;
    } catch (error) {
      if (__DEV__) {
        console.error('📅 Failed to delete calendar event:', error);
      }
      return false;
    }
  }

  /**
   * Get events for a specific date range
   * @param startDate - Start date of range
   * @param endDate - End date of range
   * @returns Promise<Calendar.Event[]> - Array of calendar events
   */
  static async getEventsForRange(startDate: Date, endDate: Date): Promise<Calendar.Event[]> {
    try {
      if (!this.defaultCalendarId) {
        const initialized = await this.initialize();
        if (!initialized) return [];
      }

      if (!this.defaultCalendarId) {
        return [];
      }

      const events = await Calendar.getEventsAsync([this.defaultCalendarId], startDate, endDate);
      return events;
    } catch (error) {
      if (__DEV__) {
        console.error('📅 Failed to get calendar events:', error);
      }
      return [];
    }
  }

  /**
   * Check if calendar permissions are granted
   * @returns Promise<boolean> - true if permissions granted
   */
  static async checkPermissions(): Promise<boolean> {
    try {
      const { status } = await Calendar.getCalendarPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      if (__DEV__) {
        console.error('📅 Failed to check calendar permissions:', error);
      }
      return false;
    }
  }

  /**
   * Reset calendar service (useful for testing)
   */
  static reset(): void {
    this.defaultCalendarId = null;
    this.isInitialized = false;
  }

  /**
   * Format lesson location for calendar event
   * @private
   */
  private static formatLessonLocation(lesson: Lesson): string {
    const parts: string[] = [];
    
    if (lesson.courtId) parts.push(`Court ${lesson.courtId}`);
    if (lesson.facilityId) parts.push(lesson.facilityId);
    if (lesson.areaId) parts.push(lesson.areaId);
    
    return parts.length > 0 ? parts.join(' • ') : 'Tennis Lesson';
  }

  /**
   * Format lesson notes for calendar event
   * @private
   */
  private static formatLessonNotes(lesson: Lesson): string {
    const notes: string[] = [];
    
    notes.push(`Student: ${lesson.studentName}`);
    notes.push(`Duration: ${lesson.duration} minutes`);
    notes.push(`Price: $${lesson.price.toFixed(2)}`);
    notes.push(`Payment Status: ${lesson.isPaid ? '✓ Paid' : '⏳ Unpaid'}`);
    
    if (lesson.notes) {
      notes.push('');
      notes.push(`Notes: ${lesson.notes}`);
    }
    
    notes.push('');
    notes.push('Managed by CoachOS');
    
    return notes.join('\n');
  }
}
