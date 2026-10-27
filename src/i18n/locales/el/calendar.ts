import type { Translation } from '../en';

export const calendar: Translation['calendar'] = {
  calendarName: 'Μαθήματα CoachOS',
  eventTitle: 'Μάθημα: {{name}}',
  court: 'Γήπεδο {{id}}',
  lessonFallback: 'Μάθημα',
  student: 'Μαθητής: {{name}}',
  duration: 'Διάρκεια: {{minutes}} λεπτά',
  price: 'Τιμή: {{amount}}',
  paymentStatus: 'Κατάσταση πληρωμής: {{status}}',
  paid: '✓ Πληρωμένο',
  unpaid: '⏳ Απλήρωτο',
  notes: 'Σημειώσεις: {{notes}}',
  managedBy: 'Διαχειρίζεται από το CoachOS',
  exportDialogTitle: 'Εξαγωγή δεδομένων CoachOS',
  exportComplete: 'Η εξαγωγή ολοκληρώθηκε',
  exportedTo: 'Τα δεδομένα εξήχθησαν στο: {{fileName}}',
  exportFailed: 'Η εξαγωγή απέτυχε',
  exportFailedBody: 'Δεν ήταν δυνατή η εξαγωγή των δεδομένων. Δοκιμάστε ξανά.',
};
