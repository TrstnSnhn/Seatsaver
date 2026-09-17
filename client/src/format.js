// Every date on screen uses Manila time, whatever the visitor's own time zone.
const TIME_ZONE = 'Asia/Manila'

const part = (iso, options) =>
  new Intl.DateTimeFormat('en-PH', { timeZone: TIME_ZONE, ...options }).format(new Date(iso))

export function dateBlock(iso) {
  return {
    day: part(iso, { day: '2-digit' }),
    month: part(iso, { month: 'short' }).toUpperCase(),
    weekday: part(iso, { weekday: 'short' }),
  }
}

export const weekdayOf = (iso) => part(iso, { weekday: "long" })

export const timeOf = (iso) => part(iso, { hour: 'numeric', minute: '2-digit' })

export const longDate = (iso) =>
  part(iso, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
