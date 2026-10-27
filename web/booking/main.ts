/*
Public student booking page. Reads a coach's open times through the
get_public_booking_* RPCs and sends a request with submit_public_booking_request.
Opened at /book/<booking-link>. No accounts, no framework.
*/
import { PUBLIC_BOOKING } from '../../src/config/appSettings';
import {
  buildBookableDays,
  type BookableDay,
  type PublicAvailabilityRow,
} from '../../src/utils/publicBooking';
import { formatTime12Hour } from '../../src/utils/timeFormat';

declare const __SUPABASE_URL__: string;
declare const __SUPABASE_KEY__: string;

interface CoachProfile {
  id: string;
  name: string;
  sports: string[] | null;
  booking_link: string;
}

const app = document.getElementById('app') as HTMLElement;

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${__SUPABASE_URL__}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: __SUPABASE_KEY__ },
    body: JSON.stringify(args),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error((body && body.message) || 'Request failed');
  return body as T;
}

// /book/<link>, or ?c=<link> for local testing.
function readBookingLink(): string {
  const fromQuery = new URLSearchParams(location.search).get('c');
  if (fromQuery) return fromQuery;
  const parts = location.pathname.split('/').filter(Boolean);
  const index = parts.indexOf('book');
  return decodeURIComponent(index >= 0 ? (parts[index + 1] ?? '') : '');
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> & { class?: string } = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  const { class: className, ...rest } = props as Record<string, unknown>;
  if (className) node.className = className as string;
  Object.assign(node, rest);
  node.append(...children);
  return node;
}

function show(...nodes: Node[]) {
  app.replaceChildren(...nodes);
}

function showMessage(title: string, detail: string) {
  show(el('h1', {}, title), el('p', { class: 'muted' }, detail));
}

// "today", "tomorrow", or "on Wed 4 Nov".
const whenPhrase = (label: string) => (label === 'Today' || label === 'Tomorrow' ? label.toLowerCase() : `on ${label}`);

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^[\d\s\-+()]{7,}$/;

function renderBooking(coach: CoachProfile, days: BookableDay[]) {
  let selectedDate = days[0].date;
  let selectedTime = '';
  let sending = false;

  const dayRow = el('div', { class: 'chips' });
  const timeGrid = el('div', { class: 'grid' });
  const form = el('div', {});
  form.hidden = true;

  const name = el('input', { type: 'text', placeholder: 'Your name', autocomplete: 'name', maxLength: PUBLIC_BOOKING.maxNameLength });
  const contact = el('input', {
    type: 'text',
    placeholder: 'Phone or email',
    autocomplete: 'email',
    inputMode: 'email',
    maxLength: PUBLIC_BOOKING.maxContactLength,
  });
  const note = el('textarea', { placeholder: 'Anything your coach should know? (optional)', maxLength: PUBLIC_BOOKING.maxNoteLength });
  const error = el('p', { class: 'error' });
  error.hidden = true;
  const submit = el('button', { class: 'primary', type: 'button' }, 'Request lesson');

  function renderDays() {
    dayRow.replaceChildren(
      ...days.map((day) => {
        const chip = el('button', { class: 'chip', type: 'button' }, day.label);
        chip.setAttribute('aria-pressed', String(day.date === selectedDate));
        chip.onclick = () => {
          selectedDate = day.date;
          selectedTime = '';
          form.hidden = true;
          renderDays();
          renderTimes();
        };
        return chip;
      })
    );
  }

  function renderTimes() {
    const day = days.find((d) => d.date === selectedDate) as BookableDay;
    timeGrid.replaceChildren(
      ...day.times.map((time) => {
        const chip = el('button', { class: 'chip', type: 'button' }, formatTime12Hour(time));
        chip.setAttribute('aria-pressed', String(time === selectedTime));
        chip.onclick = () => {
          selectedTime = time;
          form.hidden = false;
          renderTimes();
          name.focus({ preventScroll: true });
          form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        };
        return chip;
      })
    );
  }

  function fail(message: string) {
    error.textContent = message;
    error.hidden = false;
  }

  submit.onclick = async () => {
    if (sending) return;
    error.hidden = true;
    const studentName = name.value.trim();
    const studentContact = contact.value.trim();
    if (studentName.length < 2) return fail('Please enter your name.');
    if (!EMAIL.test(studentContact) && !PHONE.test(studentContact)) {
      return fail('Please enter a valid phone number or email so your coach can reply.');
    }

    sending = true;
    submit.disabled = true;
    submit.textContent = 'Sending…';
    try {
      await rpc('submit_public_booking_request', {
        p_request: {
          id: crypto.randomUUID(),
          coach_id: coach.id,
          student_name: studentName,
          student_contact: studentContact,
          requested_date: selectedDate,
          requested_time: selectedTime,
          duration: PUBLIC_BOOKING.lessonMinutes,
          note: note.value.trim(),
        },
      });
      const day = days.find((d) => d.date === selectedDate) as BookableDay;
      show(
        el(
          'div',
          { class: 'done' },
          el('div', { class: 'tick' }, '✓'),
          el('h1', {}, 'Request sent'),
          el(
            'p',
            { class: 'muted' },
            `${coach.name} will confirm your lesson ${whenPhrase(day.label)} at ${formatTime12Hour(selectedTime)} by message.`
          )
        )
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : '';
      fail(
        message.startsWith('Too many')
          ? message
          : 'Sorry, that did not go through. Please check your connection and try again.'
      );
      sending = false;
      submit.disabled = false;
      submit.textContent = 'Request lesson';
    }
  };

  form.append(el('h2', {}, 'Your details'), name, contact, note, error, submit);

  const sports = (coach.sports ?? []).join(' · ');
  show(
    el('h1', {}, `Book with ${coach.name}`),
    el('p', { class: 'muted' }, sports || 'Pick a time and send a request.'),
    el('h2', {}, 'Day'),
    dayRow,
    el('h2', {}, `Time (${PUBLIC_BOOKING.lessonMinutes} min)`),
    timeGrid,
    form
  );
  renderDays();
  renderTimes();
}

async function start() {
  const link = readBookingLink();
  if (!link) return showMessage('Booking link not found', 'Please check the link you were sent.');

  try {
    const profiles = await rpc<CoachProfile[]>('get_public_booking_profile', { p_booking_link: link });
    const coach = profiles[0];
    if (!coach) return showMessage('Booking link not found', 'This link is not active. Please ask your coach for a new one.');
    document.title = `Book with ${coach.name}`;

    const rows = await rpc<PublicAvailabilityRow[]>('get_public_booking_availability', { p_coach_id: coach.id });
    const days = buildBookableDays({ rows });
    if (days.length === 0) {
      return showMessage(coach.name, 'No open times in the next two weeks. Please message your coach directly.');
    }
    renderBooking(coach, days);
  } catch {
    showMessage('Could not load', 'Please check your connection and reload the page.');
  }
}

void start();
