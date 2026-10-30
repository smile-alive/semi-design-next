<script lang="ts">
    import { Anchor } from '@fibrae/semi-ui-svelte';

    const links = [
        { href: '#工具提示位置', title: '工具提示是一个有用的工具，它可以在文字缩略时展示全部内容。' },
        { href: '#组件', title: '组件' },
        { href: '#设计语言', title: '设计语言' },
        { href: '#物料平台', title: '物料平台' },
        { href: '#主题商店', title: '主题商店' },
    ];
</script>

<div>
    <Anchor {links} offsetTop={100} position="right" showTooltip targetOffset={60} />
</div>
