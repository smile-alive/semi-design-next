<script setup lang="ts">
    import { computed, useTemplateRef, watch, type StyleValue } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/image/constants';
    import PreviewImageFoundation, { type PreviewImageAdapter, type PreviewImageBaseProps, type PreviewImageBaseState } from '@fibrae/semi-foundation/image/preview-image-foundation';
    import useEventListener, { getWindow } from '../_base/use-event-listener';
    import useFoundation from '../_base/use-foundation';
    import Spin from '../spin';
    import type { RatioType } from './interface';

    interface PreviewImageProps {
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
    }

    type Foundation = PreviewImageFoundation<PreviewImageBaseProps>;
    type Adapter = PreviewImageAdapter<PreviewImageBaseProps>;

    const props = withDefaults(defineProps<PreviewImageProps>(), { alt: '' });

    const emit = defineEmits<{
        zoom: [zoom: number, reportToUser: boolean];
        load: [src: string];
        error: [src: string];
    }>();

    const container = useTemplateRef('container');
    const image = useTemplateRef('image');

    const { foundation, state } = useFoundation<Foundation, Adapter, PreviewImageBaseProps, PreviewImageBaseState>(
        PreviewImageFoundation,
        props,
        () => ({ width: 0, height: 0, loading: true, translate: { x: 0, y: 0 } }),
        (base) => ({
            getContainer: () => container.value as HTMLDivElement,
            getImage: () => image.value as HTMLImageElement,
            setLoading: (loading) => base.setState({ loading }),
            // the style binding has no cursor key, so a patch leaves this one alone
            setImageCursor: (canDrag) => {
                if (image.value) {
                    image.value.style.cursor = canDrag ? 'grab' : 'default';
                    // a touch drag pans only a draggable image; otherwise the page keeps scrolling and pinch-zooming
                    image.value.style.touchAction = canDrag ? 'none' : '';
                }
            },
            capturePointer: (pointerId) => image.value?.setPointerCapture(pointerId),
            requestZoom: (zoom, reportToUser) => emit('zoom', zoom, reportToUser),
            notifyLoad: (src) => emit('load', src),
            notifyError: (src) => emit('error', src),
        })
    );

    const cls = `${cssClasses.PREFIX}-preview-image`;

    const imgStyle = computed<StyleValue>(() => {
        const { loading, width, height, translate } = state.value;
        return {
            position: 'absolute',
            visibility: loading ? 'hidden' : 'visible',
            transform: `translate(${translate.x}px, ${translate.y}px) rotate(${props.rotation}deg)`,
            width: `${width}px`,
            height: `${height}px`,
        };
    });

    useEventListener(getWindow, 'resize', () => foundation.handleWindowResize());
    watch([() => props.src, () => props.ratio, () => props.rotation, () => props.zoom], (_, [src, ratio, rotation, zoom]) => foundation.handlePropsUpdate({ src, ratio, rotation, zoom }, props.zoomEvent), { flush: 'post' });
</script>

<template>
    <div ref="container" :class="cls">
        <!-- keyed by src: an image switch starts a new element, so a late load of the old one cannot land on it -->
        <img
            :key="props.src"
            ref="image"
            :alt="props.alt"
            :class="`${cls}-img`"
            :crossorigin="props.crossOrigin"
            :src="props.src"
            :style="imgStyle"
            @contextmenu="foundation.handleRightClickImage"
            @dragstart.prevent
            @error="foundation.handleError"
            @load="foundation.handleLoad($event as Event & { target: EventTarget })"
            @pointerdown="foundation.handleImagePointerDown"
            @pointermove="foundation.handleImageMove"
        />
        <Spin v-if="state.loading" size="large" :wrapperClassName="`${cls}-spin`" />
    </div>
</template>
