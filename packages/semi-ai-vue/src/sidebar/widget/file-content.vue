<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/sidebar/constants';
    import { IconFullScreenStroked } from '@fibrae/semi-icons-vue';
    import type { ElementProps, EmitHandlers } from '@fibrae/semi-ui-vue/_base/element-props';
    import Button from '@fibrae/semi-ui-vue/button/index';
    import Collapse, { CollapsePanel } from '@fibrae/semi-ui-vue/collapse/index';
    import { useLocale } from '@fibrae/semi-ui-vue/hooks';
    import CollapseHeader from './collapse-header.vue';
    import FileItem from './file-item.vue';
    import type { FileContentEmits, FileContentProps } from './interface';
    import { useHasExpandListener } from './use-expand-listener';

    const props = withDefaults(defineProps<FileContentProps & /* @vue-ignore */ ElementProps<'div', keyof FileContentProps | EmitHandlers<FileContentEmits>>>(), { activeKey: undefined, files: () => [] });
    const emit = defineEmits<FileContentEmits>();

    const locale = useLocale('Sidebar');

    const hasExpandListener = useHasExpandListener();

    const collapseCls = cssClasses.COLLAPSE;

    const onChange = (activeKey: string[]) => {
        emit('update:activeKey', activeKey);
        emit('change', activeKey);
    };
</script>

<template>
    <Collapse :activeKey="props.activeKey" :class="[collapseCls, `${collapseCls}-file`]" :clickHeaderToExpand="false" @change="onChange">
        <CollapsePanel v-for="file in props.files" :key="file.key" :itemKey="file.key ?? ''">
            <template #header>
                <CollapseHeader mode="file" :name="file.name" />
            </template>
            <!-- the panel's extra sits beside the toggle button, not inside it -->
            <template v-if="hasExpandListener()" #extra>
                <Button :aria-label="locale.locale.expand" :class="`${collapseCls}-header-expand-btn`" theme="borderless" type="tertiary" @click="emit('expand', $event, file, 'file')">
                    <template #icon>
                        <IconFullScreenStroked />
                    </template>
                </Button>
            </template>
            <FileItem :content="file.content" :editable="false" :extensions="file.extensions" :imgUploadProps="file.imgUploadProps" :name="file.name" />
        </CollapsePanel>
    </Collapse>
</template>
