<script lang="ts">
    import { Anchor } from '@fibrae/semi-ui-svelte';

    const links = [
        { href: '#基本示例', title: '基本示例' },
        { href: '#组件', title: '组件' },
        { href: '#设计语言', title: '设计语言' },
        { href: '#物料平台', title: '物料平台' },
        { href: '#主题商店', title: '主题商店' },
    ];
</script>

<Anchor {links} />
