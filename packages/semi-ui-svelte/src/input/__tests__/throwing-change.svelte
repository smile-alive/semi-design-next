<script lang="ts">
    import Input from '../input.svelte';
    import TextArea from '../textarea.svelte';

    const fail = () => {
        throw new Error('rejected');
    };
</script>

<Input aria-label="输入框" bind:value={() => 'a', () => {}} onChange={fail} />
<TextArea aria-label="文本域" bind:value={() => 'a', () => {}} onChange={fail} />
