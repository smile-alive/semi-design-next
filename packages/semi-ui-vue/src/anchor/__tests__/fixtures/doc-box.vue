<script setup lang="ts">
    import AnchorLink from '../../anchor-link.vue';
    import Anchor from '../../anchor.vue';

    withDefaults(defineProps<{ scrollMotion?: boolean; targetOffset?: number; fixedBar?: boolean }>(), {
        scrollMotion: false,
        targetOffset: 0,
        fixedBar: false,
    });
    const getContainer = () => document.getElementById('box');
</script>

<template>
    <div>
        <Anchor :getContainer="getContainer" :scrollMotion="scrollMotion" :style="{ position: 'absolute', right: 0, top: fixedBar ? '100px' : undefined }" :targetOffset="targetOffset">
            <AnchorLink href="#welcome" title="welcome" />
            <AnchorLink href="#api" title="api too much to show">
                <AnchorLink href="#docs" title="docs">
                    <AnchorLink href="#doc1" title="doc1" />
                    <AnchorLink href="#doc2" title="doc2" />
                </AnchorLink>
            </AnchorLink>
            <AnchorLink href="#contact" title="contact" />
        </Anchor>
        <div id="box" :style="{ height: '500px', overflow: 'scroll', border: fixedBar ? '1px solid #eee' : undefined }">
            <template v-if="fixedBar">
                <div :style="{ position: 'fixed', border: '1px solid red', height: '100px', width: '100%' }">这是 fixed 的一段话</div>
                <h1 :style="{ height: '300px' }">whatever</h1>
            </template>
            <h1 id="welcome" :style="{ height: '300px' }">Welcome</h1>
            <h1 id="api" :style="{ height: '300px' }">API</h1>
            <h2 id="docs" :style="{ height: '200px' }">Docs</h2>
            <h3 id="doc1" :style="{ height: '100px' }">Doc1</h3>
            <h3 id="doc2" :style="{ height: '100px' }">Doc2</h3>
            <h1 id="contact" :style="{ height: '300px' }">Contact me</h1>
        </div>
    </div>
</template>
