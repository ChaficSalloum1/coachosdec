import type { Translation } from '../en';

export const messages: Translation['messages'] = {
  cancelSubject: 'Ακύρωση μαθήματος',
  reminderSubject: 'Υπενθύμιση μαθήματος',
  cancelOne:
    'Γεια σου {{name}}, λυπάμαι, πρέπει να ακυρώσω το μάθημά μας ({{when}}). Πες μου πότε σε βολεύει και θα βρούμε νέα ώρα.{{signOff}}',
  cancelWeekly:
    'Γεια σου {{name}}, λυπάμαι, πρέπει να ακυρώσω τα εβδομαδιαία μαθήματά μας από ({{when}}). Πες μου πότε σε βολεύει και θα βρούμε νέα ώρα.{{signOff}}',
  bookingApprovedSubject: 'Επιβεβαίωση μαθήματος',
  bookingDeclinedSubject: 'Το αίτημα μαθήματός σου',
  bookingApproved: 'Γεια σου {{name}}, το μάθημά μας επιβεβαιώθηκε: {{when}}{{where}}. Τα λέμε!{{signOff}}',
  bookingDeclined:
    'Γεια σου {{name}}, λυπάμαι, δεν μπορώ ({{when}}). Πες μου αν σε βολεύει άλλη ώρα και θα προσπαθήσω να τα βρούμε.{{signOff}}',
  when: '{{date}}, {{time}}',
  reminder: 'Γεια σου {{name}}, μια μικρή υπενθύμιση για το μάθημά μας ({{day}}, {{time}}){{where}}. Τα λέμε!{{signOff}}',
  where: ' – {{place}}',
  dayToday: 'σήμερα',
  dayTomorrow: 'αύριο',
  dayOn: '{{date}}',
  fallbackName: 'εκεί',
};
