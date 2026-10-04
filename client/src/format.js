// Every date on screen uses Manila time, whatever the visitor's own time zone.
const TIME_ZONE = 'Asia/Manila'

const part = (iso, options, locale = 'en-PH') =>
  new Intl.DateTimeFormat(locale, { timeZone: TIME_ZONE, ...options }).format(new Date(iso))

// YYYY-MM-DD on the Manila calendar, to compare with <input type="date"> values.
// The en-CA locale formats dates in exactly that order.
export const manilaDateKey = (iso) =>
  part(iso, { year: 'numeric', month: '2-digit', day: '2-digit' }, 'en-CA')

export function dateBlock(iso) {
  return {
    day: part(iso, { day: '2-digit' }),
    month: part(iso, { month: 'short' }).toUpperCase(),
    weekday: part(iso, { weekday: 'short' }),
  }
}

export const weekdayOf = (iso) => part(iso, { weekday: 'long' })

export const timeOf = (iso) => part(iso, { hour: 'numeric', minute: '2-digit' })

// Manila sits at UTC+8 all year and keeps no daylight saving, so the officer
// form converts both ways with one offset instead of a date library.
const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000

// An ISO timestamp as the text <input type="datetime-local"> expects, in Manila
// time: 2026-11-02T06:00:00.000Z becomes 2026-11-02T14:00.
export const manilaInputValue = (iso) =>
  new Date(new Date(iso).getTime() + MANILA_OFFSET_MS).toISOString().slice(0, 16)

// The same trip back: what the officer typed is Manila time, whatever time zone
// their laptop is set to.
export const isoFromManilaInput = (value) =>
  value ? new Date(new Date(`${value}:00.000Z`).getTime() - MANILA_OFFSET_MS).toISOString() : ''

export const longDate = (iso) =>
  part(iso, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
