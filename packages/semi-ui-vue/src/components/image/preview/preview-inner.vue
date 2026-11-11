<script setup lang="ts">
    import { computed, nextTick, useId, useTemplateRef, watch, type StyleValue } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/components/image/constants';
    import PreviewInnerFoundation, { type PreviewInnerAdapter, type PreviewInnerBaseProps, type PreviewInnerState } from '@fibrae/semi-foundation/components/image/preview-inner-foundation';
    import { IconArrowLeft, IconArrowRight } from '@fibrae/semi-icons-vue';
    import { useFoundation, useKeepAliveFoundation } from '../../../base/index';
    import { useRecordFocus } from '../../../composables/index';
    import { Portal } from '../../../internal/index';
    import useConfig from '../../config-provider/use-config';
    import useLocale from '../../locale/use-locale';
    import { usePreviewContext } from '../context';
    import type { ImagePreviewSlots, RatioType } from '../interface';
    import { previewDefaults } from './defaults';
    import PreviewFooter from './preview-footer.vue';
    import PreviewHeader from './preview-header.vue';
    import PreviewImage from './preview-image.vue';

    interface PreviewInnerProps {
        visible: boolean;
        src?: string | string[];
        /** undefined for the uncontrolled preview of a single Image; a group always passes it */
        currentIndex?: number;
        defaultCurrentIndex?: number;
        /** alt of a single Image's preview; a group passes the alts of its images by context */
        alt?: string;
        previewTitle?: string;
        previewCls?: string;
        previewStyle?: StyleValue;
        getPopupContainer?: () => HTMLElement;
        setDownloadName?: (src: string) => string;
        crossOrigin?: 'anonymous' | 'use-credentials';
        initialZoom?: number;
        prevTip?: string;
        nextTip?: string;
        zoomInTip?: string;
        zoomOutTip?: string;
        rotateTip?: string;
        downloadTip?: string;
        adaptiveTip?: string;
        originTip?: string;
        showTooltip?: boolean;
        zoomStep?: number;
        infinite?: boolean;
        closable?: boolean;
        closeOnEsc?: boolean;
        preLoad?: boolean;
        preLoadGap?: number;
        zIndex?: number;
        maskClosable?: boolean;
        viewerVisibleDelay?: number;
        maxZoom?: number;
        minZoom?: number;
        disableDownload?: boolean;
    }

    type Foundation = PreviewInnerFoundation<PreviewInnerBaseProps>;
    type Adapter = PreviewInnerAdapter<PreviewInnerBaseProps>;

    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<PreviewInnerProps>(), {
        currentIndex: undefined,
        defaultCurrentIndex: undefined,
        getPopupContainer: undefined,
        setDownloadName: undefined,
        showTooltip: previewDefaults.showTooltip,
        zoomStep: previewDefaults.zoomStep,
        infinite: previewDefaults.infinite,
        closable: previewDefaults.closable,
        closeOnEsc: previewDefaults.closeOnEsc,
        preLoad: previewDefaults.preLoad,
        preLoadGap: previewDefaults.preLoadGap,
        zIndex: previewDefaults.zIndex,
        maskClosable: previewDefaults.maskClosable,
        viewerVisibleDelay: previewDefaults.viewerVisibleDelay,
        maxZoom: previewDefaults.maxZoom,
        minZoom: previewDefaults.minZoom,
        disableDownload: previewDefaults.disableDownload,
    });

    const emit = defineEmits<{
        visibleChange: [visible: boolean];
        change: [index: number];
        close: [];
        zoomIn: [zoom: number];
        zoomOut: [zoom: number];
        prev: [index: number];
        next: [index: number];
        ratioChange: [type: RatioType];
        rotateLeft: [angle: number];
        download: [src: string, index: number];
        downloadError: [src: string];
    }>();

    defineSlots<Omit<ImagePreviewSlots, 'default'>>();

    const group = usePreviewContext();
    const config = useConfig();
    const locale = useLocale('Image');

    const titleId = useId();

    // explicit: these feed getWrap and isOutsideControls, whose foundation state flows back into the template, so inference hits TS7022
    const wrap = useTemplateRef<HTMLDivElement>('wrap');
    const header = useTemplateRef<InstanceType<typeof PreviewHeader>>('header');
    const footer = useTemplateRef<InstanceType<typeof PreviewFooter>>('footer');
    const leftIcon = useTemplateRef<HTMLButtonElement>('leftIcon');
    const rightIcon = useTemplateRef<HTMLButtonElement>('rightIcon');

    const { foundation, state } = useFoundation<Foundation, Adapter, PreviewInnerBaseProps, PreviewInnerState>(
        PreviewInnerFoundation,
        props,
        (view) => PreviewInnerFoundation.getInitialState(view),
        () => ({
            notifyChange: (index, direction) => {
                emit('change', index);
                if (direction === 'prev') {
                    emit('prev', index);
                } else {
                    emit('next', index);
                }
            },
            notifyZoom: (zoom, increase) => (increase ? emit('zoomIn', zoom) : emit('zoomOut', zoom)),
            notifyClose: () => emit('close'),
            notifyVisibleChange: (visible) => emit('visibleChange', visible),
            notifyRatioChange: (type) => emit('ratioChange', type),
            notifyRotateChange: (angle) => emit('rotateLeft', angle),
            notifyDownload: (src, index) => emit('download', src, index),
            notifyDownloadError: (src) => emit('downloadError', src),
            getWrap: () => wrap.value,
            isOutsideControls: (e: Event) => !(e.target instanceof Node && [header.value?.$el, footer.value?.$el, leftIcon.value, rightIcon.value].some((el) => el?.contains(e.target as Node))),
        }),
        {
            context: () => ({
                setCurrentIndex: group?.setCurrentIndex,
                setDownloadName: group?.view.value.setDownloadName,
                direction: config.value.direction,
                popupContainer: props.getPopupContainer ?? config.value.getPopupContainer,
            }),
        }
    );

    const cls = `${cssClasses.PREFIX}-preview`;
    const srcList = computed(() => PreviewInnerFoundation.getSrcList(props.src!));
    const total = computed(() => srcList.value.length);
    const currentIndex = computed(() => PreviewInnerFoundation.getCurrentIndex(props, state.value));
    const ratio = computed(() => PreviewInnerFoundation.getRatio(props, state.value));
    const showPrev = computed(() => PreviewInnerFoundation.canSwitch('prev', currentIndex.value, total.value, props.infinite));
    const showNext = computed(() => PreviewInnerFoundation.canSwitch('next', currentIndex.value, total.value, props.infinite));
    const title = computed(() => group?.view.value.titles[currentIndex.value] ?? props.previewTitle);
    const hasTitle = computed(() => title.value != null && title.value !== '');

    // 0.29 * 100 is 28.999999999999996, which the slider would read out
    const toPercent = (value: number) => Number((value * 100).toFixed(2));

    const handlePrev = () => foundation.handleSwitchImage('prev');

    const handleNext = () => foundation.handleSwitchImage('next');

    // recorded before the preview renders, or its own focus would be recorded
    useRecordFocus({ record: foundation.recordFocus }, () => props.visible);

    watch(
        () => (props.visible ? wrap.value : null),
        (el, _, onCleanup) => {
            if (!el) {
                return;
            }
            foundation.beforeShow();
            onCleanup(foundation.afterHide);
        },
        { flush: 'post' }
    );

    // KeepAlive: the Portal removes the hidden preview, so destroy releases page-level holds without closing it. The
    // Portal moves the dialog back next render, and moving a focused element drops its focus, so init waits for it.
    const keepAlive: ReturnType<typeof useKeepAliveFoundation> = useKeepAliveFoundation({
        connect: () => foundation.connect(),
        disconnect: () => foundation.disconnect(),
        init: () => void nextTick(() => keepAlive.isDeactivated() || foundation.init()),
        destroy: () => foundation.destroy(),
    });
</script>

<template>
    <Portal v-if="props.visible" #default="{ inBody: covers }" :getPopupContainer="props.getPopupContainer" :zIndex="props.zIndex">
        <div
            ref="wrap"
            :aria-label="hasTitle ? undefined : locale.locale.preview"
            :aria-labelledby="hasTitle ? titleId : undefined"
            :aria-modal="covers ? 'true' : undefined"
            :class="[cls, { [`${cls}-popup`]: !covers }, props.previewCls]"
            role="dialog"
            :style="props.previewStyle"
            tabindex="-1"
            @focusin="foundation.handleKeyboardActivity"
            @mousedown="foundation.handleMouseDown"
            @mousemove="foundation.handleMouseMove"
            @mouseup="foundation.handleMouseUp"
            @wheel="foundation.handleWheel"
        >
            <PreviewHeader ref="header" :closable="props.closable" :hidden="!state.controlsVisible" :index="currentIndex" :title="title" :titleId="titleId" @close="foundation.handlePreviewClose">
                <template v-if="$slots.title" #title="slotProps">
                    <slot name="title" v-bind="slotProps" />
                </template>
                <template v-if="$slots.closeIcon" #closeIcon>
                    <slot name="closeIcon" />
                </template>
            </PreviewHeader>
            <PreviewImage
                :alt="group?.view.value.alts[currentIndex] ?? props.alt"
                :crossOrigin="props.crossOrigin"
                :disableDownload="props.disableDownload"
                :initialZoom="props.initialZoom"
                :maxZoom="props.maxZoom"
                :minZoom="props.minZoom"
                :ratio="ratio"
                :rotation="state.rotation!"
                :src="srcList[currentIndex]"
                :zoom="state.zoom!"
                :zoomEvent="state.zoomEvent"
                @error="foundation.preloadSingleImage"
                @load="foundation.onImageLoad"
                @zoom="foundation.handleZoomImage"
            />
            <button v-if="showPrev" ref="leftIcon" :aria-label="props.prevTip ?? locale.locale.prevTip" :class="[`${cls}-icon`, `${cls}-prev`, { [`${cls}-hide`]: !state.controlsVisible }]" type="button" @click="handlePrev">
                <slot :index="currentIndex" name="leftIcon">
                    <IconArrowLeft size="large" />
                </slot>
            </button>
            <button v-if="showNext" ref="rightIcon" :aria-label="props.nextTip ?? locale.locale.nextTip" :class="[`${cls}-icon`, `${cls}-next`, { [`${cls}-hide`]: !state.controlsVisible }]" type="button" @click="handleNext">
                <slot :index="currentIndex" name="rightIcon">
                    <IconArrowRight size="large" />
                </slot>
            </button>
            <PreviewFooter
                ref="footer"
                :adaptiveTip="props.adaptiveTip"
                :curPage="currentIndex + 1"
                :disableDownload="props.disableDownload"
                :disabledNext="!showNext"
                :disabledPrev="!showPrev"
                :downloadTip="props.downloadTip"
                :hidden="!state.controlsVisible"
                :max="toPercent(props.maxZoom)"
                :min="toPercent(props.minZoom)"
                :nextTip="props.nextTip"
                :originTip="props.originTip"
                :prevTip="props.prevTip"
                :ratio="ratio"
                :rotateTip="props.rotateTip"
                :showTooltip="props.showTooltip"
                :step="toPercent(props.zoomStep)"
                :totalNum="total"
                :zoom="toPercent(state.zoom!)"
                :zoomInTip="props.zoomInTip"
                :zoomOutTip="props.zoomOutTip"
                @adjustRatio="foundation.handleAdjustRatio"
                @download="foundation.handleDownload"
                @next="handleNext"
                @prev="handlePrev"
                @rotate="foundation.handleRotateImage"
                @zoomIn="foundation.handleZoomImage"
                @zoomOut="foundation.handleZoomImage"
            >
                <template v-if="$slots.previewMenu" #previewMenu="slotProps">
                    <slot name="previewMenu" v-bind="slotProps" />
                </template>
            </PreviewFooter>
        </div>
    </Portal>
</template>
