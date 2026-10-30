<script lang="ts">
    import { Button, ButtonGroup, Transfer } from '@fibrae/semi-ui-svelte';

    let currentPage = $state(1);
    const data = Array.from({ length: 100 }, (_, i) => ({
        label: `选项名称 ${i}`,
        value: i,
        disabled: false,
        key: `key-${i}`,
    }));
</script>

<div>
    <ButtonGroup style="margin-bottom: 12px">
        <Button onclick={() => (currentPage = 1)}>第1页</Button>
        <Button onclick={() => (currentPage = 2)}>第2页</Button>
        <Button onclick={() => (currentPage = 5)}>第5页</Button>
        <Button onclick={() => (currentPage = 10)}>第10页</Button>
    </ButtonGroup>
    <div>当前页码: {currentPage}</div>
    <Transfer dataSource={data} onChange={(values, items) => console.log(values, items)} pagination={{ pageSize: 10, currentPage, onPageChange: (page) => (currentPage = page) }} style="width: 568px; height: 416px" />
</div>
