<script lang="ts">
    import '@fibrae/semi-foundation/modal/modal.scss';
    import cssAnimation from '../css-animation';

    let { store }: { store: { visible: boolean } } = $props();
</script>

{#if store.visible}
    <div class="semi-modal-content" data-testid="content" in:cssAnimation={{ className: 'semi-modal-content-animate-show' }} out:cssAnimation={{ className: 'semi-modal-content-animate-hide' }}>content</div>
{/if}
