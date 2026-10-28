import { onActivated, onDeactivated } from 'vue';

interface Lifecycle {
    connect: () => void;
    disconnect: () => void;
    init: () => void;
    destroy: () => void;
}

/**
 * KeepAlive keeps a cached component alive, so the listeners and timers its foundation holds are released on
 * deactivation and set up again on return. `reactivate` replaces the default connect() + init() when replaying init
 * would reset what the user already changed. Watchers that set up listeners check `isDeactivated()` to stay idle while
 * cached.
 */
export default function useKeepAliveFoundation(foundation: Lifecycle, { reactivate }: { reactivate?: () => void } = {}) {
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
        if (reactivate) {
            reactivate();
        } else {
            foundation.connect();
            foundation.init();
        }
    });

    return { isDeactivated: () => deactivated };
}
