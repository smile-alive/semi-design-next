import { type RefObject, useLayoutEffect, useRef } from 'react';
import useIsServerRender from './use-is-server-render';

// React only starts listening for an img's load and error when it hydrates, so an image from the server HTML that
// settled earlier never reports; replay the outcome on the element so the React handlers run. A client-rendered img
// gets its src in the commit and fires as usual, so only the hydrating commit checks. Call it after useFoundation:
// layout effects run in declaration order, and the replayed event must reach a connected, initialized foundation.
// shortcut: an image whose load task is still queued when `complete` turns true reports twice, once here and once
// from the queued event; drop this hook once React replays load and error for hydrated images itself.
export default function useReplayImageEvents(ref: RefObject<HTMLImageElement | null>) {
    const isServerRender = useIsServerRender();
    // StrictMode runs the layout effect twice on mount; the image settled once
    const replayed = useRef(false);

    useLayoutEffect(() => {
        const img = ref.current;
        if (isServerRender && !replayed.current && img?.src && img.complete) {
            replayed.current = true;
            img.dispatchEvent(new Event(img.naturalWidth > 0 ? 'load' : 'error'));
        }
    }, [isServerRender, ref]);
}
