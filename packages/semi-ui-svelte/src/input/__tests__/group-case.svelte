<script lang="ts">
    import InputGroup from '../input-group.svelte';
    import Input from '../input.svelte';
    import type { InputGroupProps } from '../interface';
    import TextArea from '../textarea.svelte';

    interface Case {
        group?: InputGroupProps;
        // a text child shows the group renders what it is given, whatever the child
        text?: string;
        onChildFocus?: () => void;
    }

    let { store }: { store: Case } = $props();
</script>

<InputGroup {...store.group}>
    <Input disabled={false} onFocus={store.onChildFocus} placeholder="own-enabled" />
    <Input disabled placeholder="shorthand" />
    <Input placeholder="inherit" />
    <Input placeholder="own-size" size="large" />
    <div><Input placeholder="deep" /></div>
    <TextArea placeholder="area" />
    {#if store.text}{store.text}{/if}
</InputGroup>
