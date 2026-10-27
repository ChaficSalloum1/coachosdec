import type { Translation } from '../en';

export const errors: Translation['errors'] = {
  coachUnavailable: 'Το προφίλ προπονητή δεν είναι διαθέσιμο',
  requestNotFound: 'Το αίτημα κράτησης δεν βρέθηκε',
  requestAlreadyProcessed: 'Το αίτημα έχει ήδη επεξεργαστεί',
  missingBookingInfo: 'Λείπουν απαιτούμενα στοιχεία κράτησης',
  studentNotFound: 'Ο μαθητής δεν βρέθηκε.',
  selectedStudentNotFound: 'Ένας από τους επιλεγμένους μαθητές δεν βρέθηκε.',
  groupGone: 'Αυτή η ομάδα δεν υπάρχει πλέον.',
  notInGroup: 'Αυτός ο παίκτης δεν ανήκει σε αυτή την ομάδα.',
  groupCapacityRange: 'Μια ομάδα χρειάζεται από {{min}} έως {{max}} παίκτες.',
  groupNeedsPlayer: 'Προσθέστε τουλάχιστον έναν παίκτη στην ομάδα.',
  groupOverCapacity: 'Αυτή η ομάδα χωράει {{capacity}} παίκτες, αλλά προστέθηκαν {{count}}.',
  playerAddedTwice: 'Ο ίδιος παίκτης προστέθηκε δύο φορές.',
  invalidGroupPrice: 'Εισαγάγετε μια έγκυρη τιμή ανά παίκτη.',
  groupFull: 'Αυτή η ομάδα είναι πλήρης.',
  alreadyInGroup: 'Ο/Η {{name}} είναι ήδη σε αυτή την ομάδα.',
  invalidDateTime: 'Μη έγκυρη μορφή ημερομηνίας ή ώρας: {{date}} {{time}}',
  slotHasPendingRequest: 'Υπάρχει άλλο αίτημα κράτησης για αυτή την ώρα. Ανανεώστε και δοκιμάστε ξανά.',
  timeConflict: 'Σύγκρουση ώρας: Έχετε ήδη μάθημα με τον/την {{name}} αυτή την ώρα.',
  bookingSubmitFailed: 'Δεν ήταν δυνατή η υποβολή του αιτήματος κράτησης.',
  requestTimedOut: 'Η ενέργεια «{{action}}» έληξε. Ελέγξτε τη σύνδεσή σας στο διαδίκτυο και τις ρυθμίσεις του Supabase και δοκιμάστε ξανά.',
};
