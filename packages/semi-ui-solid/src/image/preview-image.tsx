import { type JSX, For, Show, createEffect, on } from 'solid-js';
import { cssClasses } from '@fibrae/semi-foundation/image/constants';
import PreviewImageFoundation, { type PreviewImageAdapter, type PreviewImageBaseState } from '@fibrae/semi-foundation/image/preview-image-foundation';
import useEventListener from '../_base/use-event-listener';
import useFoundation from '../_base/use-foundation';
import Spin from '../spin';
import type { PreviewImageProps } from './interface';

type Props = PreviewImageProps & { zoomEvent?: WheelEvent };
type Foundation = PreviewImageFoundation<Props>;
type Adapter = PreviewImageAdapter<Props>;

const preViewImgPrefixCls = `${cssClasses.PREFIX}-preview-image`;

export default function PreviewImage(props: Props) {
    let container: HTMLDivElement | undefined;
    let image: HTMLImageElement | undefined;

    const { foundation, state } = useFoundation<Foundation, Adapter, Props, PreviewImageBaseState>(
        PreviewImageFoundation,
        props,
        () => ({ width: 0, height: 0, loading: true, translate: { x: 0, y: 0 } }),
        (base) => ({
            getContainer: () => container as HTMLDivElement,
            getImage: () => image as HTMLImageElement,
            setLoading: (loading) => base.setState({ loading }),
            setImageCursor: (canDrag) => {
                const style = (image as HTMLImageElement).style;
                style.cursor = canDrag ? 'grab' : 'default';
                // a touch drag pans only a draggable image; otherwise the page keeps scrolling and pinch-zooming
                style.touchAction = canDrag ? 'none' : '';
            },
            capturePointer: (pointerId) => image?.setPointerCapture(pointerId),
            requestZoom: (zoom, reportToUser) => base.getProps().onZoom?.(zoom, reportToUser),
            notifyLoad: (src) => base.getProps().onLoad?.(src),
            notifyError: (src) => base.getProps().onError?.(src),
        })
    );

    const imgStyle = (): JSX.CSSProperties => ({
        position: 'absolute',
        visibility: state().loading ? 'hidden' : 'visible',
        transform: `translate(${state().translate.x}px, ${state().translate.y}px) rotate(${props.rotation}deg)`,
        width: `${state().width}px`,
        height: `${state().height}px`,
    });

    // not deferred: a deferred on skips recording the first input, and the first update would then see a new src
    createEffect(
        on(
            () => [props.src, props.ratio, props.rotation, props.zoom] as const,
            (_, previous) => {
                if (previous) {
                    const [src, ratio, rotation, zoom] = previous;
                    foundation.handlePropsUpdate({ src, ratio, rotation, zoom }, props.zoomEvent);
                }
            }
        )
    );

    useEventListener(() => window, 'resize', foundation.handleWindowResize);

    return (
        <div ref={(node) => (container = node)} class={preViewImgPrefixCls}>
            {/* one img per src, as React's key: a new image starts without the cursor and touch-action of the last */}
            <For each={[props.src]}>
                {(src) => (
                    <img
                        ref={(node) => (image = node)}
                        class={`${preViewImgPrefixCls}-img`}
                        style={imgStyle()}
                        alt={props.alt ?? ''}
                        crossOrigin={props.crossOrigin}
                        src={src}
                        onContextMenu={foundation.handleRightClickImage}
                        onDragStart={(e) => e.preventDefault()}
                        onError={foundation.handleError}
                        onLoad={foundation.handleLoad}
                        onPointerDown={foundation.handleImagePointerDown}
                        onPointerMove={foundation.handleImageMove}
                    />
                )}
            </For>
            <Show when={state().loading}>
                <Spin wrapperClassName={`${preViewImgPrefixCls}-spin`} size="large" />
            </Show>
        </div>
    );
}
