import { For, type JSX, type Ref, Show, createEffect, createMemo, createUniqueId, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses, strings } from '@fibrae/semi-foundation/cropper/constants';
import CropperFoundation, { type CropperAdapter, type CropperFoundationProps, type CropperState } from '@fibrae/semi-foundation/cropper/foundation';
import { getCropperGeometry } from '@fibrae/semi-foundation/cropper/utils';
import '@fibrae/semi-foundation/cropper/cropper.scss';
import callHandler from '../_base/call-handler';
import type { ElementProps } from '../_base/element-props';
import mergeRefs from '../_base/merge-refs';
import { namedRole } from '../_base/named-role';
import useDefaultProps from '../_base/use-default-props';
import useEventListener from '../_base/use-event-listener';
import useFoundation from '../_base/use-foundation';
import useResizeObserver from '../_base/use-resize-observer';
import useWatch from '../_base/use-watch';
import useLocale from '../locale/use-locale';

// namedRole yields a plain string, which the typed role attribute does not accept
type Role = JSX.HTMLAttributes<HTMLDivElement>['role'];
type Foundation = CropperFoundation;
type Adapter = CropperAdapter<CropperFoundationProps>;

export interface CropperHandle {
    /** Draws the area inside the cropper box, at the image's own resolution, onto a new canvas */
    getCropperCanvas: () => HTMLCanvasElement;
}

export type CropperElement = HTMLDivElement & CropperHandle;

export interface CropperImgProps extends Omit<JSX.ImgHTMLAttributes<HTMLImageElement>, 'style'> {
    /** Merged under the layout the cropper writes, so only an object */
    style?: JSX.CSSProperties;
}

export interface CropperProps extends ElementProps<'div', 'ref'> {
    src?: string;
    /** Passed to the image; `src`, the layout style and the order of `onLoad` are owned by the cropper */
    imgProps?: CropperImgProps;
    shape?: 'rect' | 'round' | 'roundRect';
    aspectRatio?: number;
    defaultAspectRatio?: number;
    /** Applied on top of the initial scaling that fits the loaded image into the cropper */
    zoom?: number;
    onZoomChange?: (zoom: number) => void;
    rotate?: number;
    showResizeBox?: boolean;
    /** Merged under the size and position the cropper writes, so only an object */
    cropperBoxStyle?: JSX.CSSProperties;
    cropperBoxCls?: string;
    fill?: string;
    maxZoom?: number;
    minZoom?: number;
    zoomStep?: number;
    preview?: () => HTMLElement | null;
    /** The root element with the CropperHandle method */
    ref?: Ref<CropperElement>;
}

const defaultProps = {
    shape: 'rect',
    defaultAspectRatio: 1,
    showResizeBox: true,
    fill: 'rgba(0, 0, 0, 0)',
    maxZoom: 3,
    minZoom: 0.1,
    zoomStep: 0.1,
} satisfies Partial<CropperProps>;

export default function Cropper(rawProps: CropperProps) {
    const props = useDefaultProps('Cropper', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['ref', 'class', 'src', 'imgProps', 'shape', 'aspectRatio', 'defaultAspectRatio', 'zoom', 'onZoomChange', 'rotate', 'showResizeBox', 'cropperBoxStyle', 'cropperBoxCls', 'fill', 'maxZoom', 'minZoom', 'zoomStep', 'preview']);

    const locale = useLocale('Cropper');

    const helpId = createUniqueId();
    let root!: HTMLDivElement;
    let img!: HTMLImageElement;

    const { foundation, state } = useFoundation<Foundation, Adapter, CropperFoundationProps, CropperState>(
        CropperFoundation,
        props,
        () => ({
            imgData: { width: 0, height: 0, centerPoint: { x: 0, y: 0 } },
            cropperBox: { width: 0, height: 0, centerPoint: { x: 0, y: 0 } },
            zoom: 1,
            rotate: 0,
            loaded: false,
        }),
        (base) => ({
            getContainer: () => root,
            notifyZoomChange: (zoom) => base.getProps().onZoomChange?.(zoom),
            getImg: () => img,
        })
    );

    const geometry = createMemo(() => getCropperGeometry(state().imgData, state().cropperBox));
    const handle: CropperHandle = { getCropperCanvas: foundation.getCropperCanvas };

    const imgLayout = (x: number, y: number): JSX.CSSProperties => ({
        width: `${state().imgData.width}px`,
        height: `${state().imgData.height}px`,
        'transform-origin': 'center',
        transform: `translate(${x}px, ${y}px) rotate(${state().rotate}deg)`,
    });

    useResizeObserver(() => root, foundation.handleResize);

    // preventDefault must stop a pinch from zooming the page, which only a non-passive listener can do
    useEventListener(() => root, 'wheel', foundation.handleWheel, { passive: false });

    // Wheel zooming and the image load change the state too, so a controlled zoom undoes a zoom the parent did not
    // accept; the foundation compares with Object.is, so the writes settle
    createEffect(() => {
        void [state().loaded, state().zoom, state().rotate, local.zoom, local.rotate];
        foundation.syncRotateAndZoom();
    });

    useWatch(() => local.aspectRatio, foundation.applyAspectRatio);

    // a controlled value dropped again falls back to the default, like the other components
    useWatch(
        () => local.zoom,
        (zoom) => {
            if (zoom === undefined) {
                foundation.syncRotateAndZoom({ zoom: 1 });
            }
        }
    );

    useWatch(
        () => local.rotate,
        (rotate) => {
            if (rotate === undefined) {
                foundation.syncRotateAndZoom({ rotate: 0 });
            }
        }
    );

    createEffect(() => {
        // updatePreview reads getStates(), which Solid does not track: subscribe to the keys it uses.
        void [state().cropperBox, state().imgData, state().rotate];
        foundation.updatePreview();
    });

    return (
        <div {...rest} ref={(node) => mergeRefs(local.ref)((root = Object.assign(node, handle)))} class={clsx(cssClasses.PREFIX, local.class)} role={namedRole(rest.role, rest['aria-label'], rest['aria-labelledby']) as Role}>
            <div class={cssClasses.IMG_WRAPPER}>
                {/* the cropping surface, not content: there is no description to give */}
                <img
                    alt=""
                    crossorigin="anonymous"
                    {...local.imgProps}
                    ref={(node) => (img = node)}
                    class={clsx(cssClasses.IMG, local.imgProps?.class)}
                    style={{ ...local.imgProps?.style, ...imgLayout(geometry().imgX, geometry().imgY) }}
                    src={local.src}
                    onLoad={(event) => {
                        foundation.handleImageLoad(event);
                        callHandler(local.imgProps?.onLoad, event);
                    }}
                />
            </div>
            <div class={cssClasses.MASK} onLostPointerCapture={foundation.handleMaskLostPointerCapture} onPointerDown={foundation.handleMaskPointerDown} onPointerMove={foundation.handleMaskPointerMove} />
            <div
                class={clsx(cssClasses.CROPPER_BOX, local.cropperBoxCls, {
                    [cssClasses.CROPPER_VIEW_BOX_ROUND]: local.shape === 'round',
                })}
                style={{
                    ...local.cropperBoxStyle,
                    width: `${state().cropperBox.width}px`,
                    height: `${state().cropperBox.height}px`,
                    transform: `translate(${geometry().boxX}px, ${geometry().boxY}px)`,
                }}
                aria-describedby={helpId}
                aria-label={locale().locale.cropArea}
                aria-roledescription={locale().locale.cropAreaRole}
                // not a widget role: the box has no single value
                role="group"
                tabIndex={state().loaded ? 0 : undefined}
                onKeyDown={foundation.handleCropperBoxKeyDown}
                onLostPointerCapture={foundation.handleCropperBoxLostPointerCapture}
                onPointerDown={foundation.handleCropperBoxPointerDown}
                onPointerMove={foundation.handleCropperBoxPointerMove}
            >
                <span id={helpId} hidden>
                    {locale().locale.cropAreaHelp}
                </span>
                <div
                    class={clsx(cssClasses.CROPPER_VIEW_BOX, {
                        [cssClasses.CROPPER_VIEW_BOX_ROUND]: local.shape.includes('round'),
                    })}
                >
                    <img
                        class={cssClasses.CROPPER_IMG}
                        style={imgLayout(geometry().viewX, geometry().viewY)}
                        alt=""
                        // a native image drag would cancel the pointer that moves the box
                        draggable={false}
                        src={local.src}
                    />
                </div>
                <Show when={state().loaded && local.showResizeBox}>
                    <For each={local.shape === 'round' ? strings.roundCorner : strings.corner}>
                        {(corner) => <div class={clsx(cssClasses.CORNER, `${cssClasses.CORNER}-${corner}`)} data-dir={corner} onLostPointerCapture={foundation.handleCornerLostPointerCapture} onPointerDown={foundation.handleCornerPointerDown} onPointerMove={foundation.handleCornerPointerMove} />}
                    </For>
                </Show>
            </div>
        </div>
    );
}
