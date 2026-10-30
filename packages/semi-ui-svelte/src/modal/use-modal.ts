import { getAllContexts, onDestroy } from 'svelte';
import { openConfirm, withType } from './confirm.svelte.js';
import type { ConfirmProps, ModalConfirmProps, ModalHookApi } from './interface.js';

/**
 * Opens confirm dialogs that read the calling component's contexts (ConfigProvider, LocaleProvider), which
 * `Modal.confirm` cannot reach because it mounts its own root. Call it during component initialization. Dialogs still
 * open when the component is destroyed are removed with it.
 */
export default function useModal(): ModalHookApi {
    const context = getAllContexts();
    const open = new Set<() => void>();

    onDestroy(() => {
        for (const dispose of open) {
            dispose();
        }
    });

    const create = (config: ConfirmProps) => {
        const { ref, dispose } = openConfirm(config, { context, onClosed: () => open.delete(dispose) });
        open.add(dispose);
        return ref;
    };

    const typed = (type: ConfirmProps['type']) => (config: ModalConfirmProps) => create(withType(type, config));

    return {
        info: typed('info'),
        success: typed('success'),
        error: typed('error'),
        warning: typed('warning'),
        confirm: typed('confirm'),
    };
}
