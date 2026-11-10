import { onMount, splitProps, type JSX } from 'solid-js';
import mergeRefs from '../utils/merge-refs';

/**
 * An `<img>` that reports an outcome it missed. Solid attaches `onLoad` and `onError` only when it hydrates, so an
 * image from the server HTML that settled earlier never reports; the outcome is replayed on the element so those
 * handlers run. A client-rendered img gets its src after the listeners and fires as usual, so only an img claimed during
 * hydration is checked: the claimed server node is already in the document when the ref runs, a client-created one is not.
 * shortcut: an image whose load task is still queued when `complete` turns true reports twice, once here and once
 * from the queued event; drop this component once Solid replays load and error for hydrated images itself.
 */
export default function HydratedImage(props: JSX.ImgHTMLAttributes<HTMLImageElement>) {
    const [local, rest] = splitProps(props, ['ref', 'alt']);

    const replay = (img: HTMLImageElement) => {
        if (!img.isConnected) {
            return;
        }
        onMount(() => {
            if (img.src && img.complete) {
                img.dispatchEvent(new Event(img.naturalWidth > 0 ? 'load' : 'error'));
            }
        });
    };

    return <img {...rest} ref={mergeRefs(local.ref, replay)} alt={local.alt} />;
}
