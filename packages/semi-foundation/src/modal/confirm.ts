import { omitBy } from 'es-toolkit';
import isPromise from '../utils/is-promise';

export type ConfirmType = 'success' | 'info' | 'warning' | 'error' | 'confirm';

/**
 * Settles a confirm dialog on the result of its onOk or onCancel: a plain value closes it at once, a Promise shows
 * loading and closes on resolve. A rejected promise keeps the dialog open.
 */
export function settleConfirm(result: unknown, { setLoading, close }: { setLoading: (loading: boolean) => void; close: () => void }) {
    if (!isPromise(result)) {
        close();
        return;
    }
    setLoading(true);
    (result as Promise<unknown>).then(
        () => {
            close();
            setLoading(false);
        },
        () => setLoading(false)
    );
}

// an explicit undefined must not replace a default: the frameworks' icon, or the error dialog's button type
function defined<T extends object>(props: T) {
    return omitBy(props, (value) => value === undefined) as Partial<T>;
}

/** The props of `Modal.<type>()` without explicit undefined values; the error dialog's ok button is a danger one */
export function resolveConfirmProps<P extends { okButtonProps?: object }>(type: ConfirmType, props: P) {
    if (type !== 'error') {
        return defined(props);
    }
    const { okButtonProps, ...rest } = props;
    return { okButtonProps: { type: 'danger', ...defined(okButtonProps ?? {}) }, ...defined(rest) } as Partial<P>;
}
