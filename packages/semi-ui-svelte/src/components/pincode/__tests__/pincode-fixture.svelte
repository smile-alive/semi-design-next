<script lang="ts">
    import type { PinCodeProps } from '../interface';
    import PinCode from '../pincode.svelte';

    let {
        store,
        onHandle,
    }: {
        store: { props: PinCodeProps };
        onHandle?: (handle?: ReturnType<typeof PinCode>) => void;
    } = $props();

    let handle = $state<ReturnType<typeof PinCode>>();

    $effect(() => {
        onHandle?.(handle);
    });
</script>

<PinCode bind:this={handle} {...store.props} />
