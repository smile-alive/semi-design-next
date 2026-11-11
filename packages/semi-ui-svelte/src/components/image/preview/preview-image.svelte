<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/image/constants';
    import PreviewImageFoundation, { type PreviewImageAdapter, type PreviewImageBaseProps, type PreviewImageState } from '@fibrae/semi-foundation/components/image/preview-image-foundation';
    import { useFoundation } from '../../../base/index.js';
    import { Spin } from '../../spin/index.js';
    import type { RatioType } from '../interface.js';

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

    const { foundation, states } = useFoundation<Foundation, Adapter, PreviewImageBaseProps, PreviewImageState>(
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
            get zoomEvent() {
                return zoomEvent;
            },
        },
        () => PreviewImageFoundation.getInitialState(),
        () => ({
            getContainer: () => container!,
            getImage: () => image!,
            requestZoom: (value, reportToUser) => onZoom(value, reportToUser),
            notifyLoad: (loaded) => onLoad(loaded),
            notifyError: (failed) => onError(failed),
        })
    );

    const cls = `${cssClasses.PREFIX}-preview-image`;
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
