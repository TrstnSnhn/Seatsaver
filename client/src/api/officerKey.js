// Where the officer key lives in the browser.
//
// sessionStorage, not localStorage: the key is gone when the tab closes, which
// is the right lifetime for a shared password typed on a lab computer. It never
// goes into the build, because a VITE_ value would ship inside the JavaScript
// for anyone to read.

const KEY = 'seatsaver:officer-key'

export function readOfficerKey() {
  try {
    return sessionStorage.getItem(KEY) || ''
  } catch {
    return '' // storage blocked: the officer types the key again this visit
  }
}

export function writeOfficerKey(value) {
  try {
    if (value) sessionStorage.setItem(KEY, value)
    else sessionStorage.removeItem(KEY)
  } catch {
    // storage blocked: the key lasts as long as the page stays open
  }
}
