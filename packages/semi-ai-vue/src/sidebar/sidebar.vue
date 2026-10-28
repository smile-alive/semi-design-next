<script setup lang="ts">
    import { computed, onBeforeUnmount, useTemplateRef, watch } from 'vue';
    import { cssClasses, strings } from '@fibrae/semi-ai-foundation/sidebar/constants';
    import { focusAfterModeChange } from '@fibrae/semi-ai-foundation/sidebar/utils';
    import { copyText } from '@fibrae/semi-foundation/utils/clipboard';
    import { IconClose, IconCopyStroked } from '@fibrae/semi-icons-vue';
    import type { ElementProps, EmitHandlers } from '@fibrae/semi-ui-vue/_base/element-props';
    import semiDefault, { semiGlobalDefault } from '@fibrae/semi-ui-vue/_base/semi-default';
    import { hasSlotContent } from '@fibrae/semi-ui-vue/_base/slot-nodes';
    import Button from '@fibrae/semi-ui-vue/button/index';
    import { useLocale } from '@fibrae/semi-ui-vue/hooks';
    import { ToastFactory } from '@fibrae/semi-ui-vue/toast/index';
    import pickContainerProps from './container/container-props';
    import Container from './container/container.vue';
    import type { ContainerHandle } from './container/interface';
    import type { SideBarEmits, SideBarOption, SideBarProps, SideBarSlots } from './interface';
    import CodeItem from './widget/code-item.vue';
    import FileItem from './widget/file-item.vue';

    defineOptions({ name: 'Sidebar' });

    const props = withDefaults(defineProps<SideBarProps & /* @vue-ignore */ ElementProps<'div', keyof SideBarProps | EmitHandlers<SideBarEmits>>>(), {
        visible: semiGlobalDefault('Sidebar', 'visible'),
        title: semiGlobalDefault('Sidebar', 'title'),
        motion: semiGlobalDefault('Sidebar', 'motion'),
        resizable: semiGlobalDefault('Sidebar', 'resizable'),
        minWidth: semiGlobalDefault('Sidebar', 'minWidth'),
        maxWidth: semiGlobalDefault('Sidebar', 'maxWidth'),
        defaultSize: semiGlobalDefault('Sidebar', 'defaultSize'),
        showClose: semiGlobalDefault('Sidebar', 'showClose'),
        closeOnEsc: semiGlobalDefault('Sidebar', 'closeOnEsc'),
        mode: () => semiDefault('Sidebar', 'mode', strings.MODE.MAIN),
        activeKey: semiGlobalDefault('Sidebar', 'activeKey'),
        options: semiGlobalDefault('Sidebar', 'options'),
        detailContent: semiGlobalDefault('Sidebar', 'detailContent'),
        fileEditable: () => semiDefault('Sidebar', 'fileEditable', true),
        imgUploadProps: semiGlobalDefault('Sidebar', 'imgUploadProps'),
    });

    const emit = defineEmits<SideBarEmits>();
    defineSlots<SideBarSlots>();

    const locale = useLocale('Sidebar');

    const container = useTemplateRef('container');

    const prefix = cssClasses.SIDEBAR;
    const optionsCls = cssClasses.OPTIONS;
    const isMain = computed(() => props.mode === strings.MODE.MAIN);

    const detailItem = computed(() => {
        const { key: _key, ...item } = props.detailContent ?? {};
        return item;
    });

    // The container element is replaced on each hide and show; a toast list left behind would stay in the detached one.
    const toast = ToastFactory.create({ getPopupContainer: () => container.value?.root as HTMLElement });

    const onAfterVisibleChange = (visible: boolean) => {
        if (!visible) {
            toast.destroyAll();
        }
        emit('afterVisibleChange', visible);
    };

    const selectOption = (event: MouseEvent, option: SideBarOption) => {
        emit('update:activeKey', option.key);
        emit('activeOptionChange', event, option.key);
    };

    const optionClick = (option: SideBarOption) => (event: MouseEvent) => selectOption(event, option);

    const copyDetail = (event: MouseEvent) => {
        const content = props.detailContent?.content as string;
        void copyText(content).then((copied) => {
            // hidden while the clipboard write was pending
            if (copied && container.value?.root) {
                toast.success(locale.value.locale.copySuccess);
            }
            emit('detailContentCopy', event, content, copied);
        });
    };

    watch(
        () => props.mode,
        (mode) => focusAfterModeChange(container.value?.root as HTMLElement | null, mode === strings.MODE.MAIN),
        { flush: 'post' }
    );

    onBeforeUnmount(() => toast.destroyAll());

    defineExpose<ContainerHandle>({
        get root() {
            return container.value?.root ?? null;
        },
    });
</script>

<template>
    <Container ref="container" v-bind="pickContainerProps(props)" :class="isMain ? `${prefix}-main` : `${prefix}-detail`" :title="isMain ? props.title : undefined" @afterVisibleChange="onAfterVisibleChange" @cancel="(...args) => emit('cancel', ...args)" @update:visible="(...args) => emit('update:visible', ...args)">
        <template v-if="isMain && $slots.title" #title>
            <slot name="title" />
        </template>
        <template v-if="!isMain" #header>
            <slot v-if="hasSlotContent(() => $slots.detailHeader?.({ mode: props.mode, detailContent: props.detailContent }) ?? [])" :detailContent="props.detailContent" :mode="props.mode" name="detailHeader" />
            <div v-else :class="`${prefix}-detail-header`">
                <span :class="`${prefix}-detail-header-left`">
                    <Button :aria-label="locale.locale.close" theme="borderless" type="tertiary" @click="emit('backWard', $event, strings.MODE.MAIN)">
                        <template #icon>
                            <IconClose />
                        </template>
                    </Button>
                    <span :class="`${prefix}-detail-header-title`">{{ props.detailContent?.name }}</span>
                </span>
                <span :class="`${prefix}-detail-header-right`">
                    <Button v-if="typeof props.detailContent?.content === 'string'" :aria-label="locale.locale.copy" theme="borderless" type="tertiary" @click="copyDetail">
                        <template #icon>
                            <IconCopyStroked />
                        </template>
                    </Button>
                </span>
            </div>
        </template>

        <div v-if="isMain" :class="`${prefix}-main-content-wrapper`">
            <div :class="optionsCls">
                <template v-for="(option, index) in props.options" :key="option.key">
                    <slot v-if="$slots.optionItem" :active="props.activeKey === option.key" :index="index" :item="option" name="optionItem" :onClick="optionClick(option)" />
                    <Button
                        v-else
                        :aria-pressed="props.activeKey === option.key"
                        :class="[
                            `${optionsCls}-button`,
                            {
                                [`${optionsCls}-normal`]: props.activeKey !== option.key,
                            },
                        ]"
                        @click="selectOption($event, option)"
                    >
                        <template v-if="$slots.optionIcon" #icon>
                            <slot :index="index" :item="option" name="optionIcon" />
                        </template>
                        <template #default>{{ option.name }}</template>
                    </Button>
                </template>
            </div>
            <div :class="`${prefix}-main-content`">
                <slot :activeKey="props.activeKey" name="mainContent" />
            </div>
        </div>
        <slot v-else-if="hasSlotContent(() => $slots.detailContent?.({ mode: props.mode }) ?? [])" :mode="props.mode" name="detailContent" />
        <!-- keyed by the item so another item remounts the editor; the mode prefix keeps v-if branch keys unique -->
        <CodeItem v-else-if="props.mode === strings.MODE.CODE" :key="`code-${props.detailContent?.key}`" v-bind="detailItem">
            <template v-if="$slots.customRender" #customRender="slotProps">
                <slot name="customRender" v-bind="slotProps" />
            </template>
            <template v-if="$slots.searchButton" #searchButton="slotProps">
                <slot name="searchButton" v-bind="slotProps" />
            </template>
        </CodeItem>
        <FileItem v-else-if="props.mode === strings.MODE.FILE" :key="`file-${props.detailContent?.key}`" v-bind="detailItem" :editable="props.fileEditable" :imgUploadProps="props.imgUploadProps" @contentChange="emit('fileContentChange', $event)" />
    </Container>
</template>
