<script setup lang="ts">
    import { computed, h } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/image/constants';
    import PreviewFooterFoundation, { type PreviewFooterAdapter, type PreviewFooterBaseProps, type PreviewFooterBaseState } from '@fibrae/semi-foundation/image/preview-footer-foundation';
    import useFoundation from '../_base/use-foundation';
    import Divider from '../divider';
    import useLocale from '../locale/use-locale';
    import { FOOTER_ITEMS, type FooterView } from './footer';
    import type { ImagePreviewSlots, MenuProps, RatioType, RotateDirection } from './interface';
    import PreviewFooterItem from './preview-footer-item.vue';

    interface PreviewFooterProps {
        min?: number;
        max?: number;
        step?: number;
        curPage: number;
        totalNum: number;
        zoom: number;
        ratio: RatioType;
        disabledPrev: boolean;
        disabledNext: boolean;
        disableDownload?: boolean;
        showTooltip?: boolean;
        hidden: boolean;
        prevTip?: string;
        nextTip?: string;
        zoomInTip?: string;
        zoomOutTip?: string;
        rotateTip?: string;
        downloadTip?: string;
        adaptiveTip?: string;
        originTip?: string;
    }

    type Foundation = PreviewFooterFoundation<PreviewFooterBaseProps>;
    type Adapter = PreviewFooterAdapter<PreviewFooterBaseProps>;

    const props = withDefaults(defineProps<PreviewFooterProps>(), {
        min: 10,
        max: 500,
        step: 10,
        disableDownload: false,
        showTooltip: false,
    });

    const emit = defineEmits<{
        zoomIn: [zoom: number];
        zoomOut: [zoom: number];
        adjustRatio: [type: RatioType];
        rotate: [direction: RotateDirection];
        prev: [];
        next: [];
        download: [];
    }>();

    defineSlots<Pick<ImagePreviewSlots, 'previewMenu'>>();

    const locale = useLocale('Image');

    const { foundation } = useFoundation<Foundation, Adapter, PreviewFooterBaseProps, PreviewFooterBaseState>(
        PreviewFooterFoundation,
        props,
        () => ({}),
        () => ({
            notifyZoomIn: (zoom) => emit('zoomIn', zoom),
            notifyZoomOut: (zoom) => emit('zoomOut', zoom),
            notifyAdjustRatio: (type) => emit('adjustRatio', type),
            notifyRotate: (direction) => emit('rotate', direction),
        })
    );

    const cls = `${cssClasses.PREFIX}-preview-footer`;

    const onPrev = () => emit('prev');

    const onNext = () => emit('next');

    const onDownload = () => emit('download');

    const onZoomIn = () => foundation.changeSliderValue('plus');

    const onZoomOut = () => foundation.changeSliderValue('minus');

    const onRotateLeft = () => foundation.handleRotate('left');

    const onRotateRight = () => foundation.handleRotate('right');

    const onRatioClick = () => foundation.handleRatioClick();

    const view = computed<FooterView>(() => {
        const text = locale.value.locale;
        return {
            showTooltip: props.showTooltip,
            curPage: props.curPage,
            totalNum: props.totalNum,
            zoom: props.zoom,
            min: props.min,
            max: props.max,
            step: props.step,
            ratio: props.ratio,
            zoomLabel: text.zoom,
            buttons: {
                prev: { label: props.prevTip ?? text.prevTip, disabled: props.disabledPrev, onClick: onPrev },
                next: { label: props.nextTip ?? text.nextTip, disabled: props.disabledNext, onClick: onNext },
                zoomOut: {
                    label: props.zoomOutTip ?? text.zoomOutTip,
                    disabled: props.zoom === props.min,
                    onClick: onZoomOut,
                },
                zoomIn: { label: props.zoomInTip ?? text.zoomInTip, disabled: props.zoom === props.max, onClick: onZoomIn },
                ratio: {
                    label: props.ratio === 'adaptation' ? (props.originTip ?? text.originTip) : (props.adaptiveTip ?? text.adaptiveTip),
                    disabled: false,
                    onClick: onRatioClick,
                },
                rotate: { label: props.rotateTip ?? text.rotateTip, disabled: false, onClick: onRotateLeft },
                download: {
                    label: props.downloadTip ?? text.downloadTip,
                    disabled: props.disableDownload,
                    onClick: onDownload,
                },
            },
            onSlide: foundation.handleSlideChange,
        };
    });

    const menuProps = (): MenuProps => ({
        min: props.min,
        max: props.max,
        step: props.step,
        curPage: props.curPage,
        totalNum: props.totalNum,
        zoom: props.zoom,
        ratio: props.ratio,
        disabledPrev: props.disabledPrev,
        disabledNext: props.disabledNext,
        disabledZoomIn: props.zoom === props.max,
        disabledZoomOut: props.zoom === props.min,
        disableDownload: props.disableDownload,
        menuItems: FOOTER_ITEMS.map((item) => h(PreviewFooterItem, { key: item, item, view: view.value })),
        onDownload,
        onNext,
        onPrev,
        onZoomIn,
        onZoomOut,
        onRatioClick,
        onRotateLeft,
        onRotateRight,
    });
</script>

<template>
    <section :class="[cls, `${cls}-wrapper`, { [`${cls}-content`]: !$slots.previewMenu, [`${cssClasses.PREFIX}-preview-hide`]: props.hidden }]">
        <slot v-if="$slots.previewMenu" name="previewMenu" v-bind="menuProps()" />
        <template v-else>
            <template v-for="(item, index) in FOOTER_ITEMS" :key="item">
                <PreviewFooterItem :item="item" :view="view" />
                <Divider v-if="index === 2 || index === 6" layout="vertical" />
            </template>
        </template>
    </section>
</template>
