export function assert(condition, message, status = 400) {
  if (!condition) {
    const err = new Error(message);
    err.status = status;
    throw err;
  }
}

export function isPhone(str) {
  return /^\+?[0-9]{7,15}$/.test(str);
}

export function isUsername(str) {
  return /^[a-zA-Z0-9_.-]{3,50}$/.test(str);
}

export function clampImages(arr, max = 5) {
  return Array.isArray(arr) ? arr.slice(0, max) : [];
}