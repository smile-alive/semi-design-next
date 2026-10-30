<script lang="ts">
    import { Space, Tag, type TagCloseEvent } from '@fibrae/semi-ui-svelte';

    const preventClose = (event: TagCloseEvent) => event.preventDefault();
</script>

<div>
    <Space>
        <Tag>default tag</Tag>
        <Tag closable>Closable Tag</Tag>
        <Tag closable onClose={preventClose}>Closable Tag, Prevent Default</Tag>
    </Space>
</div>
