import React, { use } from 'react';

type Context<T, Read = T> = readonly [Context: React.Context<T>, useContext: (caller?: string) => Read];

/**
 * - required (no options): reading outside a provider throws, e.g. Table parts outside Table
 * - `{ optional: true }`: reads undefined outside a provider, for children that also work alone (Radio without RadioGroup)
 * - `{ defaultValue }`: reads the default outside a provider (ConfigProvider, Typography size)
 */
export function createContext<T>(name: string, options: { optional: true }): Context<T | undefined>;
export function createContext<T>(name: string, options: { defaultValue: T }): Context<T>;
export function createContext<T>(name: string): Context<T>;
export function createContext<T>(name: string, options: { optional?: true; defaultValue?: T } = {}): Context<T | undefined> {
    const Context = React.createContext<T | undefined>(options.defaultValue);
    Context.displayName = name;
    const required = !options.optional && !('defaultValue' in options);

    // The Compiler's infer mode skips this hook (its only call is use()); it holds nothing to memoize, so that costs nothing
    const useValue = (caller = 'This component') => {
        const value = use(Context);
        if (value === undefined && required) {
            throw new Error(`${caller} must be used inside ${name}`);
        }
        return value;
    };

    return [Context, useValue] as const;
}
