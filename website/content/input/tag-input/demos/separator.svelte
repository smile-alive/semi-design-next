<script lang="ts">
    import { TagInput } from '@fibrae/semi-ui-svelte';

    const separators = ['-', '/', '|', '++'];
</script>

<TagInput placeholder="使用 - 进行批量输入" separator="-" />
<br />
<br />
<TagInput placeholder="支持多个分隔符进行批量输入" separator={separators} />
