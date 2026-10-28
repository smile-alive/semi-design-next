import type { BaseFormApi, FormState } from './interface';

export const EMPTY_FORM_STATE: FormState = {
    values: {},
    errors: {},
    touched: {},
};

export interface FormApiProxyInternals<T extends Record<string, any> = any> {
    __realApi: BaseFormApi<T> | null;
    __bind: ((api: BaseFormApi<T>) => void) | null;
    __unbind: (() => void) | null;
    __updateState: ((state: FormState<T>) => void) | null;
}

/**
 * A FormApi that exists before its Form mounts: the Form binds the real api through `__bind` and pushes every
 * form state through `__updateState`, which the framework hook stores in its own state.
 */
export function createFormApiProxy<T extends Record<string, any>>(setFormState: (state: FormState<T>) => void) {
    const internals: FormApiProxyInternals<T> = {
        __realApi: null,
        __bind: (api) => {
            internals.__realApi = api;
            setFormState(api.getFormState() as FormState<T>);
        },
        __unbind: () => {
            internals.__realApi = null;
            setFormState(EMPTY_FORM_STATE as FormState<T>);
        },
        __updateState: setFormState,
    };

    return new Proxy(internals, {
        get(target, prop) {
            // Symbol keys come from String(), util.inspect and DevTools, not from api calls
            if (typeof prop !== 'string') {
                return Reflect.get(target, prop);
            }
            if (prop.startsWith('__')) {
                return target[prop as keyof FormApiProxyInternals<T>];
            }
            const realApi = target.__realApi;
            if (!realApi) {
                // a function `then` would make the api a thenable that `await` never settles
                if (prop === 'then') {
                    return undefined;
                }
                return () => {
                    console.warn(`[Semi Form] FormApi.${prop}() is called before Form component is mounted. ` + `Please ensure the Form component is rendered first.`);
                    return undefined;
                };
            }
            const value = Reflect.get(realApi, prop);
            if (typeof value === 'function') {
                return value.bind(realApi);
            }
            return value;
        },
        set(target, prop, value) {
            if (typeof prop === 'string' && prop.startsWith('__')) {
                Reflect.set(target, prop, value);
                return true;
            }
            return false;
        },
    }) as unknown as BaseFormApi<T> & FormApiProxyInternals<T>;
}
