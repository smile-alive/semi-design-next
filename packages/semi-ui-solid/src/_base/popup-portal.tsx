import { type JSX, createMemo, createRenderEffect, createSignal, onCleanup, onMount } from 'solid-js';
import { Portal } from 'solid-js/web';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { resolvePopupContainer } from '@fibrae/semi-foundation/utils/dom';
import '@fibrae/semi-foundation/_portal/portal.scss';
import useConfig from '../config-provider/use-config';
import { useTooltipPopups } from '../tooltip/context';
import { PopupLayerContext } from './popup-layer';

export interface PopupPortalProps {
    getPopupContainer?: () => HTMLElement;
    zIndex?: number;
    /** The container covers the whole page; otherwise the wrapper is positioned in the flow of the container */
    inBody: boolean;
    children: JSX.Element;
}

/**
 * The popup wrapper of overlays that render into `getPopupContainer`. Created only after the owner mounted: the
 * function may query a node that does not exist until the parent is inserted.
 */
export default function PopupPortal(props: PopupPortalProps) {
    const outerPopups = useTooltipPopups();
    const config = useConfig();

    const [element, setElement] = createSignal<HTMLDivElement>();

    const layer = Symbol('semi-popup-layer');

    // Outside the fullscreen element nothing is shown or clickable, so an overlay opened during fullscreen goes into it
    const defaultContainer = (document.fullscreenElement as HTMLElement | null) ?? document.body;

    // Memoized by element: Portal rebuilds its wrapper whenever `mount` notifies, which a consumer spreading a props
    // signal or any ConfigProvider change would do, moving the open overlay and dropping the focus inside it
    const mount = createMemo(() => resolvePopupContainer(props.getPopupContainer ?? config().getPopupContainer, defaultContainer));

    createRenderEffect(() => {
        const wrapper = element();
        if (!wrapper) {
            return;
        }
        wrapper.className = `${BASE_CLASS_PREFIX}-portal`;
        wrapper.style.zIndex = props.zIndex === undefined ? '' : String(props.zIndex);
        wrapper.style.position = props.inBody ? '' : 'static';
        const direction = config().direction;
        if (direction) {
            wrapper.setAttribute('dir', direction);
        } else {
            wrapper.removeAttribute('dir');
        }
    });

    // The wrapper sits outside the DOM of an enclosing Tooltip's popup, which must still count it as inside
    onMount(() => {
        if (outerPopups) {
            onCleanup(outerPopups.register(element));
        }
    });

    return (
        <Portal
            mount={mount()}
            ref={(wrapper) => {
                setElement(wrapper);
                onCleanup(() => setElement(undefined));
            }}
        >
            <PopupLayerContext.Provider value={layer}>{props.children}</PopupLayerContext.Provider>
        </Portal>
    );
}
