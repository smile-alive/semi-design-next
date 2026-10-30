<script lang="ts">
    import { Transfer } from '@fibrae/semi-ui-svelte';

    const data = Array.from({ length: 100 }, (_, i) => ({
        label: `选项名称 ${i}`,
        value: i,
        disabled: false,
        key: `key-${i}`,
    }));
</script>

<Transfer dataSource={data} onChange={(values, items) => console.log(values, items)} pagination={{ pageSize: 10 }} style="width: 568px; height: 416px" />
