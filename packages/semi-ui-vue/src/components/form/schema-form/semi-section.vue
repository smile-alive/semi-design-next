<script setup lang="ts">
    import { computed, type VNode } from 'vue';
    import type { SchemaFieldNode } from '@fibrae/semi-foundation/components/form/json-schema';
    import { formatLocale } from '@fibrae/semi-foundation/locale';
    import useLocale from '../../locale/use-locale';
    import FormSection from '../section.vue';

    // The root renders no Section (the Form already is its group), so attrs go to the Section alone
    defineOptions({ inheritAttrs: false });
    const props = defineProps<{ node: SchemaFieldNode }>();
    defineSlots<{ default?: () => VNode[] }>();

    const locale = useLocale('Form');

    const text = computed(() => props.node.title ?? formatLocale(locale.value.locale.item, { index: (props.node.item?.index ?? 0) + 1 }));
</script>

<template>
    <slot v-if="props.node.field === ''" />
    <FormSection v-else v-bind="$attrs">
        <template #text>
            {{ text }}
        </template>
        <template v-if="props.node.description" #extraText>
            {{ props.node.description }}
        </template>
        <slot />
    </FormSection>
</template>
