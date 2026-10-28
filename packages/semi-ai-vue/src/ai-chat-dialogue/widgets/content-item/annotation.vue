<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
    import { IconChevronRight } from '@fibrae/semi-icons-vue';
    import type { ElementProps, EmitHandlers } from '@fibrae/semi-ui-vue/_base/element-props';
    import Avatar, { AvatarGroup } from '@fibrae/semi-ui-vue/avatar/index';
    import { useLocale } from '@fibrae/semi-ui-vue/hooks';
    import type { AnnotationItemProps, AnnotationWidgetEmits, AnnotationWidgetProps } from '../../interface';

    const props = defineProps<AnnotationWidgetProps & /* @vue-ignore */ ElementProps<'div', keyof AnnotationWidgetProps | EmitHandlers<AnnotationWidgetEmits>>>();
    const emit = defineEmits<AnnotationWidgetEmits>();

    const locale = useLocale('AIChatDialogue');

    const prefixCls = cssClasses.PREFIX_ANNOTATION;

    const onClick = (e: MouseEvent | KeyboardEvent) => emit('click', e, props.annotation as AnnotationItemProps[]);
</script>

<template>
    <div :class="`${prefixCls}-wrapper`" role="button" tabindex="0" @click="onClick" @keydown.enter.space.prevent="onClick">
        <div :class="`${prefixCls}-content`">
            <AvatarGroup :maxCount="props.maxCount" overlapFrom="end" size="extra-extra-small">
                <template v-for="(item, index) in props.annotation as AnnotationItemProps[]" :key="index">
                    <Avatar v-if="item.logo" :alt="item.title" :class="`${prefixCls}-content-logo`" :src="item.logo" />
                </template>
                <template #more="{ restNumber }">
                    <Avatar :alt="locale.locale.more" :class="`${prefixCls}-content-logo-renderMore`" size="extra-extra-small">
                        {{ `+${restNumber}` }}
                    </Avatar>
                </template>
            </AvatarGroup>
            <div :class="`${prefixCls}-content-description`">
                {{ props.description || `${props.annotation.length} ${locale.locale.annotationText}` }}
            </div>
            <div :class="`${prefixCls}-content-icon`"><IconChevronRight /></div>
        </div>
    </div>
</template>
