<script setup lang="ts">
    import { computed, nextTick, onActivated, onDeactivated, shallowRef, useId, useTemplateRef, watch, type StyleValue } from 'vue';
    import { isEqual } from 'es-toolkit';
    import { cssClasses } from '@fibrae/semi-foundation/image/constants';
    import PreviewInnerFoundation, { type PreviewInnerAdapter, type PreviewInnerBaseProps, type PreviewInnerBaseState } from '@fibrae/semi-foundation/image/preview-inner-foundation';
    import { resolvePopupContainer } from '@fibrae/semi-foundation/utils/dom';
    import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
    import FocusScope from '@fibrae/semi-foundation/utils/focus-scope';
    import { openLayer } from '@fibrae/semi-foundation/utils/layer';
    import ReleaseHolder from '@fibrae/semi-foundation/utils/release-holder';
    import { lockBodyScroll } from '@fibrae/semi-foundation/utils/scroll-lock';
    import { IconArrowLeft, IconArrowRight } from '@fibrae/semi-icons-vue';
    import Portal from '../_base/portal.vue';
    import useDidUpdate from '../_base/use-did-update';
    import useFoundation from '../_base/use-foundation';
    import useRecordFocus from '../_base/use-record-focus';
    import useConfig from '../config-provider/use-config';
    import useLocale from '../locale/use-locale';
    import { usePreviewContext } from './context';
    import { previewDefaults } from './defaults';
    import type { ImagePreviewSlots, RatioType } from './interface';
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

    // explicit: these feed openLayer and isValidTarget, whose foundation state flows back into the template, so inference hits TS7022
    const wrap = useTemplateRef<HTMLDivElement>('wrap');
    const header = useTemplateRef<InstanceType<typeof PreviewHeader>>('header');
    const footer = useTemplateRef<InstanceType<typeof PreviewFooter>>('footer');
    const leftIcon = useTemplateRef<HTMLButtonElement>('leftIcon');
    const rightIcon = useTemplateRef<HTMLButtonElement>('rightIcon');
    const ratio = shallowRef<RatioType>('adaptation');
    const scroll = new ReleaseHolder();
    const layer = new ReleaseHolder();
    const focusScope = new FocusScope();

    // Read once per show: only a preview in body is modal (aria-modal, inert page, scroll lock, Tab trap, focus return).
    let modal = false;

    const { foundation, state } = useFoundation<Foundation, Adapter, PreviewInnerBaseProps, PreviewInnerBaseState>(
        PreviewInnerFoundation,
        props,
        (view) => ({
            imgLoadStatus: {},
            zoom: 0.1,
            currentIndex: (view as PreviewInnerProps).defaultCurrentIndex ?? 0,
            rotation: 0,
            viewerVisible: true,
            preloadAfterVisibleChange: true,
        }),
        () => ({
            getIsInGroup: () => Boolean(group),
            disabledBodyScroll: () => (modal ? scroll.hold(lockBodyScroll) : scroll.release()),
            enabledBodyScroll: () => scroll.release(),
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
            registerKeyDownListener: () => window.addEventListener('keydown', handleKeyDown),
            unregisterKeyDownListener: () => window.removeEventListener('keydown', handleKeyDown),
            openLayer: (onEscape) => layer.hold(() => openLayer({ element: wrap.value as HTMLDivElement, modal, onEscape })),
            closeLayer: () => layer.release(),
            getSetDownloadFunc: () => (group?.view.value.setDownloadName ?? props.setDownloadName) as (src: string) => string,
            isValidTarget: (e: Event) => !(e.target instanceof Node && [header.value?.$el, footer.value?.$el, leftIcon.value, rightIcon.value].some((el) => el?.contains(e.target as Node))),
            isEventInPreview: (e) => !(e.target instanceof Element) || e.target === document.body || Boolean(wrap.value?.contains(e.target)),
            setRatio: (value) => {
                ratio.value = value;
            },
        }),
        {
            context: () => ({
                isGroup: Boolean(group),
                setCurrentIndex: group?.setCurrentIndex,
                direction: config.value.direction,
            }),
        }
    );

    const cls = `${cssClasses.PREFIX}-preview`;
    const srcList = computed(() => PreviewInnerFoundation.getSrcList(props.src as string | string[]));
    const total = computed(() => srcList.value.length);

    // stable reference: the listener added on show is the one removed on hide
    const handleKeyDown = (e: KeyboardEvent) => foundation.handleKeyDown(e);

    const currentIndex = computed(() => PreviewInnerFoundation.getCurrentIndex(props, state.value));
    const showPrev = computed(() => PreviewInnerFoundation.canSwitch('prev', currentIndex.value, total.value, props.infinite));
    const showNext = computed(() => PreviewInnerFoundation.canSwitch('next', currentIndex.value, total.value, props.infinite));
    const title = computed(() => group?.view.value.titles[currentIndex.value] ?? props.previewTitle);
    const hasTitle = computed(() => title.value != null && title.value !== '');

    // 0.29 * 100 is 28.999999999999996, which the slider would read out
    const toPercent = (value: number) => Number((value * 100).toFixed(2));

    const handlePrev = () => foundation.handleSwitchImage('prev');

    const handleNext = () => foundation.handleSwitchImage('next');

    const inBody = () => {
        const container = resolvePopupContainer(props.getPopupContainer ?? config.value.getPopupContainer);
        return container === container.ownerDocument.body;
    };

    const show = (el: HTMLElement) => {
        modal = inBody();
        foundation.beforeShow();
        // browsers skip autofocus on elements inserted after page load
        el.querySelector<HTMLElement>('[autofocus]')?.focus({ preventScroll: true });
        focusScope.engage(el, modal, true);
    };

    // recorded before the preview renders, or its own focus would be recorded
    useRecordFocus(focusScope, () => props.visible);

    watch(
        () => (props.visible ? wrap.value : null),
        (el, _, onCleanup) => {
            if (!el) {
                return;
            }
            show(el);
            onCleanup(() => {
                foundation.afterHide();
                focusScope.deactivate();
            });
        },
        { flush: 'post' }
    );

    // Runs after the watcher above releases the inert: both are post jobs of this instance with the same id, so only the
    // stable sort of the post queue plus creation order keeps them in sequence; do not swap the two. A non-modal preview
    // keeps focus the user moved elsewhere.
    watch(
        () => props.visible,
        (visible) => {
            const active = FocusTrapHandle.getActiveElement();
            if (!visible && (modal || !active || active === document.body)) {
                focusScope.restore(true);
            }
        },
        { flush: 'post' }
    );

    // KeepAlive: the Portal removes the hidden preview, so release page-level holds without closing it
    onDeactivated(() => {
        if (props.visible) {
            window.removeEventListener('keydown', handleKeyDown);
            layer.release();
            scroll.release();
            focusScope.deactivate();
        }
    });

    onActivated(() => {
        if (!props.visible) {
            return;
        }
        // the Portal moves the dialog back next render, and moving a focused element drops its focus
        void nextTick(() => {
            if (props.visible && wrap.value) {
                show(wrap.value);
            }
        });
    });

    useDidUpdate(() => props.src, foundation.updateTimer, isEqual, 'pre');

    // same render as the new src, so PreviewImage does not re-fit the leaving image
    watch(currentIndex, () => {
        ratio.value = 'adaptation';
    });

    // a focused prev/next button disappears at the ends; keep focus in the dialog. Focus the user moved elsewhere is left
    // alone.
    watch(
        () => currentIndex.value,
        () => {
            const el = wrap.value;
            const active = FocusTrapHandle.getActiveElement();
            if (el && (!active || active === document.body)) {
                el.focus({ preventScroll: true });
            }
        },
        { flush: 'post' }
    );
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
            <PreviewHeader ref="header" :closable="props.closable" :hidden="!state.viewerVisible" :index="currentIndex" :title="title" :titleId="titleId" @close="foundation.handlePreviewClose">
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
            <button v-if="showPrev" ref="leftIcon" :aria-label="props.prevTip ?? locale.locale.prevTip" :class="[`${cls}-icon`, `${cls}-prev`, { [`${cls}-hide`]: !state.viewerVisible }]" type="button" @click="handlePrev">
                <slot :index="currentIndex" name="leftIcon">
                    <IconArrowLeft size="large" />
                </slot>
            </button>
            <button v-if="showNext" ref="rightIcon" :aria-label="props.nextTip ?? locale.locale.nextTip" :class="[`${cls}-icon`, `${cls}-next`, { [`${cls}-hide`]: !state.viewerVisible }]" type="button" @click="handleNext">
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
                :hidden="!state.viewerVisible"
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
