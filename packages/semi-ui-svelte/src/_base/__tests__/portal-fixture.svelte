<script lang="ts">
    import '@fibrae/semi-foundation/modal/modal.scss';
    import cssAnimation from '../css-animation';
    import Portal from '../portal.svelte';

    let {
        store,
        getPopupContainer,
        zIndex,
    }: {
        store: { open: boolean; content: boolean; global: boolean };
        getPopupContainer?: () => HTMLElement | null;
        zIndex?: number;
    } = $props();
</script>

<p>before</p>
{#if store.open}
    <Portal {getPopupContainer} {zIndex}>
        {#snippet children({ inBody })}
            <p data-in-body={inBody}>inside</p>
            {#if store.content}
                <div class="semi-modal-content" data-testid="local" out:cssAnimation={{ className: 'semi-modal-content-animate-hide' }}>local</div>
            {/if}
            {#if store.global}
                <div class="semi-modal-content" data-testid="global" out:cssAnimation|global={{ className: 'semi-modal-content-animate-hide' }}>global</div>
            {/if}
        {/snippet}
    </Portal>
{/if}
<p>after</p>
