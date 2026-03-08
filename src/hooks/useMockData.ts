import { useEffect } from 'react';
import { useCoachStore } from '../state/coachStore';
import { mockCoach, mockBookingRequests, mockLessons, mockStudents } from '../utils/mockData';
import { mockAreas, mockFacilities, mockCourts } from '../utils/mockLocationData';
import { mockAvailabilityRanges, mockBlackoutDates } from '../utils/mockAvailabilityData';

export function useMockData() {
  const { 
    coach, setCoach, 
    bookingRequests, addBookingRequest, 
    lessons, addLesson, 
    students, addStudent,
    areas, addArea,
    facilities, addFacility,
    courts, addCourt,
    availabilityRanges, addAvailabilityRange,
    blackoutDates, addBlackoutDate,
    migrateExistingData
  } = useCoachStore();

  useEffect(() => {
    // Add location data first (this runs every time to ensure locations exist)
    mockAreas.forEach(area => {
      const existingArea = areas.find(a => a.id === area.id);
      if (!existingArea) {
        addArea(area);
      }
    });

    mockFacilities.forEach(facility => {
      const existingFacility = facilities.find(f => f.id === facility.id);
      if (!existingFacility) {
        addFacility(facility);
      }
    });

    mockCourts.forEach(court => {
      const existingCourt = courts.find(c => c.id === court.id);
      if (!existingCourt) {
        addCourt(court);
      }
    });

    // Only initialize if no data exists
    if (!coach) {
      setCoach(mockCoach);
    }

    if (bookingRequests.length === 0) {
      mockBookingRequests.forEach(request => {
        addBookingRequest(request);
      });
    }

    if (lessons.length === 0) {
      mockLessons.forEach(lesson => {
        addLesson(lesson);
      });
    }

    if (students.length === 0) {
      mockStudents.forEach(student => {
        addStudent(student);
      });
    }

    // Add availability data
    if (availabilityRanges.length === 0) {
      mockAvailabilityRanges.forEach(range => {
        addAvailabilityRange(range);
      });
    }

    if (blackoutDates.length === 0) {
      mockBlackoutDates.forEach(blackout => {
        addBlackoutDate(blackout);
      });
    }
    
    // Run migration for existing data
    migrateExistingData();
  }, []);
}