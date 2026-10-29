// Texts the coach sends to students (SMS or email), written in the coach's app language.
export const messages = {
  cancelSubject: 'Lesson cancelled',
  reminderSubject: 'Lesson reminder',
  cancelOne:
    "Hi {{name}}, I'm sorry, I have to cancel our lesson on {{when}}. Let me know when suits you and we'll find a new time.{{signOff}}",
  cancelWeekly:
    "Hi {{name}}, I'm sorry, I have to cancel our weekly lessons from {{when}}. Let me know when suits you and we'll find a new time.{{signOff}}",
  bookingApprovedSubject: 'Lesson confirmed',
  bookingDeclinedSubject: 'Your lesson request',
  bookingApproved: 'Hi {{name}}, your lesson is confirmed: {{when}}{{where}}. See you then!{{signOff}}',
  bookingDeclined:
    "Hi {{name}}, I'm sorry, I can't make {{when}}. Let me know if another time suits you and I'll do my best to fit you in.{{signOff}}",
  when: '{{date}} at {{time}}',
  reminder: 'Hi {{name}}, a quick reminder about our lesson {{day}} at {{time}}{{where}}. See you then!{{signOff}}',
  where: ' at {{place}}',
  dayToday: 'today',
  dayTomorrow: 'tomorrow',
  dayOn: 'on {{date}}',
  fallbackName: 'there',
};
