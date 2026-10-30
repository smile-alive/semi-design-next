import type { BaseFormApi, FormState } from './interface';

export const EMPTY_FORM_STATE: FormState = {
    values: {},
    errors: {},
    touched: {},
};

export interface FormApiProxyInternals<T extends Record<string, any> = any> {
    bind: (api: BaseFormApi<T>) => void;
    unbind: () => void;
    updateState: (state: FormState<T>) => void;
}

// Kept off the proxy itself so the hooks stay free of internal members that users could enumerate or call.
const internalsOf = new WeakMap<object, FormApiProxyInternals>();

/** The binding hooks of a proxy made by createFormApiProxy; undefined for any other object. */
export function getFormApiProxyInternals<T extends Record<string, any> = any>(proxy?: object) {
    return proxy && (internalsOf.get(proxy) as FormApiProxyInternals<T> | undefined);
}

/**
 * A FormApi that exists before its Form mounts: the Form binds the real api through `bind` and pushes every
 * form state through `updateState`, which the framework hook stores in its own state.
 */
export function createFormApiProxy<T extends Record<string, any>>(setFormState: (state: FormState<T>) => void) {
    let realApi: BaseFormApi<T> | null = null;

    const proxy = new Proxy(
        {},
        {
            get(_target, prop) {
                // Symbol keys come from String(), util.inspect and DevTools, not from api calls
                if (typeof prop !== 'string') {
                    return undefined;
                }
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
            set() {
                return false;
            },
        }
    ) as BaseFormApi<T>;

    internalsOf.set(proxy, {
        bind: (api) => {
            realApi = api;
            setFormState(api.getFormState() as FormState<T>);
        },
        unbind: () => {
            realApi = null;
            setFormState(EMPTY_FORM_STATE as FormState<T>);
        },
        updateState: setFormState,
    } as FormApiProxyInternals);

    return proxy;
}
