<script setup lang="ts">
    import AnchorLink from '../../anchor-link.vue';
    import Anchor from '../../anchor.vue';

    const getContainer = () => document.getElementById('box');
</script>

<template>
    <div data-testid="outer" :style="{ width: '300px', height: '500px', position: 'relative', overflowY: 'scroll' }">
        <Anchor :getContainer="getContainer" scrollMotion :style="{ position: 'absolute', right: 0 }">
            <AnchorLink href="#welcome" title="welcome" />
            <AnchorLink href="#docs" title="docs" />
            <AnchorLink href="#contact" title="contact" />
        </Anchor>
        <div id="box" :style="{ height: '700px', overflowY: 'scroll' }">
            <h1 id="welcome" :style="{ height: '300px', margin: 0 }">Welcome</h1>
            <h2 id="docs" :style="{ height: '200px', margin: 0 }">Docs</h2>
            <h1 id="contact" :style="{ height: '600px', margin: 0 }">Contact me</h1>
        </div>
    </div>
</template>
