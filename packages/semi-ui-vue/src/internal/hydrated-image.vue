<script setup lang="ts">
    import { getCurrentInstance, nextTick, onMounted, useTemplateRef } from 'vue';

    // An `<img>` that reports an outcome it missed. Vue attaches load and error listeners while hydrating, after the
    // browser may already have settled the image from the server HTML, so that outcome never reaches the handlers; it is
    // replayed on the element. A client-rendered img gets its src after mount setup and fires as usual, so only a
    // hydrating instance replays: `vnode.el` is already the server node when setup runs, a client render has none yet.
    // shortcut: an image whose load task is still queued when `complete` turns true reports twice, once here and once
    // from the queued event; drop this component once Vue replays load and error for hydrated images itself.

    const props = defineProps<{ alt?: string }>();

    const img = useTemplateRef('img');

    if (getCurrentInstance()?.vnode.el != null) {
        // A child mounts before its parent, and the parent's foundation inits in its own onMounted; wait for it.
        onMounted(async () => {
            await nextTick();
            const el = img.value;
            if (el?.src && el.complete) {
                el.dispatchEvent(new Event(el.naturalWidth > 0 ? 'load' : 'error'));
            }
        });
    }
</script>

<template>
    <img ref="img" :alt="props.alt" />
</template>
