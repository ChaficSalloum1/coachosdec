# Tennis Coach Management App

A comprehensive mobile application for tennis coaches to manage students, lessons, bookings, availability, and student notes.

## Features

### 📚 Student Notes System
- **Timeline View**: Visual timeline showing all notes for each student grouped by date
- **Search**: Quickly find notes by searching through content and tags
- **Add/Edit/Delete**: Full CRUD operations for student notes
- **Tags**: Categorize notes with custom tags (e.g., "technique", "progress", "goal")
- **Link to Lessons**: Optionally associate notes with specific lessons
- **Persistent Storage**: All notes are automatically saved to device storage

### 👥 Student Management
- Track student information (name, contact, lessons, payments)
- View student lesson history
- Calculate balances and payment status
- Add quick notes about students

### 📅 Lesson Management
- Schedule, complete, and cancel lessons
- Track lesson payments
- View lesson history by student
- Auto-complete past lessons
- Calendar sync integration (optional)

### 🏢 Location Management
- Organize by Areas, Facilities, and Courts
- Associate lessons with specific locations
- Manage multiple teaching locations

### ⏰ Availability System
- Set weekly availability by day and time
- Assign availability to specific locations
- Manage blackout dates
- Prevent double-bookings

### 📨 Booking Requests
- Receive and approve student booking requests
- Validate time conflicts automatically
- Convert approved bookings to scheduled lessons

## Technical Stack

- **Framework**: React Native (Expo SDK 53, React Native 0.76.7)
- **State Management**: Zustand with AsyncStorage persistence
- **Styling**: NativeWind (TailwindCSS for React Native)
- **Navigation**: React Navigation
- **Icons**: Lucide React Native
- **Date Handling**: date-fns

## Project Structure

```
src/
├── components/
│   └── StudentNotesScreen.tsx      # Student notes timeline UI
├── screens/
│   ├── StudentsScreen.tsx          # Main students list screen
│   ├── HomeScreen.tsx              # Dashboard
│   ├── CalendarScreen.tsx          # Schedule view
│   └── SettingsScreen.tsx          # Coach settings
├── state/
│   └── coachStore.ts               # Zustand store with all app state
├── types/
│   └── coach.ts                    # TypeScript interfaces
├── utils/
│   ├── dateFormat.ts               # Date formatting utilities
│   └── calendarService.ts          # Device calendar integration
└── navigation/
    └── RootNavigator.tsx           # App navigation structure
```

## Recent Updates

### Student Notes System Fix (2025-11-15)

**Issue**: Created notes were not persisting after app reload

**Root Cause**: The `studentNotes` array was not included in the Zustand persist middleware's `partialize` function, causing notes to be stored in memory only without being saved to AsyncStorage.

**Fix**: Added `studentNotes: state.studentNotes` to the partialize configuration in `src/state/coachStore.ts:1036`

**Performance Optimizations**:
1. Added `useMemo` hooks to `StudentNotesScreen.tsx` to prevent unnecessary recalculations:
   - Memoized `displayNotes` to avoid filtering on every render
   - Memoized `groupedNotes` to avoid regrouping notes by date on every render
   - Memoized `sortedDates` to avoid re-sorting on every render

2. Optimized Zustand selectors in `StudentsScreen.tsx`:
   - Changed from destructuring entire store to using individual selectors
   - This prevents unnecessary re-renders when unrelated store values change
   - Follows Zustand best practices for performance

## Key Files

- **src/state/coachStore.ts**: Central state management with all store methods and persistence
- **src/components/StudentNotesScreen.tsx**: Full-featured notes interface with timeline UI
- **src/screens/StudentsScreen.tsx**: Student list with notes integration
- **src/types/coach.ts**: All TypeScript type definitions

## Store Methods for Notes

```typescript
// Add a new note
addStudentNote(note: Omit<StudentNote, 'id' | 'createdAt'>): void

// Update note content
updateStudentNote(noteId: string, content: string): void

// Delete a note
deleteStudentNote(noteId: string): void

// Get all notes for a student (sorted newest first)
getStudentNotes(studentId: string): StudentNote[]

// Search notes by content or tags
searchStudentNotes(studentId: string, query: string): StudentNote[]

// Get notes grouped by date
getStudentNotesGroupedByDate(studentId: string): Record<string, StudentNote[]>
```

## Data Persistence

All app data is automatically persisted to AsyncStorage including:
- Coach profile
- Booking requests
- Lessons
- Students
- Student notes ✅ (Fixed)
- Areas, facilities, courts
- Availability ranges
- Blackout dates

## Development Notes

- Uses `bun` as package manager (not npm)
- TypeScript strict mode enabled
- All components use proper TypeScript typing
- Follows React Native best practices for performance
- Uses Zustand selectors to prevent unnecessary re-renders
- Implements proper memoization for expensive computations

## Security & Backend

### Supabase Integration

The app uses Supabase for backend services:
- **Authentication**: Email/password auth with session persistence
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Real-time**: Subscriptions for live data updates

### Security Features

- **Row Level Security (RLS)**: Each coach can only access their own data
- **Field Encryption**: Sensitive data (payment info, contacts) encrypted at rest
- **Optimistic Locking**: Version columns prevent concurrent modification conflicts
- **Soft Deletes**: Data recovery enabled via `deleted_at` columns
- **Input Validation**: Server-side constraints + client-side validation

### Required Migrations

Before production, run these in Supabase SQL Editor:
1. `scripts/priority1-migration.sql` - Secure RLS policies
2. `scripts/priority2-soft-deletes-migration.sql` - Soft delete support

See `SECURITY_CHECKLIST.md` for complete security documentation.
