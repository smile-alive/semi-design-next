<script setup lang="ts">
    import { shallowRef, useTemplateRef } from 'vue';
    import { addAreaObservedAttributes, containsControl, containsName } from '@fibrae/semi-foundation/components/upload/utils';
    import useMutationObserver from '../../composables/use-mutation-observer';
    import useLocale from '../locale/use-locale';

    /** `describedby` describes the area only while it is the button; a slotted control is out of its reach */
    const props = defineProps<{ disabled: boolean; tabindex?: number | string; describedby?: string }>();
    const emit = defineEmits<{ open: [] }>();

    // A control inside a button is invalid nesting with two Tab stops, so a slotted control becomes the button and its
    // click bubbles up. Watched while mounted since the slot may change at any time.
    const hasControl = defineModel<boolean>('hasControl', { default: false });

    const i18n = useLocale('Upload');

    const root = useTemplateRef('root');
    const hasName = shallowRef(true);

    const onKeydown = (e: KeyboardEvent) => {
        if (hasControl.value) return;
        e.preventDefault(); // Space would otherwise scroll the page
        emit('open');
    };

    useMutationObserver(
        root,
        () => {
            const node = root.value as HTMLDivElement;
            hasControl.value = containsControl(node);
            hasName.value = containsName(node);
        },
        { subtree: true, childList: true, characterData: true, attributeFilter: addAreaObservedAttributes }
    );
</script>

<template>
    <div
        ref="root"
        :aria-describedby="hasControl ? undefined : props.describedby"
        :aria-disabled="hasControl ? undefined : props.disabled"
        :aria-label="hasControl || hasName ? undefined : i18n.locale.upload"
        :role="hasControl ? undefined : 'button'"
        :tabindex="hasControl ? undefined : (props.tabindex ?? 0)"
        @click="emit('open')"
        @keydown.self.enter.space="onKeydown"
    >
        <slot />
    </div>
</template>
