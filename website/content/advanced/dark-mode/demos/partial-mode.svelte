<script lang="ts">
    import { IconBell, IconBytedanceLogo, IconCamera, IconEdit, IconHelpCircle, IconHistogram, IconHome, IconList, IconLive, IconSemiLogo, IconSetting } from '@fibrae/semi-icons-svelte';
    import { Avatar, Badge, Breadcrumb, Button, Layout, LayoutContent, LayoutFooter, LayoutHeader, LayoutSider, Nav, NavFooter, NavHeader, Pagination, Popover, Rating, Row, Steps, Tag, Timeline, Tooltip, type NavItems, type StepData, type TimelineData } from '@fibrae/semi-ui-svelte';

    let mode = $state('semi-always-dark');

    const switchMode = () => {
        mode = mode === 'semi-always-dark' ? 'semi-always-light' : 'semi-always-dark';
    };

    const rowStyle = 'margin: 16px 10px';
    const badgeStyle = 'width: 42px; height: 42px; border-radius: 4px; display: inline-block';
    const tagStyle = 'margin-inline-end: 8px; margin-bottom: 8px';
    const headerButtonStyle = 'color: var(--semi-color-text-2); margin-inline-end: 12px';

    const sideItems: NavItems = [
        { itemKey: 'Home', text: '首页' },
        { itemKey: 'Histogram', text: '基础数据' },
        { itemKey: 'Live', text: '测试功能' },
        { itemKey: 'Setting', text: '设置' },
    ];
    const sideIcons = { Home: IconHome, Histogram: IconHistogram, Live: IconLive, Setting: IconSetting };

    const exampleItems: NavItems = [
        { itemKey: 'user', text: 'Option1' },
        { itemKey: 'union', text: 'Option2' },
        { itemKey: 'approve-management', text: 'Group3', items: ['3-1', '3-2'] },
    ];
    const exampleIcons = { user: IconEdit, union: IconCamera, 'approve-management': IconList };

    const routes = ['首页', '当这个页面标题很长时需要省略', '上一页', '详情页'];
    const tags = [
        { color: 'grey', label: 'grey tag' },
        { color: 'blue', label: 'blue tag' },
        { color: 'blue', type: 'ghost', label: 'ghost tag' },
        { color: 'blue', type: 'solid', label: 'solid tag' },
        { color: 'red', label: 'red tag' },
        { color: 'green', label: 'green tag' },
        { color: 'orange', label: 'orange tag' },
        { color: 'teal', label: 'teal tag' },
        { color: 'violet', label: 'violet tag' },
        { color: 'white', label: 'white tag' },
    ] as const;

    const steps = (description: string): StepData[] => [
        { title: 'Finished', description },
        { title: 'In Progress', description },
        { title: 'Waiting', description },
    ];
    const timeline: TimelineData[] = [
        { time: '2019-07-14 10:35', content: '审核中', type: 'ongoing' },
        { time: '2019-06-13 16:17', content: '发布成功', type: 'success' },
        { time: '2019-05-14 18:34', content: '审核失败', type: 'error' },
    ];
</script>

{#snippet topHeader()}
    <NavHeader>
        <IconSemiLogo style="width: 96px; height: 36px; font-size: 36px" />
    </NavHeader>
{/snippet}

{#snippet topFooter()}
    <NavFooter>
        <Button aria-label="通知" style={headerButtonStyle} theme="borderless">
            {#snippet icon()}<IconBell size="large" />{/snippet}
        </Button>
        <Button aria-label="帮助" style={headerButtonStyle} theme="borderless">
            {#snippet icon()}<IconHelpCircle size="large" />{/snippet}
        </Button>
        <Avatar color="orange" size="small">YJ</Avatar>
    </NavFooter>
{/snippet}

{#snippet tipContent()}hi semi-design{/snippet}

<Button style="margin-bottom: 4px" onclick={switchMode}>Switch Content Mode</Button>
<Layout style="border: 1px solid var(--semi-color-border)">
    <LayoutHeader style="background-color: var(--semi-color-bg-1)">
        <div>
            <Nav aria-label="顶部导航" footer={topFooter} header={topHeader} mode="horizontal" selectedKeys={['Home']}>
                <!-- Nav renders its children straight into the list, so other content needs its own li -->
                <li style="display: contents">
                    <span style="color: var(--semi-color-text-2)">
                        <span style="margin-inline-end: 24px; color: var(--semi-color-text-0); font-weight: 600"> 模版推荐 </span>
                        <span style="margin-inline-end: 24px">所有模版</span>
                        <span>我的模版</span>
                    </span>
                </li>
            </Nav>
        </div>
    </LayoutHeader>
    <Layout>
        <LayoutSider style="background-color: var(--semi-color-bg-1)">
            <Nav aria-label="侧边导航" footer={{ collapseButton: true }} items={sideItems} selectedKeys={['Home']} style="max-width: 220px; height: 100%">
                {#snippet icon({ item })}
                    {@const Icon = sideIcons[item.itemKey as keyof typeof sideIcons]}
                    <Icon size="large" />
                {/snippet}
            </Nav>
        </LayoutSider>
        <LayoutContent class={mode} style="padding: 24px; background-color: var(--semi-color-bg-1)">
            <Breadcrumb {routes} style="margin-bottom: 24px" />
            <div style="border-radius: 10px; border: 1px solid var(--semi-color-border); height: 700px; padding: 32px">
                <Row style={rowStyle}>
                    <Nav aria-label="示例导航" items={exampleItems} mode="horizontal">
                        {#snippet icon({ item })}
                            {@const Icon = exampleIcons[item.itemKey as keyof typeof exampleIcons]}
                            <Icon />
                        {/snippet}
                    </Nav>
                    <br />
                    <br />
                    <Pagination showSizeChanger total={80} />
                    <br />
                    <Steps current={1} dataSource={steps('This is a description.')} />
                    <br />
                    <Steps current={1} dataSource={steps('This is a description')} status="error" />
                </Row>
                <Row style={rowStyle}>
                    <div style="display: flex">
                        <div style="padding: 8px">
                            <Badge count={5} theme="solid">
                                <Avatar color="blue" shape="square" style={badgeStyle}>XZ</Avatar>
                            </Badge>
                        </div>
                        <div style="padding: 8px">
                            <Badge count={5} theme="light">
                                <Avatar color="cyan" shape="square" style={badgeStyle}>YB</Avatar>
                            </Badge>
                        </div>
                        <div style="padding: 8px">
                            <Badge count={5} theme="inverted">
                                <Avatar color="indigo" shape="square" style={badgeStyle}>LX</Avatar>
                            </Badge>
                        </div>
                        <div style="padding: 8px">
                            <Badge dot theme="solid">
                                <Avatar color="light-blue" shape="square" style={badgeStyle}>YZ</Avatar>
                            </Badge>
                        </div>
                        <div style="padding: 8px">
                            <Badge dot theme="light">
                                <Avatar color="teal" shape="square" style={badgeStyle}>HW</Avatar>
                            </Badge>
                        </div>
                        <div style="padding: 8px; border-radius: 4px; background-color: var(--semi-color-fill-0)">
                            <Badge dot theme="inverted">
                                <Avatar color="green" shape="square" style={badgeStyle}>XM</Avatar>
                            </Badge>
                        </div>
                    </div>
                    <br />
                    <div>
                        {#each tags as tag (tag.label)}
                            <Tag color={tag.color} style={tagStyle} type={'type' in tag ? tag.type : undefined}>
                                {tag.label}
                            </Tag>
                        {/each}
                    </div>
                    <br />
                    <div style="display: flex; align-items: center">
                        <Popover content={tipContent} style="padding: 8px">
                            <Tag style="margin-inline-end: 8px">I am Popover</Tag>
                        </Popover>
                        <Tooltip content={tipContent}>
                            <Tag style="margin-inline-end: 8px">I am Tooltip</Tag>
                        </Tooltip>
                        <Rating size="small" style="margin-inline-end: 8px" value={3} />
                    </div>
                    <br />
                    <Timeline dataSource={timeline} />
                </Row>
            </div>
        </LayoutContent>
    </Layout>
    <LayoutFooter style="display: flex; justify-content: space-between; padding: 20px; color: var(--semi-color-text-2); background-color: var(--semi-grey-0)">
        <span style="display: flex; align-items: center">
            <IconBytedanceLogo size="large" style="margin-inline-end: 8px" />
            <span>Copyright © 2019 ByteDance. All Rights Reserved. </span>
        </span>
        <span>
            <span style="margin-inline-end: 24px">平台客服</span>
            <span>反馈建议</span>
        </span>
    </LayoutFooter>
</Layout>
