import { announce } from '@fibrae/semi-foundation/utils/announcer';

/**
 * Returns `announce(message, politeness?)`, which has screen readers read `message` through a hidden live region the
 * whole page shares. Messages still go out after the caller unmounts, e.g. "row deleted".
 */
export default function useAnnouncer() {
    return announce;
}
