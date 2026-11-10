export interface HookApi<O> {
    success: (config: O) => string;
    info: (config: O) => string;
    error: (config: O) => string;
    warning: (config: O) => string;
    open: (config: O) => string;
    close: (id: string) => void;
}

export interface HookApiOptions {
    /** Read on every call, so a context provider that changes the defaults takes effect */
    readGlobalDefaults: () => object;
    /** Runs before every call; a host that mounts its list lazily does it here */
    beforeAdd?: () => void;
}

// method syntax keeps the parameters bivariant, so a ListStore of any item type fits
interface HookApiStore {
    open(opts: object, globalDefaults: object): string;
    remove(id: string): void;
}

/** The api of `useToast` and `useNotification` over one list store; `O` is the framework's options */
export function createHookApi<O extends object>(store: HookApiStore, { readGlobalDefaults, beforeAdd }: HookApiOptions): HookApi<O> {
    const add = (config: O, type: string) => {
        beforeAdd?.();
        return store.open({ ...config, type }, readGlobalDefaults());
    };

    return {
        success: (config) => add(config, 'success'),
        info: (config) => add(config, 'info'),
        error: (config) => add(config, 'error'),
        warning: (config) => add(config, 'warning'),
        open: (config) => add(config, 'default'),
        close: (id) => store.remove(id),
    };
}
