<script setup lang="ts">
    import { ref } from 'vue';
    import HotKeys from '../../index';

    defineProps<{ mode: 'basic' | 'combo' | 'target' }>();
    const count = ref(0);
    const onHotKey = () => {
        count.value++;
    };
    const getTarget = () => document.getElementById('test');
</script>

<template>
    <div>
        <HotKeys v-if="mode === 'basic'" :content="['Control', 'K']" :hotKeys="[HotKeys.Keys.Control, 'k']" @hotKey="onHotKey" />
        <template v-else-if="mode === 'combo'">
            <HotKeys :hotKeys="[HotKeys.Keys.Meta, HotKeys.Keys.Alt, 'k']" @hotKey="onHotKey" />
            <HotKeys :hotKeys="['Meta', 'Shift', 'k']" @hotKey="onHotKey" />
        </template>
        <template v-else>
            <input id="test" placeholder="test for target" />
            <HotKeys :getListenerTarget="getTarget" :hotKeys="['Meta', HotKeys.Keys.S]" @hotKey="onHotKey" />
        </template>
        <pre data-testid="pre">{{ count }}</pre>
    </div>
</template>
