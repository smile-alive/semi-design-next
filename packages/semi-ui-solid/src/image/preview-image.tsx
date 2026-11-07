import { type JSX, For, Show } from 'solid-js';
import { cssClasses } from '@fibrae/semi-foundation/components/image/constants';
import PreviewImageFoundation, { type PreviewImageAdapter, type PreviewImageState } from '@fibrae/semi-foundation/components/image/preview-image-foundation';
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

    const { foundation, state } = useFoundation<Foundation, Adapter, Props, PreviewImageState>(
        PreviewImageFoundation,
        props,
        () => PreviewImageFoundation.getInitialState(),
        (base) => ({
            getContainer: () => container as HTMLDivElement,
            getImage: () => image as HTMLImageElement,
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
