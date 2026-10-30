<script lang="ts">
    import { Anchor } from '@fibrae/semi-ui-svelte';

    const links = [
        { href: '#尺寸', title: '尺寸' },
        { href: '#滑轨主题', title: '滑轨主题' },
        { href: '#设计语言', title: '设计语言' },
        { href: '#物料平台', title: '物料平台' },
        { href: '#主题商店', title: '主题商店' },
    ];
</script>

<div>
    <Anchor {links} offsetTop={100} railTheme="tertiary" targetOffset={60} />
</div>
