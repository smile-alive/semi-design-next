<script lang="ts">
    import Anchor from '../anchor.svelte';
</script>

<Anchor links={[{ href: '#shadow-target', title: 'target' }]} />
<div style="height: 3000px"></div>
<div id="shadow-target">target content</div>
