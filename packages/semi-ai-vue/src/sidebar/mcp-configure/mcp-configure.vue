<script setup lang="ts">
    import { computed, useTemplateRef } from 'vue';
    import type { ElementProps, EmitHandlers } from '@fibrae/semi-ui-vue/_base/element-props';
    import { readSemiDefault, semiGlobalDefault, useSemiGlobal } from '@fibrae/semi-ui-vue/_base/semi-default';
    import { useLocale } from '@fibrae/semi-ui-vue/hooks';
    import pickContainerProps from '../container/container-props';
    import Container from '../container/container.vue';
    import type { ContainerHandle } from '../container/interface';
    import type { MCPConfigureEmits, MCPConfigureProps, MCPConfigureSlots } from './interface';
    import MCPConfigureContent from './mcp-configure-content.vue';

    defineOptions({ name: 'MCPConfigure' });

    const props = withDefaults(defineProps<MCPConfigureProps & /* @vue-ignore */ ElementProps<'div', keyof MCPConfigureProps | EmitHandlers<MCPConfigureEmits>>>(), {
        visible: semiGlobalDefault('MCPConfigure', 'visible'),
        title: semiGlobalDefault('MCPConfigure', 'title'),
        motion: semiGlobalDefault('MCPConfigure', 'motion'),
        resizable: semiGlobalDefault('MCPConfigure', 'resizable'),
        minWidth: semiGlobalDefault('MCPConfigure', 'minWidth'),
        maxWidth: semiGlobalDefault('MCPConfigure', 'maxWidth'),
        defaultSize: semiGlobalDefault('MCPConfigure', 'defaultSize'),
        showClose: semiGlobalDefault('MCPConfigure', 'showClose'),
        closeOnEsc: semiGlobalDefault('MCPConfigure', 'closeOnEsc'),
        options: semiGlobalDefault('MCPConfigure', 'options'),
        customOptions: semiGlobalDefault('MCPConfigure', 'customOptions'),
        filter: undefined,
        placeholder: semiGlobalDefault('MCPConfigure', 'placeholder'),
    });

    const emit = defineEmits<MCPConfigureEmits>();
    defineSlots<MCPConfigureSlots>();

    const semi = useSemiGlobal();
    const locale = useLocale('Sidebar');

    const container = useTemplateRef('container');

    // A function prop cannot take a factory default, so the global one is read here
    const filter = computed(() => props.filter ?? readSemiDefault(semi, 'MCPConfigure', 'filter'));

    defineExpose<ContainerHandle>({
        get root() {
            return container.value?.root ?? null;
        },
    });
</script>

<template>
    <Container ref="container" v-bind="pickContainerProps(props)" :title="props.title ?? locale.locale.mcpConfigure" @afterVisibleChange="(...args) => emit('afterVisibleChange', ...args)" @cancel="(...args) => emit('cancel', ...args)" @update:visible="(...args) => emit('update:visible', ...args)">
        <template v-if="$slots.title" #title>
            <slot name="title" />
        </template>
        <template v-if="$slots.header" #header>
            <slot name="header" />
        </template>
        <MCPConfigureContent
            :customOptions="props.customOptions"
            :filter="filter"
            :options="props.options"
            :placeholder="props.placeholder"
            @addClick="(...args) => emit('addClick', ...args)"
            @configureClick="(...args) => emit('configureClick', ...args)"
            @editClick="(...args) => emit('editClick', ...args)"
            @search="(...args) => emit('search', ...args)"
            @statusChange="(...args) => emit('statusChange', ...args)"
            @update:customOptions="(...args) => emit('update:customOptions', ...args)"
            @update:options="(...args) => emit('update:options', ...args)"
        >
            <template v-if="$slots.icon" #icon="scope">
                <slot name="icon" v-bind="scope" />
            </template>
            <template v-if="$slots.desc" #desc="scope">
                <slot name="desc" v-bind="scope" />
            </template>
            <template v-if="$slots.item" #item="scope">
                <slot name="item" v-bind="scope" />
            </template>
        </MCPConfigureContent>
    </Container>
</template>
