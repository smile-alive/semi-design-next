import { createContext as createSvelteContext } from 'svelte';

interface ContextOptions<T> {
    // Most Semi children also work outside their group (Radio without RadioGroup); those read undefined instead of throwing
    optional?: boolean;
    // A context with a real value outside any provider (ConfigProvider's `{}`)
    defaultValue?: T;
}

type Context<T, Read = T, Write = T> = readonly [getContext: (caller?: string) => Read, setContext: (value: Write) => Write];

/**
 * Svelte's createContext with Semi's missing-provider semantics: required unless optional or given a default.
 * An optional context accepts `undefined` too, which hides the enclosing provider from the subtree.
 */
export function createContext<T>(name: string, options: { optional: true }): Context<T, T | undefined, T | undefined>;
export function createContext<T>(name: string, options: { defaultValue: T }): Context<T>;
export function createContext<T>(name: string, options?: { optional?: false }): Context<T>;
export function createContext<T>(name: string, { optional = false, defaultValue }: ContextOptions<T> = {}): Context<T, T | undefined, T | undefined> {
    const [get, set, has] = createSvelteContext<T>();

    // `caller` names the child in the error, e.g. getCollapseContext('Collapse.Panel')
    const getContext = (caller = 'This component') => {
        if (has()) {
            return get();
        }
        if (defaultValue === undefined && !optional) {
            throw new Error(`${caller} must be used inside ${name}`);
        }
        return defaultValue;
    };

    return [getContext, set as (value?: T) => T] as const;
}
