<script lang="ts">
    import { Anchor } from '@fibrae/semi-ui-svelte';

    const sections = ['section-a', 'section-b', 'section-c'];
    const links = sections.map((id, index) => ({ href: `#${id}`, title: `章节 ${index + 1}` }));
    const getContainer = () => document.getElementById('scroll-box');
</script>

<div style="display: flex; gap: 24px">
    <Anchor {getContainer} {links} scrollIntoViewOptions={{ block: 'center' }} scrollMotion style="width: 160px" />
    <!-- Focusable so the keyboard can scroll this container -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <section aria-label="章节" id="scroll-box" style="height: 240px; width: 320px; overflow: auto; border: 1px solid #ddd" tabindex="0">
        {#each sections as id, index (id)}
            <div {id} style="height: 200px; padding: 8px">点击链接后，章节 {index + 1} 会滚动到容器中间</div>
        {/each}
    </section>
</div>
