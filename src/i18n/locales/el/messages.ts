import type { Translation } from '../en';

export const messages: Translation['messages'] = {
  cancelSubject: 'Ακύρωση μαθήματος',
  reminderSubject: 'Υπενθύμιση μαθήματος',
  cancelOne:
    'Γεια σου {{name}}, λυπάμαι, πρέπει να ακυρώσω το μάθημά μας ({{when}}). Πες μου πότε σε βολεύει και θα βρούμε νέα ώρα.{{signOff}}',
  cancelWeekly:
    'Γεια σου {{name}}, λυπάμαι, πρέπει να ακυρώσω τα εβδομαδιαία μαθήματά μας από ({{when}}). Πες μου πότε σε βολεύει και θα βρούμε νέα ώρα.{{signOff}}',
  when: '{{date}}, {{time}}',
  reminder: 'Γεια σου {{name}}, μια μικρή υπενθύμιση για το μάθημά μας ({{day}}, {{time}}){{where}}. Τα λέμε!{{signOff}}',
  where: ' – {{place}}',
  dayToday: 'σήμερα',
  dayTomorrow: 'αύριο',
  dayOn: '{{date}}',
  fallbackName: 'εκεί',
};
