<script lang="ts">
    import Feedback from '../feedback.svelte';

    // The four ways a parent can hold `visible`; `rejectClose` makes the function binding refuse to close
    let { mode, rejectClose = false, feedbackMode = 'modal' }: { mode: 'bind' | 'get-set' | 'one-way' | 'none'; rejectClose?: boolean; feedbackMode?: 'modal' | 'popup' } = $props();

    let visible = $state(true);
    let writes = $state<boolean[]>([]);
</script>

{#if mode === 'bind'}
    <Feedback bind:visible closeOnEsc mode={feedbackMode} motion={false} title="T" />
{:else if mode === 'get-set'}
    <Feedback
        bind:visible={
            () => visible,
            (next) => {
                writes.push(next);
                if (!rejectClose) visible = next;
            }
        }
        closeOnEsc
        mode={feedbackMode}
        motion={false}
        title="T"
    />
{:else if mode === 'one-way'}
    <Feedback closeOnEsc mode={feedbackMode} motion={false} title="T" {visible} />
{:else}
    <Feedback closeOnEsc mode={feedbackMode} motion={false} title="T" />
{/if}
<output aria-label="visible">{visible}</output>
<output aria-label="writes">{writes.join(',')}</output>
