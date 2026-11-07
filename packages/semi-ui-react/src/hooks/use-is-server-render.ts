import { useSyncExternalStore } from 'react';

const subscribeNever = () => () => {};
const getClientSnapshot = () => false;
const getServerSnapshot = () => true;

// True on the server and while hydrating, then false after hydration re-renders with the client snapshot; a pure
// client render is false from its first render, so client-only work there still happens in the first commit
export default function useIsServerRender() {
    return useSyncExternalStore(subscribeNever, getClientSnapshot, getServerSnapshot);
}
