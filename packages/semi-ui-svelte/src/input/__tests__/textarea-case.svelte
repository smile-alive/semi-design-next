<script lang="ts">
    import type { TextAreaProps } from '../interface';
    import TextArea from '../textarea.svelte';

    interface Case {
        props?: TextAreaProps;
        // the component instance, for the handle methods
        handle?: { current?: ReturnType<typeof TextArea> };
    }

    let { store }: { store: Case } = $props();
</script>

<TextArea bind:this={() => store.handle?.current, (instance) => store.handle && (store.handle.current = instance)} {...store.props} />
