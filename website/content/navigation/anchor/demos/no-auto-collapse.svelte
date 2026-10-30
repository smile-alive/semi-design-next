<script lang="ts">
    import { Anchor } from '@fibrae/semi-ui-svelte';

    const links = [
        {
            href: '#动态展示',
            title: '1. 动态展示',
            children: [
                {
                    href: '#组件',
                    title: '1.1 组件',
                    children: [
                        { href: '#头像', title: '1.1.1 Avatar' },
                        { href: '#按钮', title: '1.1.2 Button' },
                        { href: '#图标', title: '1.1.3 Icon' },
                    ],
                },
                { href: '#物料', title: '1.2 物料' },
                { href: '#主题商店', title: '1.3 主题商店' },
            ],
        },
        { href: '#设计语言', title: '2. 设计语言' },
    ];
</script>

<div>
    <Anchor autoCollapse={false} {links} offsetTop={100} targetOffset={60} />
</div>
