<script lang="ts">
    import Anchor from '../anchor.svelte';
    import { flat } from './fixture-data';

    const getContainer = () => document.getElementById('box');
</script>

<div data-testid="outer" style="width: 300px; height: 500px; position: relative; overflow-y: scroll">
    <Anchor {getContainer} links={flat('welcome', 'docs', 'contact')} scrollMotion style="position: absolute; right: 0" />
    <div id="box" style="height: 700px; overflow-y: scroll">
        <h1 id="welcome" style="height: 300px; margin: 0">Welcome</h1>
        <h2 id="docs" style="height: 200px; margin: 0">Docs</h2>
        <h1 id="contact" style="height: 600px; margin: 0">Contact me</h1>
    </div>
</div>
