export function round(number: number, digits = 0, base = 10 ** digits) {
    return Math.round(base * number) / base;
}
