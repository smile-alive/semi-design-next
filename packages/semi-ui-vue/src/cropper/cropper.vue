<script setup lang="ts">
    import { computed, onActivated, onDeactivated, useId, useTemplateRef, watch, type ImgHTMLAttributes } from 'vue';
    import { omit } from 'es-toolkit';
    import { cssClasses, strings } from '@fibrae/semi-foundation/cropper/constants';
    import CropperFoundation, { type CropperAdapter, type CropperFoundationProps, type CropperState } from '@fibrae/semi-foundation/cropper/foundation';
    import { getCropperGeometry } from '@fibrae/semi-foundation/cropper/utils';
    import '@fibrae/semi-foundation/cropper/cropper.scss';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import { groupRole } from '../_base/group-role';
    import semiDefault, { readSemiDefault, semiGlobalDefault, useSemiGlobal } from '../_base/semi-default';
    import useEventListener from '../_base/use-event-listener';
    import useFoundation from '../_base/use-foundation';
    import useResizeObserver from '../_base/use-resize-observer';
    import useLocale from '../locale/use-locale';
    import type { CropperEmits, CropperHandle, CropperProps } from './interface';

    type Adapter = CropperAdapter<CropperFoundationProps>;

    const props = withDefaults(defineProps<CropperProps & /* @vue-ignore */ ElementProps<'div', keyof CropperProps | EmitHandlers<CropperEmits>>>(), {
        aspectRatio: semiGlobalDefault('Cropper', 'aspectRatio'),
        cropperBoxCls: semiGlobalDefault('Cropper', 'cropperBoxCls'),
        cropperBoxStyle: semiGlobalDefault('Cropper', 'cropperBoxStyle'),
        defaultAspectRatio: () => semiDefault('Cropper', 'defaultAspectRatio', 1),
        fill: () => semiDefault('Cropper', 'fill', 'rgba(0, 0, 0, 0)'),
        imgProps: semiGlobalDefault('Cropper', 'imgProps'),
        maxZoom: () => semiDefault('Cropper', 'maxZoom', 3),
        minZoom: () => semiDefault('Cropper', 'minZoom', 0.1),
        // Function-typed props cannot take a factory default; the global default is read in `preview`.
        preview: undefined,
        rotate: semiGlobalDefault('Cropper', 'rotate'),
        shape: () => semiDefault('Cropper', 'shape', 'rect'),
        showResizeBox: () => semiDefault('Cropper', 'showResizeBox', true),
        src: semiGlobalDefault('Cropper', 'src'),
        zoom: semiGlobalDefault('Cropper', 'zoom'),
        zoomStep: () => semiDefault('Cropper', 'zoomStep', 0.1),
    });

    const emit = defineEmits<CropperEmits>();

    const semi = useSemiGlobal();
    const i18n = useLocale('Cropper');

    const helpId = useId();
    const root = useTemplateRef('root');
    const img = useTemplateRef('img');

    // onActivated also runs after the first mount; only a return from the cache sets up again
    let deactivated = false;

    const prefix = cssClasses.PREFIX;
    const preview = computed(() => props.preview ?? readSemiDefault(semi, 'Cropper', 'preview'));

    const { foundation, state } = useFoundation<CropperFoundation, Adapter, CropperFoundationProps, CropperState>(
        CropperFoundation,
        props as CropperFoundationProps,
        () => ({
            imgData: { width: 0, height: 0, centerPoint: { x: 0, y: 0 } },
            cropperBox: { width: 0, height: 0, centerPoint: { x: 0, y: 0 } },
            zoom: 1,
            rotate: 0,
            loaded: false,
        }),
        () => ({
            getContainer: () => root.value as HTMLDivElement,
            getImg: () => img.value as HTMLImageElement,
            notifyZoomChange: (zoom) => {
                emit('update:zoom', zoom);
                emit('zoomChange', zoom);
            },
        }),
        { props: { preview: () => preview.value as CropperFoundationProps['preview'] } }
    );

    const geometry = computed(() => getCropperGeometry(state.value.imgData, state.value.cropperBox));

    const imgStyle = computed(() => {
        const { imgData, rotate } = state.value;
        return {
            width: `${imgData.width}px`,
            height: `${imgData.height}px`,
            transformOrigin: 'center',
            transform: `translate(${geometry.value.imgX}px, ${geometry.value.imgY}px) rotate(${rotate}deg)`,
        };
    });

    const viewImgStyle = computed(() => {
        const { imgData, rotate } = state.value;
        return {
            width: `${imgData.width}px`,
            height: `${imgData.height}px`,
            transformOrigin: 'center',
            transform: `translate(${geometry.value.viewX}px, ${geometry.value.viewY}px) rotate(${rotate}deg)`,
        };
    });

    const corners = computed(() => (props.shape === 'round' ? strings.roundCorner : strings.corner));

    // The user's attributes come first: the cropper owns src, class, style and the load order.
    const imgAttrs = computed<ImgHTMLAttributes>(() => ({
        crossorigin: 'anonymous',
        ...omit(props.imgProps ?? {}, ['class', 'style', 'src', 'onLoad']),
    }));

    const handleLoad = (event: Event) => {
        foundation.handleImageLoad(event);
        props.imgProps?.onLoad?.(event);
    };

    // preventDefault in handleWheel must stop a pinch from zooming the page, which only works from a non-passive listener,
    // so the listener is registered explicitly as one.
    useEventListener(root, 'wheel', (event) => foundation.handleWheel(event), { passive: false });
    useResizeObserver(root, () => foundation.handleResize());

    // Wheel zooming and the image load change the state too. A controlled zoom thereby undoes a zoom the parent did
    // not accept, and the preview mirrors every layout change.
    watch(
        [state, () => props.zoom, () => props.rotate],
        () => {
            foundation.syncRotateAndZoom();
            foundation.updatePreview();
        },
        { flush: 'post' }
    );

    watch(
        () => props.aspectRatio,
        () => foundation.applyAspectRatio(),
        { flush: 'post' }
    );

    // a controlled value dropped again falls back to the default, like the other components
    watch(
        () => props.zoom,
        (zoom) => {
            if (zoom === undefined) foundation.syncRotateAndZoom({ zoom: 1 });
        }
    );

    watch(
        () => props.rotate,
        (rotate) => {
            if (rotate === undefined) foundation.syncRotateAndZoom({ rotate: 0 });
        }
    );

    // The preview lives in the user's DOM, so it has to leave with a cached subtree and come back with it.
    onDeactivated(() => {
        deactivated = true;
        foundation.destroy();
    });

    onActivated(() => {
        if (deactivated) {
            deactivated = false;
            foundation.init();
            foundation.updatePreview();
        }
    });

    defineExpose<CropperHandle>({ getCropperCanvas: () => foundation.getCropperCanvas() });
</script>

<template>
    <div ref="root" :class="prefix" :role="groupRole($attrs)">
        <div :class="cssClasses.IMG_WRAPPER">
            <!-- the cropping surface, not content: there is no description to give -->
            <img v-bind="imgAttrs" ref="img" :alt="props.imgProps?.alt ?? ''" :class="[cssClasses.IMG, props.imgProps?.class]" :src="props.src" :style="[props.imgProps?.style, imgStyle]" @load="handleLoad($event)" />
        </div>
        <div :class="cssClasses.MASK" @lostpointercapture="foundation.handleMaskLostPointerCapture" @pointerdown="foundation.handleMaskPointerDown" @pointermove="foundation.handleMaskPointerMove" />
        <!-- not a widget role: the box has no single value, so it is a named group that says how to use it -->
        <div
            :aria-describedby="helpId"
            :aria-label="i18n.locale.cropArea"
            :aria-roledescription="i18n.locale.cropAreaRole"
            :class="[cssClasses.CROPPER_BOX, props.cropperBoxCls, { [cssClasses.CROPPER_VIEW_BOX_ROUND]: props.shape === 'round' }]"
            role="group"
            :style="[props.cropperBoxStyle, { width: `${state.cropperBox.width}px`, height: `${state.cropperBox.height}px`, transform: `translate(${geometry.boxX}px, ${geometry.boxY}px)` }]"
            :tabindex="state.loaded ? 0 : undefined"
            @keydown="foundation.handleCropperBoxKeyDown"
            @lostpointercapture="foundation.handleCropperBoxLostPointerCapture"
            @pointerdown="foundation.handleCropperBoxPointerDown"
            @pointermove="foundation.handleCropperBoxPointerMove"
        >
            <span :id="helpId" hidden>{{ i18n.locale.cropAreaHelp }}</span>
            <div :class="[cssClasses.CROPPER_VIEW_BOX, { [cssClasses.CROPPER_VIEW_BOX_ROUND]: props.shape.includes('round') }]">
                <!-- a native image drag would cancel the pointer that moves the box -->
                <img alt="" :class="cssClasses.CROPPER_IMG" :draggable="false" :src="props.src" :style="viewImgStyle" />
            </div>
            <template v-if="state.loaded && props.showResizeBox">
                <div v-for="corner in corners" :key="corner" :class="[cssClasses.CORNER, `${cssClasses.CORNER}-${corner}`]" :data-dir="corner" @lostpointercapture="foundation.handleCornerLostPointerCapture" @pointerdown="foundation.handleCornerPointerDown" @pointermove="foundation.handleCornerPointerMove" />
            </template>
        </div>
    </div>
</template>
