import type { JSX } from 'solid-js';
import { render } from 'solid-js/web';

/**
 * Renders `code` once into `container` (by default a new div under document.body) outside any owner, so the tree reads
 * global defaults and the default locale, never the caller's context. The returned dispose removes the container and
 * releases the tree. Update the tree through signals read by `code`: each call mounts a separate root.
 */
export default function renderDetached(code: () => JSX.Element, container?: Element) {
    const target = container ?? document.body.appendChild(document.createElement('div'));
    // without `owner: null` the root would inherit the context of the component that happens to be running
    const dispose = render(code, target, undefined, { owner: null });
    return () => {
        target.remove();
        // Callers dispose from inside the root's own update (Modal.confirm's afterClose, a toast closing itself); let
        // that update finish first
        queueMicrotask(dispose);
    };
}
