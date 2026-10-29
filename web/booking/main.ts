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
import { formatClockTime } from '../../src/utils/timeFormat';
import { formatMoney, resolveCurrency } from '../../src/modules/payments/currency';
import { setLanguage, t } from '../../src/i18n';
import { sportsLabel } from '../../src/constants/sports';

declare const __SUPABASE_URL__: string;
declare const __SUPABASE_KEY__: string;

interface CoachProfile {
  id: string;
  name: string;
  sports: string[] | null;
  price_per_hour: number | string | null;
  currency: string | null;
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
const whenPhrase = (label: string) =>
  label === t('common.today')
    ? t('messages.dayToday')
    : label === t('common.tomorrow')
      ? t('messages.dayTomorrow')
      : t('messages.dayOn', { date: label });

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

  const name = el('input', { type: 'text', placeholder: t('webBooking.namePlaceholder'), autocomplete: 'name', maxLength: PUBLIC_BOOKING.maxNameLength });
  const contact = el('input', {
    type: 'text',
    placeholder: t('webBooking.contactPlaceholder'),
    autocomplete: 'email',
    inputMode: 'email',
    maxLength: PUBLIC_BOOKING.maxContactLength,
  });
  const note = el('textarea', { placeholder: t('webBooking.notePlaceholder'), maxLength: PUBLIC_BOOKING.maxNoteLength });
  const place = el('p', { class: 'muted' });
  place.hidden = true;
  const error = el('p', { class: 'error' });
  error.hidden = true;
  const submit = el('button', { class: 'primary', type: 'button' }, t('webBooking.requestLesson'));

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
        const chip = el('button', { class: 'chip', type: 'button' }, formatClockTime(time));
        chip.setAttribute('aria-pressed', String(time === selectedTime));
        chip.onclick = () => {
          selectedTime = time;
          const where = day.places[time]?.name;
          place.textContent = where ? t('webBooking.where', { place: where }) : '';
          place.hidden = !where;
          form.hidden = false;
          renderTimes();
          name.focus({ preventScroll: true });
          form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        };
        return chip;
      })
    );
  }

  const pickedPlace = () => (days.find((d) => d.date === selectedDate) as BookableDay).places[selectedTime];

  function fail(message: string) {
    error.textContent = message;
    error.hidden = false;
  }

  submit.onclick = async () => {
    if (sending) return;
    error.hidden = true;
    const studentName = name.value.trim();
    const studentContact = contact.value.trim();
    if (studentName.length < 2) return fail(t('webBooking.enterName'));
    if (!EMAIL.test(studentContact) && !PHONE.test(studentContact)) {
      return fail(t('webBooking.enterContact'));
    }

    sending = true;
    submit.disabled = true;
    submit.textContent = t('webBooking.sending');
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
          area_id: pickedPlace().areaId,
          facility_id: pickedPlace().facilityId,
          court_id: pickedPlace().courtId,
          note: note.value.trim(),
        },
      });
      const day = days.find((d) => d.date === selectedDate) as BookableDay;
      show(
        el(
          'div',
          { class: 'done' },
          el('div', { class: 'tick' }, '✓'),
          el('h1', {}, t('webBooking.requestSent')),
          el(
            'p',
            { class: 'muted' },
            t('webBooking.willConfirm', { coach: coach.name, when: whenPhrase(day.label), time: formatClockTime(selectedTime) })
          ),
          ...(pickedPlace().name ? [el('p', { class: 'muted' }, t('webBooking.where', { place: pickedPlace().name as string }))] : []),
          el('p', { class: 'muted' }, t('webBooking.nextSteps', { coach: coach.name }))
        )
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : '';
      // The server's rate-limit message is English; show it in the page language.
      fail(message.startsWith('Too many') ? t('webBooking.tooMany') : t('webBooking.failed'));
      sending = false;
      submit.disabled = false;
      submit.textContent = t('webBooking.requestLesson');
    }
  };

  form.append(el('h2', {}, t('webBooking.yourDetails')), place, name, contact, note, error, submit);

  const sports = sportsLabel(coach.sports ?? [], ' · ');
  const hourly = Number(coach.price_per_hour);
  const priceLine =
    hourly > 0
      ? t('webBooking.priceAndLength', {
          price: formatMoney((hourly * PUBLIC_BOOKING.lessonMinutes) / 60, resolveCurrency(coach.currency)),
          minutes: PUBLIC_BOOKING.lessonMinutes,
        })
      : '';
  show(
    el('h1', {}, t('webBooking.bookWith', { name: coach.name })),
    el('p', { class: 'muted' }, sports || t('webBooking.pickTime')),
    ...(priceLine ? [el('p', { class: 'muted' }, priceLine)] : []),
    el('h2', {}, t('webBooking.day')),
    dayRow,
    el('h2', {}, t('webBooking.time', { minutes: PUBLIC_BOOKING.lessonMinutes })),
    timeGrid,
    form
  );
  renderDays();
  renderTimes();
}

// The page follows the visitor's browser language (?lang=el forces Greek, ?lang=en English).
async function pickLanguage() {
  const forced = new URLSearchParams(location.search).get('lang');
  const language = (forced ?? navigator.language).toLowerCase().startsWith('el') ? 'el' : 'en';
  await setLanguage(language);
  document.documentElement.lang = language;
  document.title = t('webBooking.pageTitle');
}

async function start() {
  await pickLanguage();
  const link = readBookingLink();
  if (!link) return showMessage(t('webBooking.linkNotFound'), t('webBooking.checkLink'));

  try {
    const profiles = await rpc<CoachProfile[]>('get_public_booking_profile', { p_booking_link: link });
    const coach = profiles[0];
    if (!coach) return showMessage(t('webBooking.linkNotFound'), t('webBooking.linkInactive'));
    document.title = t('webBooking.bookWith', { name: coach.name });

    const rows = await rpc<PublicAvailabilityRow[]>('get_public_booking_availability', { p_coach_id: coach.id });
    const days = buildBookableDays({ rows });
    if (days.length === 0) {
      return showMessage(coach.name, t('webBooking.noOpenTimes'));
    }
    renderBooking(coach, days);
  } catch {
    showMessage(t('webBooking.couldNotLoad'), t('webBooking.checkConnection'));
  }
}

void start();
