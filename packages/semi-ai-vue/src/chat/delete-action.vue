<script setup lang="ts">
    import { onUnmounted, useTemplateRef } from 'vue';
    import { cssClasses } from '@fibrae/semi-ai-foundation/chat/constants';
    import { handoverFocus } from '@fibrae/semi-foundation/utils/focus-handover';
    import { IconDeleteStroked } from '@fibrae/semi-icons-vue';
    import Button from '@fibrae/semi-ui-vue/button/index';
    import { useLocale } from '@fibrae/semi-ui-vue/hooks';
    import Popconfirm from '@fibrae/semi-ui-vue/popconfirm/index';

    const props = defineProps<{ visible: boolean }>();
    const emit = defineEmits<{ show: []; hide: []; confirm: [] }>();

    const i18n = useLocale('Chat');

    const trigger = useTemplateRef('trigger');
    let leftFocus: { trigger: HTMLElement; container: HTMLElement | null } | undefined;

    const { PREFIX, PREFIX_CHAT_BOX_ACTION } = cssClasses;

    const onConfirm = () => {
        const el: HTMLElement | undefined = trigger.value?.$el;
        leftFocus = el && { trigger: el, container: el.closest<HTMLElement>(`.${PREFIX}-container`) };
        emit('confirm');
    };

    const onVisibleChange = (visible: boolean) => {
        if (!visible) {
            emit('hide');
        }
    };

    // A confirmed delete removes this message and its focused button; the message list takes the focus instead of the
    // body. Unmounted hooks run after the DOM is removed.
    onUnmounted(() => {
        if (leftFocus) {
            handoverFocus(leftFocus.trigger, leftFocus.container);
        }
    });
</script>

<template>
    <!-- trigger="custom" ignores Esc and outside clicks; confirm or cancel only report through visibleChange -->
    <Popconfirm position="top" :title="i18n.locale.deleteConfirm" trigger="custom" :visible="props.visible" @clickOutSide="emit('hide')" @confirm="onConfirm" @escKeyDown="emit('hide')" @visibleChange="onVisibleChange">
        <Button ref="trigger" :aria-label="i18n.locale.delete" :class="`${PREFIX_CHAT_BOX_ACTION}-btn`" theme="borderless" type="tertiary" @click="emit('show')">
            <template #icon>
                <IconDeleteStroked />
            </template>
        </Button>
    </Popconfirm>
</template>
