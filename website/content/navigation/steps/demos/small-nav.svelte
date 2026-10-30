<script lang="ts">
    import { Steps } from '@fibrae/semi-ui-svelte';

    const dataSource = [{ title: '注册账号' }, { title: '这个项目的文字比较多多多多' }, { title: '产品用途' }, { title: '期待尝试功能' }];
    const log = (i: number) => console.log(i);
</script>

<div style="display: flex; justify-content: center">
    <Steps current={1} {dataSource} onChange={log} size="small" style="margin: auto" type="nav" />
</div>
