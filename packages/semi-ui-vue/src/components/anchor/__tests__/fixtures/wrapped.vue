<script setup lang="ts">
    import AnchorLink from '../../anchor-link.vue';
    import Anchor from '../../anchor.vue';

    withDefaults(defineProps<{ shown?: boolean }>(), { shown: true });
</script>

<template>
    <Anchor autoCollapse>
        <template v-if="shown">
            <AnchorLink href="#p" title="p">
                <div class="group">
                    <AnchorLink href="#c1" title="c1" />
                    <AnchorLink href="#c2" title="c2" />
                </div>
            </AnchorLink>
            <AnchorLink href="#q" title="q" />
        </template>
    </Anchor>
</template>
