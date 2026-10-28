import { type Context as SolidContext, createContext as createSolidContext, useContext } from 'solid-js';

type Context<T, Read = T> = readonly [Context: SolidContext<T | undefined>, useContext: (caller?: string) => Read];

/**
 * - required (no options): reading outside a provider throws, e.g. Table parts outside Table
 * - `{ optional: true }`: reads undefined outside a provider, for children that also work alone (Radio without RadioGroup)
 * - `{ defaultValue }`: reads the default outside a provider (ConfigProvider, Typography size)
 *
 * Solid falls back to the default when a provider passes `undefined`, so a provider cannot reset a defaulted context
 * to `undefined`.
 */
export function createContext<T>(name: string, options: { optional: true }): Context<T, T | undefined>;
export function createContext<T>(name: string, options: { defaultValue: T }): Context<T>;
export function createContext<T>(name: string): Context<T>;
export function createContext<T>(name: string, options: { optional?: true; defaultValue?: T } = {}): Context<T, T | undefined> {
    const Context = createSolidContext<T | undefined>(options.defaultValue);
    const required = !options.optional && !('defaultValue' in options);

    function useValue(caller = 'This component') {
        const value = useContext(Context);
        if (value === undefined && required) {
            throw new Error(`${caller} must be used inside ${name}`);
        }
        return value;
    }

    return [Context, useValue] as const;
}
