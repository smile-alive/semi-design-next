<script setup lang="ts">
    import { useTooltipDescription } from '../tooltip/context';
    import type { DecorationTag } from './internal';

    // An explicit name makes the recursive <Decorate> resolve to itself before a same-named component of the app
    defineOptions({ name: 'Decorate' });
    const props = defineProps<{ tags: DecorationTag[] }>();

    const description = useTooltipDescription();
</script>

<template>
    <component :is="props.tags[0].tag" v-if="props.tags.length" :aria-describedby="props.tags[0].tag === 'a' ? description : undefined" v-bind="props.tags[0].attrs">
        <Decorate :tags="props.tags.slice(1)">
            <slot />
        </Decorate>
    </component>
    <slot v-else />
</template>
