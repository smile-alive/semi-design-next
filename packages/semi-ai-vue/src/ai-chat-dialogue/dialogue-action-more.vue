<script setup lang="ts">
    import { useTemplateRef } from 'vue';
    import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
    import { IconDeleteStroked, IconMoreStroked } from '@fibrae/semi-icons-vue';
    import Button from '@fibrae/semi-ui-vue/button/index';
    import Dropdown, { DropdownItem, DropdownMenu } from '@fibrae/semi-ui-vue/dropdown/index';
    import { useClickOutside, useLocale } from '@fibrae/semi-ui-vue/hooks';
    import { useNestedPopups } from '@fibrae/semi-ui-vue/tooltip/context';

    const props = defineProps<{ visible: boolean }>();

    // delete carries the trigger: the confirm dialog hands focus back near it once the deleted message is gone
    const emit = defineEmits<{ show: []; hide: []; delete: [trigger: HTMLElement | undefined] }>();

    const locale = useLocale('AIChatDialogue');

    const trigger = useTemplateRef('trigger');

    const { PREFIX_ACTION } = cssClasses;

    useClickOutside(
        [() => trigger.value?.$el],
        () => emit('hide'),
        () => props.visible,
        useNestedPopups()
    );
</script>

<template>
    <Dropdown :class="`${PREFIX_ACTION}-dropdown`" position="bottomLeft" :spacing="12" stopPropagation trigger="custom" :visible="props.visible" @escKeyDown="emit('hide')">
        <Button ref="trigger" :aria-label="locale.locale.more" theme="borderless" type="tertiary" @click="emit('show')">
            <template #icon>
                <IconMoreStroked />
            </template>
        </Button>
        <template #content>
            <DropdownMenu>
                <DropdownItem @click="emit('delete', trigger?.$el)"><IconDeleteStroked /> {{ locale.locale.delete }}</DropdownItem>
            </DropdownMenu>
        </template>
    </Dropdown>
</template>
