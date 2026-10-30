<script lang="ts">
    import Anchor from '../anchor.svelte';
    import { nested } from './fixture-data';

    const { scrollMotion = false, targetOffset = 0, fixedBar = false }: { scrollMotion?: boolean; targetOffset?: number; fixedBar?: boolean } = $props();

    const getContainer = () => document.getElementById('box');
</script>

<div>
    <Anchor {getContainer} links={nested} {scrollMotion} style={`position: absolute; right: 0; ${fixedBar ? 'top: 100px' : ''}`} {targetOffset} />
    <div id="box" style={`height: 500px; overflow: scroll; ${fixedBar ? 'border: 1px solid #eee' : ''}`}>
        {#if fixedBar}
            <div style="position: fixed; border: 1px solid red; height: 100px; width: 100%">这是 fixed 的一段话</div>
            <h1 style="height: 300px">whatever</h1>
        {/if}
        <h1 id="welcome" style="height: 300px">Welcome</h1>
        <h1 id="api" style="height: 300px">API</h1>
        <h2 id="docs" style="height: 200px">Docs</h2>
        <h3 id="doc1" style="height: 100px">Doc1</h3>
        <h3 id="doc2" style="height: 100px">Doc2</h3>
        <h1 id="contact" style="height: 300px">Contact me</h1>
    </div>
</div>
