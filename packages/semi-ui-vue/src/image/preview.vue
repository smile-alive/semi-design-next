<script setup lang="ts">
    import { computed, onUpdated, useTemplateRef } from 'vue';
    import { pick } from 'es-toolkit';
    import { cssClasses } from '@fibrae/semi-foundation/image/constants';
    import PreviewFoundation, { getGroupPreviewList, loadLazyImages, type PreviewAdapter, type PreviewBaseState } from '@fibrae/semi-foundation/image/preview-foundation';
    import '@fibrae/semi-foundation/image/image.scss';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import { groupRole } from '../_base/group-role';
    import semiDefault, { readSemiDefault, semiGlobalDefault, useSemiGlobal } from '../_base/semi-default';
    import useFoundation from '../_base/use-foundation';
    import useIntersectionObserver from '../_base/use-intersection-observer';
    import { providePreviewContext, type GroupImage } from './context';
    import { previewDefaults } from './defaults';
    import type { ImagePreviewComponentProps, ImagePreviewEmits, ImagePreviewSlots } from './interface';
    import PreviewInner from './preview-inner.vue';

    interface PreviewState extends PreviewBaseState {
        visible: boolean;
        currentIndex: number;
        images: GroupImage[];
    }

    type Foundation = PreviewFoundation<ImagePreviewComponentProps, PreviewState>;
    type Adapter = PreviewAdapter<ImagePreviewComponentProps, PreviewState>;

    const props = withDefaults(defineProps<ImagePreviewComponentProps & /* @vue-ignore */ ElementProps<'div', keyof ImagePreviewComponentProps | EmitHandlers<ImagePreviewEmits>>>(), {
        src: () => semiDefault('ImagePreview', 'src', []),
        visible: semiGlobalDefault('ImagePreview', 'visible'),
        defaultVisible: semiGlobalDefault('ImagePreview', 'defaultVisible'),
        currentIndex: semiGlobalDefault('ImagePreview', 'currentIndex'),
        defaultCurrentIndex: semiGlobalDefault('ImagePreview', 'defaultCurrentIndex'),
        previewTitle: semiGlobalDefault('ImagePreview', 'previewTitle'),
        lazyLoad: () => semiDefault('ImagePreview', 'lazyLoad', true),
        lazyLoadMargin: () => semiDefault('ImagePreview', 'lazyLoadMargin', '0px 100px 100px 0px'),
        maskClosable: () => semiDefault('ImagePreview', 'maskClosable', previewDefaults.maskClosable),
        closable: () => semiDefault('ImagePreview', 'closable', previewDefaults.closable),
        closeOnEsc: () => semiDefault('ImagePreview', 'closeOnEsc', previewDefaults.closeOnEsc),
        infinite: () => semiDefault('ImagePreview', 'infinite', previewDefaults.infinite),
        showTooltip: () => semiDefault('ImagePreview', 'showTooltip', previewDefaults.showTooltip),
        preLoad: () => semiDefault('ImagePreview', 'preLoad', previewDefaults.preLoad),
        preLoadGap: () => semiDefault('ImagePreview', 'preLoadGap', previewDefaults.preLoadGap),
        viewerVisibleDelay: () => semiDefault('ImagePreview', 'viewerVisibleDelay', previewDefaults.viewerVisibleDelay),
        zoomStep: () => semiDefault('ImagePreview', 'zoomStep', previewDefaults.zoomStep),
        maxZoom: () => semiDefault('ImagePreview', 'maxZoom', previewDefaults.maxZoom),
        minZoom: () => semiDefault('ImagePreview', 'minZoom', previewDefaults.minZoom),
        zIndex: () => semiDefault('ImagePreview', 'zIndex', previewDefaults.zIndex),
        disableDownload: () => semiDefault('ImagePreview', 'disableDownload', previewDefaults.disableDownload),
        initialZoom: semiGlobalDefault('ImagePreview', 'initialZoom'),
        crossOrigin: semiGlobalDefault('ImagePreview', 'crossOrigin'),
        previewCls: semiGlobalDefault('ImagePreview', 'previewCls'),
        previewStyle: semiGlobalDefault('ImagePreview', 'previewStyle'),
        prevTip: semiGlobalDefault('ImagePreview', 'prevTip'),
        nextTip: semiGlobalDefault('ImagePreview', 'nextTip'),
        zoomInTip: semiGlobalDefault('ImagePreview', 'zoomInTip'),
        zoomOutTip: semiGlobalDefault('ImagePreview', 'zoomOutTip'),
        rotateTip: semiGlobalDefault('ImagePreview', 'rotateTip'),
        downloadTip: semiGlobalDefault('ImagePreview', 'downloadTip'),
        adaptiveTip: semiGlobalDefault('ImagePreview', 'adaptiveTip'),
        originTip: semiGlobalDefault('ImagePreview', 'originTip'),
        getPopupContainer: undefined,
        setDownloadName: undefined,
    });

    const emit = defineEmits<ImagePreviewEmits>();
    const slots = defineSlots<ImagePreviewSlots>();

    const semi = useSemiGlobal();

    const groupEl = useTemplateRef('group');

    const { foundation, state } = useFoundation<Foundation, Adapter, ImagePreviewComponentProps, PreviewState>(
        PreviewFoundation,
        props,
        (view) => ({
            currentIndex: view.currentIndex || view.defaultCurrentIndex || 0,
            visible: view.visible || view.defaultVisible || false,
            images: [],
        }),
        () => ({
            notifyVisibleChange: (visible) => {
                emit('update:visible', visible);
                emit('visibleChange', visible);
            },
            notifyChange: (index) => {
                emit('update:currentIndex', index);
                emit('change', index);
            },
        })
    );

    const innerKeys = [
        'previewTitle',
        'maskClosable',
        'closable',
        'zoomStep',
        'infinite',
        'showTooltip',
        'closeOnEsc',
        'prevTip',
        'nextTip',
        'zoomInTip',
        'zoomOutTip',
        'rotateTip',
        'downloadTip',
        'adaptiveTip',
        'originTip',
        'preLoad',
        'preLoadGap',
        'viewerVisibleDelay',
        'disableDownload',
        'zIndex',
        'crossOrigin',
        'maxZoom',
        'minZoom',
        'initialZoom',
        'previewCls',
        'previewStyle',
    ] as const satisfies readonly (keyof ImagePreviewComponentProps)[];

    const prefixCls = cssClasses.PREFIX;
    const getPopupContainer = computed(() => props.getPopupContainer ?? readSemiDefault(semi, 'ImagePreview', 'getPopupContainer'));
    const setDownloadName = computed(() => props.setDownloadName ?? readSemiDefault(semi, 'ImagePreview', 'setDownloadName'));
    const currentIndex = computed(() => (props.currentIndex === undefined ? state.value.currentIndex : props.currentIndex));
    const visible = computed(() => (props.visible === undefined ? state.value.visible : props.visible));
    const list = computed(() => getGroupPreviewList(props.src, state.value.images));

    providePreviewContext({
        view: computed(() => ({
            lazyLoad: props.lazyLoad,
            titles: list.value.titles,
            alts: list.value.alts,
            setDownloadName: setDownloadName.value,
        })),
        setCurrentIndex: foundation.handleCurrentIndexChange,
        registerImage: foundation.registerImage,
        unregisterImage: foundation.unregisterImage,
        openImage: foundation.openImage,
    });

    // the default slot is the group's content, not a preview slot
    const passedSlots = () => Object.keys(slots).filter((name) => name !== 'default');

    onUpdated(() => foundation.syncImageOrder());

    // A lazy img gets its src from the observer. The getter reads the whole state, so every state change observes the
    // thumbnails again, which a new images list needs even when its img elements stay. The viewport is the root, so a
    // group that does not scroll itself still lazy-loads.
    useIntersectionObserver(
        () => (props.lazyLoad && state.value.images.length ? [...(groupEl.value?.querySelectorAll(`.${prefixCls}-img`) ?? [])] : []),
        loadLazyImages,
        () => ({ root: null, rootMargin: props.lazyLoadMargin })
    );
</script>

<template>
    <div ref="group" :class="`${prefixCls}-preview-group`" :role="groupRole($attrs)">
        <slot />
        <!-- inside the group element to keep one root; its content is teleported out -->
        <PreviewInner
            v-bind="pick(props, innerKeys)"
            :currentIndex="currentIndex"
            :getPopupContainer="getPopupContainer"
            :src="list.srcList"
            :visible="Boolean(visible)"
            @close="emit('close')"
            @download="(...args) => emit('download', ...args)"
            @downloadError="(...args) => emit('downloadError', ...args)"
            @next="(...args) => emit('next', ...args)"
            @prev="(...args) => emit('prev', ...args)"
            @ratioChange="(...args) => emit('ratioChange', ...args)"
            @rotateLeft="(...args) => emit('rotateLeft', ...args)"
            @visibleChange="foundation.handleVisibleChange"
            @zoomIn="(...args) => emit('zoomIn', ...args)"
            @zoomOut="(...args) => emit('zoomOut', ...args)"
        >
            <template v-for="name in passedSlots()" #[name]="scope">
                <slot :name="name as keyof ImagePreviewSlots" v-bind="scope" />
            </template>
        </PreviewInner>
    </div>
</template>
