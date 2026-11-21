<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/components/sidebar/constants';
    import { IconBookOpenStroked } from '@fibrae/semi-icons-vue';
    import type { ElementProps, EmitHandlers } from '@fibrae/semi-ui-vue/base';
    import Collapse, { CollapsePanel } from '@fibrae/semi-ui-vue/collapse/index';
    import AnnotationItemView from './annotation-item.vue';
    import type { AnnotationContentEmits, AnnotationContentProps, AnnotationContentSlots } from './interface';

    const props = withDefaults(defineProps<AnnotationContentProps & /* @vue-ignore */ ElementProps<'div', keyof AnnotationContentProps | EmitHandlers<AnnotationContentEmits>>>(), { activeKey: undefined, classNames: undefined, info: () => [], styles: undefined });
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
                <span :class="[`${collapseCls}-header-content`, props.classNames?.groupHeader]" :style="props.styles?.groupHeader">
                    <IconBookOpenStroked />
                    <slot :index="infoIndex" :item="info" name="header">{{ info.header }}</slot>
                </span>
            </template>
            <div :class="[`${annotationCls}-content`, props.classNames?.groupContent]" :style="props.styles?.groupContent">
                <template v-for="(cite, index) in info.annotations" :key="index">
                    <slot v-if="$slots.item" :index="index" :item="cite" name="item" />
                    <AnnotationItemView v-else :classNames="props.classNames" :item="cite" :styles="props.styles" @click="emit('click', $event, cite)" />
                </template>
            </div>
        </CollapsePanel>
    </Collapse>
</template>
