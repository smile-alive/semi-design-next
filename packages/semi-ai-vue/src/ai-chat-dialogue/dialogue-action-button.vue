<script setup lang="ts">
    import { computed } from 'vue';
    import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
    import { IconCopyStroked, IconEditStroked, IconLikeThumb, IconRedoStroked, IconShareStroked, IconThumbUpStroked } from '@fibrae/semi-icons-vue';
    import Button from '@fibrae/semi-ui-vue/button/index';
    import { useLocale } from '@fibrae/semi-ui-vue/hooks';

    const props = withDefaults(defineProps<{ kind: 'copy' | 'reset' | 'share' | 'edit' | 'like' | 'dislike'; active?: boolean }>(), { active: false });

    const locale = useLocale('AIChatDialogue');

    const { PREFIX_ACTION } = cssClasses;

    const LABELS = {
        copy: 'copy',
        reset: 'regenerate',
        share: 'share',
        edit: 'edit',
        like: 'like',
        dislike: 'dislike',
    } as const;

    const toggle = computed(() => props.kind === 'like' || props.kind === 'dislike');

    const icon = computed(() => {
        switch (props.kind) {
            case 'copy':
                return { is: IconCopyStroked };
            case 'reset':
                return { is: IconRedoStroked, class: `${PREFIX_ACTION}-icon-redo` };
            case 'share':
                return { is: IconShareStroked };
            case 'edit':
                return { is: IconEditStroked };
            default:
                return {
                    is: props.active ? IconLikeThumb : IconThumbUpStroked,
                    class: props.kind === 'dislike' ? `${PREFIX_ACTION}-icon-flip` : undefined,
                };
        }
    });
</script>

<template>
    <Button :aria-label="locale.locale[LABELS[props.kind]]" :aria-pressed="toggle ? props.active : undefined" :class="`${PREFIX_ACTION}-btn`" theme="borderless" type="tertiary">
        <template #icon>
            <component :is="icon.is" :class="icon.class" />
        </template>
    </Button>
</template>
