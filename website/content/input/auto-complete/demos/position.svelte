<script lang="ts">
    import { AutoComplete } from '@fibrae/semi-ui-svelte';

    let data = $state<string[]>([]);

    const change = (input: string) => {
        data = input ? ['gmail.com', '163.com', 'qq.com'].map((domain) => `${input}@${domain}`) : [];
    };
</script>

<div>
    <AutoComplete {data} onSearch={change} placeholder="选项菜单在上方显示" position="top" style="width: 200px; margin: 10px" />
    <AutoComplete {data} onSearch={change} placeholder="选项菜单在右侧显示" position="rightTop" style="width: 200px; margin: 10px" />
</div>
