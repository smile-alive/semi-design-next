export function round(number: number, digits = 0, base = Math.pow(10, digits)) {
    return Math.round(base * number) / base;
}
