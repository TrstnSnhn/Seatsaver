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

export const longDate = (iso) =>
  part(iso, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
