<script lang="ts">
    import { Space, Tag, type TagColor } from '@fibrae/semi-ui-svelte';

    const colors: TagColor[] = ['amber', 'blue', 'cyan', 'green', 'grey', 'indigo', 'light-blue', 'light-green', 'lime', 'orange', 'pink', 'purple', 'red', 'teal', 'violet', 'yellow', 'white'];
</script>

<Space wrap>
    {#each colors as color (color)}
        <Tag {color}>{color}</Tag>
    {/each}
</Space>
