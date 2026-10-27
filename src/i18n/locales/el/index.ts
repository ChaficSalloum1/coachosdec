import type { Translation } from '../en';

import { addLesson } from './addLesson';
import { auth } from './auth';
import { availability } from './availability';
import { booking } from './booking';
import { calendar } from './calendar';
import { common } from './common';
import { currencies } from './currencies';
import { dates } from './dates';
import { errors } from './errors';
import { groupLesson } from './groupLesson';
import { locations } from './locations';
import { messages } from './messages';
import { notes } from './notes';
import { onboarding } from './onboarding';
import { payments } from './payments';
import { paywall } from './paywall';
import { requests } from './requests';
import { settings } from './settings';
import { shell } from './shell';
import { sports } from './sports';
import { students } from './students';
import { sync } from './sync';
import { tabs } from './tabs';
import { today } from './today';
import { webBooking } from './webBooking';

// Typed against English: a missing or extra key is a compile error.
export const el: Translation = { addLesson, auth, availability, booking, calendar, common, currencies, dates, errors, groupLesson, locations, messages, notes, onboarding, payments, paywall, requests, settings, shell, sports, students, sync, tabs, today, webBooking };
