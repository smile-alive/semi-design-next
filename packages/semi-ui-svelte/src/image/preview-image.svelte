<script lang="ts">
    import { untrack } from 'svelte';
    import { cssClasses } from '@fibrae/semi-foundation/image/constants';
    import PreviewImageFoundation, { type PreviewImageAdapter, type PreviewImageBaseProps, type PreviewImageBaseState } from '@fibrae/semi-foundation/image/preview-image-foundation';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import watch from '../_base/watch.svelte.js';
    import { Spin } from '../spin/index.js';
    import type { RatioType } from './interface.js';

    interface Props {
        src?: string;
        alt?: string;
        rotation: number;
        maxZoom: number;
        minZoom: number;
        zoom: number;
        ratio: RatioType;
        disableDownload: boolean;
        crossOrigin?: 'anonymous' | 'use-credentials';
        initialZoom?: number;
        /** The wheel event that set `zoom`, which the zoom centers on */
        zoomEvent?: WheelEvent;
        onZoom: (zoom: number, reportToUser: boolean) => void;
        onLoad: (src: string) => void;
        onError: (src: string) => void;
    }

    type Foundation = PreviewImageFoundation<PreviewImageBaseProps>;
    type Adapter = PreviewImageAdapter<PreviewImageBaseProps>;

    let { src, alt = '', rotation, maxZoom, minZoom, zoom, ratio, disableDownload, crossOrigin, initialZoom, zoomEvent, onZoom, onLoad, onError }: Props = $props();

    let container = $state.raw<HTMLDivElement | null>(null);
    let image = $state.raw<HTMLImageElement | null>(null);

    // What the foundation compares the next props against
    let previous = untrack(() => ({ src, ratio, rotation, zoom }));

    const { foundation, states } = useFoundation<Foundation, Adapter, PreviewImageBaseProps, PreviewImageBaseState>(
        PreviewImageFoundation,
        {
            get src() {
                return src;
            },
            get rotation() {
                return rotation;
            },
            get disableDownload() {
                return disableDownload;
            },
            get maxZoom() {
                return maxZoom;
            },
            get minZoom() {
                return minZoom;
            },
            get zoom() {
                return zoom;
            },
            get ratio() {
                return ratio;
            },
            get initialZoom() {
                return initialZoom;
            },
        },
        () => ({ width: 0, height: 0, loading: true, translate: { x: 0, y: 0 } }),
        (base) => ({
            getContainer: () => container as HTMLDivElement,
            getImage: () => image as HTMLImageElement,
            setLoading: (loading) => base.setState({ loading }),
            // Written on the element, not through the style attribute, which the transform updates would overwrite
            setImageCursor: (canDrag) => {
                if (image) {
                    image.style.cursor = canDrag ? 'grab' : 'default';
                    // a touch drag pans only a draggable image; otherwise the page keeps scrolling and pinch-zooming
                    image.style.touchAction = canDrag ? 'none' : '';
                }
            },
            capturePointer: (pointerId) => image?.setPointerCapture(pointerId),
            requestZoom: (value, reportToUser) => onZoom(value, reportToUser),
            notifyLoad: (loaded) => onLoad(loaded),
            notifyError: (failed) => onError(failed),
        })
    );

    const cls = `${cssClasses.PREFIX}-preview-image`;

    watch(
        () => ({ src, ratio, rotation, zoom }),
        (next) => {
            const prev = previous;
            previous = next;
            foundation.handlePropsUpdate(prev, zoomEvent);
        }
    );
</script>

<svelte:window onresize={foundation.handleWindowResize} />

<div bind:this={container} class={cls}>
    <!-- keyed by src: an image switch starts a new element, so a late load of the old one cannot land on it -->
    {#key src}
        <img
            {alt}
            bind:this={image}
            class="{cls}-img"
            crossorigin={crossOrigin}
            {src}
            style:height="{states().height}px"
            style:position="absolute"
            style:transform="translate({states().translate.x}px, {states().translate.y}px) rotate({rotation}deg)"
            style:visibility={states().loading ? 'hidden' : 'visible'}
            style:width="{states().width}px"
            oncontextmenu={foundation.handleRightClickImage}
            ondragstart={(event) => event.preventDefault()}
            onerror={foundation.handleError}
            onload={foundation.handleLoad}
            onpointerdown={foundation.handleImagePointerDown}
            onpointermove={foundation.handleImageMove}
        />
    {/key}
    {#if states().loading}
        <Spin size="large" wrapperClassName="{cls}-spin" />
    {/if}
</div>
