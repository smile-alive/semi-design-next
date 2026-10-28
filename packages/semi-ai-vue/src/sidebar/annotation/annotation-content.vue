<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/sidebar/constants';
    import { IconBookOpenStroked } from '@fibrae/semi-icons-vue';
    import type { ElementProps, EmitHandlers } from '@fibrae/semi-ui-vue/_base/element-props';
    import Collapse, { CollapsePanel } from '@fibrae/semi-ui-vue/collapse/index';
    import AnnotationItemView from './annotation-item.vue';
    import type { AnnotationContentEmits, AnnotationContentProps, AnnotationContentSlots } from './interface';

    const props = withDefaults(defineProps<AnnotationContentProps & /* @vue-ignore */ ElementProps<'div', keyof AnnotationContentProps | EmitHandlers<AnnotationContentEmits>>>(), { activeKey: undefined, info: () => [] });
    const emit = defineEmits<AnnotationContentEmits>();
    defineSlots<AnnotationContentSlots>();

    const collapseCls = cssClasses.COLLAPSE;
    const annotationCls = cssClasses.ANNOTATION;

    const onChange = (activeKey: string[]) => {
        emit('update:activeKey', activeKey);
        emit('change', activeKey);
    };
</script>

<template>
    <Collapse :activeKey="props.activeKey" :class="collapseCls" :clickHeaderToExpand="false" @change="onChange">
        <CollapsePanel v-for="(info, infoIndex) in props.info" :key="info.key" :itemKey="info.key">
            <template #header>
                <!-- a span: Collapse renders the header inside its toggle button -->
                <span :class="`${collapseCls}-header-content`">
                    <IconBookOpenStroked />
                    <slot :index="infoIndex" :item="info" name="header">{{ info.header }}</slot>
                </span>
            </template>
            <div :class="`${annotationCls}-content`">
                <template v-for="(cite, index) in info.annotations" :key="index">
                    <slot v-if="$slots.item" :index="index" :item="cite" name="item" />
                    <AnnotationItemView v-else :item="cite" @click="emit('click', $event, cite)" />
                </template>
            </div>
        </CollapsePanel>
    </Collapse>
</template>
