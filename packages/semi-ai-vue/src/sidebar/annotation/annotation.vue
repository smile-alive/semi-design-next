<script setup lang="ts">
    import { useTemplateRef } from 'vue';
    import { cssClasses } from '@fibrae/semi-ai-foundation/sidebar/constants';
    import type { ElementProps, EmitHandlers } from '@fibrae/semi-ui-vue/_base/element-props';
    import { semiGlobalDefault } from '@fibrae/semi-ui-vue/_base/semi-default';
    import { useLocale } from '@fibrae/semi-ui-vue/hooks';
    import pickContainerProps from '../container/container-props';
    import Container from '../container/container.vue';
    import type { ContainerHandle } from '../container/interface';
    import AnnotationContent from './annotation-content.vue';
    import type { AnnotationEmits, AnnotationProps, AnnotationSlots } from './interface';

    defineOptions({ name: 'Annotation' });

    const props = withDefaults(defineProps<AnnotationProps & /* @vue-ignore */ ElementProps<'div', keyof AnnotationProps | EmitHandlers<AnnotationEmits>>>(), {
        visible: semiGlobalDefault('Annotation', 'visible'),
        title: semiGlobalDefault('Annotation', 'title'),
        motion: semiGlobalDefault('Annotation', 'motion'),
        resizable: semiGlobalDefault('Annotation', 'resizable'),
        minWidth: semiGlobalDefault('Annotation', 'minWidth'),
        maxWidth: semiGlobalDefault('Annotation', 'maxWidth'),
        defaultSize: semiGlobalDefault('Annotation', 'defaultSize'),
        showClose: semiGlobalDefault('Annotation', 'showClose'),
        closeOnEsc: semiGlobalDefault('Annotation', 'closeOnEsc'),
        activeKey: semiGlobalDefault('Annotation', 'activeKey'),
        info: semiGlobalDefault('Annotation', 'info'),
    });

    const emit = defineEmits<AnnotationEmits>();
    defineSlots<AnnotationSlots>();

    const locale = useLocale('Sidebar');

    const container = useTemplateRef('container');

    defineExpose<ContainerHandle>({
        get root() {
            return container.value?.root ?? null;
        },
    });
</script>

<template>
    <Container
        ref="container"
        v-bind="pickContainerProps(props)"
        :class="cssClasses.ANNOTATION"
        :title="props.title ?? locale.locale.annotationTitle"
        @afterVisibleChange="(...args) => emit('afterVisibleChange', ...args)"
        @cancel="(...args) => emit('cancel', ...args)"
        @update:visible="(...args) => emit('update:visible', ...args)"
    >
        <template v-if="$slots.title" #title>
            <slot name="title" />
        </template>
        <template v-if="$slots.header" #header>
            <slot name="header" />
        </template>
        <AnnotationContent :activeKey="props.activeKey" :info="props.info" @change="(...args) => emit('change', ...args)" @click="(...args) => emit('click', ...args)" @update:activeKey="(...args) => emit('update:activeKey', ...args)">
            <template v-if="$slots.infoHeader" #header="scope">
                <slot name="infoHeader" v-bind="scope" />
            </template>
            <template v-if="$slots.item" #item="scope">
                <slot name="item" v-bind="scope" />
            </template>
        </AnnotationContent>
    </Container>
</template>
