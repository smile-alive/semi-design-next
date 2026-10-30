import { type InjectionKey, inject, provide } from 'vue';

interface ContextOptions {
    // Most Semi children also work outside their group (Radio without RadioGroup); those read undefined instead of throwing
    optional?: boolean;
}

type Context<T, Read = T> = readonly [useProvider: (value: T) => void, useContext: (caller?: string) => Read];

export function createContext<T>(name: string, options: ContextOptions & { optional: true }): Context<T, T | undefined>;
export function createContext<T>(name: string, options?: ContextOptions & { optional?: false }): Context<T>;
export function createContext<T>(name: string, { optional = false }: ContextOptions = {}): Context<T, T | undefined> {
    const key: InjectionKey<T> = Symbol(name);

    const useProvider = (value: T) => {
        provide(key, value);
    };

    // `caller` names the child in the error, e.g. useCollapseContext('Collapse.Panel')
    const useContext = (caller = 'This component') => {
        const ctx = inject(key, undefined);
        if (ctx === undefined && !optional) {
            throw new Error(`${caller} must be used inside ${name}`);
        }
        return ctx;
    };

    return [useProvider, useContext] as const;
}
