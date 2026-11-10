/** Returns a value the test expects to exist (`ref.current`, `mock.lastCall`, `map.get(key)`) and fails the test when it is `null` or `undefined`. */
export default function defined<T>(value: T, what = 'value'): NonNullable<T> {
    if (value == null) throw new Error(`Expected ${what} to be defined, got ${String(value)}`);
    return value;
}
