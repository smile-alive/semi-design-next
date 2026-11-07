import { onActivated, onDeactivated } from 'vue';
import type { Lifecycle } from '@fibrae/semi-foundation/base/foundation';

/**
 * Opts a component into the contract's "hiding is destroy, showing again is init" under KeepAlive: deactivation runs
 * destroy() + disconnect(), a return from the cache runs connect() + init(). Watchers that set up listeners check
 * `isDeactivated()` to stay idle while cached.
 */
export default function useKeepAliveFoundation(foundation: Omit<Lifecycle, 'handlePropsChange'>) {
    // onActivated also runs after the first mount; only a return from the cache sets up again.
    let deactivated = false;

    onDeactivated(() => {
        deactivated = true;
        foundation.destroy();
        foundation.disconnect();
    });

    onActivated(() => {
        if (!deactivated) return;
        deactivated = false;
        foundation.connect();
        foundation.init();
    });

    return { isDeactivated: () => deactivated };
}
