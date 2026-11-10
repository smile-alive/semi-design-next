import type React from 'react';
import { useEffect, useRef } from 'react';
import useIsServerRender from '../hooks/use-is-server-render';
import useMergedRef from '../hooks/use-merged-ref';

/**
 * An `<img>` that reports an outcome it missed. React only starts listening for load and error when it hydrates, so
 * an image from the server HTML that settled earlier never reports; the outcome is replayed on the element so the
 * handlers run. A client-rendered img gets its src in the commit and fires as usual, so only the hydrating commit checks.
 * shortcut: an image whose load task is still queued when `complete` turns true reports twice, once here and once
 * from the queued event; drop this component once React replays load and error for hydrated images itself.
 */
export default function HydratedImage({ ref, alt, ...rest }: React.ComponentProps<'img'>) {
    const imgRef = useRef<HTMLImageElement>(null);

    // StrictMode runs the effect twice on mount; the image settled once
    const replayed = useRef(false);

    const isServerRender = useIsServerRender();

    const mergedRef = useMergedRef(ref, imgRef);

    // A passive effect, not a layout one: the parent's foundation connects and inits in its own layout effect, which
    // runs after this child's layout effects but before any passive effect of the commit.
    useEffect(() => {
        const img = imgRef.current;
        if (isServerRender && !replayed.current && img?.src && img.complete) {
            replayed.current = true;
            img.dispatchEvent(new Event(img.naturalWidth > 0 ? 'load' : 'error'));
        }
    }, [isServerRender]);

    return <img ref={mergedRef} alt={alt} {...rest} />;
}
