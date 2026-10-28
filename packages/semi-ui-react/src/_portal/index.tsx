import type React from 'react';
import { memo, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { resolvePopupContainer } from '@fibrae/semi-foundation/utils/dom';
import '@fibrae/semi-foundation/_portal/portal.scss';
import { PopupLayerContext } from '../_base/popup-layer';
import useDidUpdate from '../_base/use-did-update';
import useIsServerRender from '../_base/use-is-server-render';
import { useConfigContext } from '../config-provider/context';

export interface PortalProps {
    children: React.ReactNode;
    style?: React.CSSProperties;
    prefixCls?: string;
    className?: string;
    getPopupContainer?: () => HTMLElement;
    didUpdate?: (props: PortalProps) => void;
}

interface AttachProps {
    el: HTMLElement;
    getContainer: () => HTMLElement;
    className: string;
    style?: React.CSSProperties;
    dir?: 'ltr' | 'rtl';
}

const defaultPrefixCls = `${BASE_CLASS_PREFIX}-portal`;

/**
 * Puts `el` into the popup container. It renders before the portal, so the container is in the document when the
 * children's layout effects and componentDidMount run (Modal focuses its dialog there), and earlier refs are
 * readable by getPopupContainer. Class, style and dir are re-synced every commit; the parent moves only if it changes.
 */
function Attach({ el, getContainer, className, style, dir }: AttachProps): React.ReactNode {
    useLayoutEffect(() => {
        el.setAttribute('class', className);
        el.removeAttribute('style');
        Object.assign(el.style, style);
        if (dir) {
            el.setAttribute('dir', dir);
        } else {
            el.removeAttribute('dir');
        }
        const container = getContainer();
        if (el.parentNode !== container) {
            container.appendChild(el);
        }
    });

    useLayoutEffect(
        () => () => {
            el.parentNode?.removeChild(el);
        },
        [el]
    );

    return null;
}

// The container needs document, so nothing renders on the server or while hydrating; the popup mounts in the commit
// after hydration. A client-only render still creates the container in its first render, keeping the order above.
function Portal(props: PortalProps): React.ReactNode {
    return useIsServerRender() ? null : <ClientPortal {...props} />;
}

function ClientPortal(props: PortalProps): React.ReactNode {
    const { children, style, prefixCls = defaultPrefixCls, className, getPopupContainer, didUpdate } = props;

    const context = useConfigContext();

    // Created lazily with no render side effects, so StrictMode's discarded render leaves nothing in the document
    const [el] = useState(() => document.createElement('div'));
    const [layer] = useState(() => Symbol('semi-popup-layer'));

    // Outside the fullscreen element nothing is shown or clickable, so a popup mounted during fullscreen goes into it.
    // Known limits: chosen once at mount, so a popup mounted before fullscreen stays in the body and one mounted
    // during it stays in the former fullscreen element afterwards, inheriting that ancestor chain's styles; moving it
    // later would drop the focus inside. Upgrade: re-target on show once keepDOM overlays are used across fullscreen.
    const [defaultContainer] = useState(() => (document.fullscreenElement as HTMLElement | null) ?? document.body);

    useDidUpdate(props, (_, prevProps) => didUpdate?.(prevProps));

    return (
        <>
            <Attach className={clsx(prefixCls, className)} style={style} dir={context.direction} el={el} getContainer={() => resolvePopupContainer(getPopupContainer ?? context.getPopupContainer, defaultContainer)} />
            <PopupLayerContext value={layer}>{createPortal(children, el)}</PopupLayerContext>
        </>
    );
}

export default memo(Portal);
