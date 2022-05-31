// size should be number of bytes, so the actual returned string is
// twice as long (as it returns it in hex)
const BUFFER = Array(64);
export function generateId(size: number): string {
  if(size>32) {
    throw RangeError('size must be <= 32');
  }
  for (let i = 0; i < size * 2; i++) {
    BUFFER[i] = Math.floor(Math.random() * 16) + 48;
    // valid hex characters in the range 48-57 and 97-102
    if (BUFFER[i] >= 58) {
      BUFFER[i] += 39;
    }
  }
  return String.fromCharCode(
    ...BUFFER.slice(0, size * 2)
  );
}
