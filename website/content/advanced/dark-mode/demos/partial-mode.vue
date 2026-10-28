<script setup lang="ts">
    import { ref } from 'vue';
    import { IconBell, IconBytedanceLogo, IconCamera, IconEdit, IconHelpCircle, IconHistogram, IconHome, IconList, IconLive, IconSemiLogo, IconSetting } from '@fibrae/semi-icons-vue';
    import { Avatar, Badge, Breadcrumb, Button, Layout, Nav, Pagination, Popover, Rating, Row, Steps, Tag, Timeline, Tooltip, type NavItemConfig, type NavItems } from '@fibrae/semi-ui-vue';

    const { Header, Footer, Sider, Content } = Layout;
    const mode = ref('semi-always-dark');

    const switchMode = () => {
        mode.value = mode.value === 'semi-always-dark' ? 'semi-always-light' : 'semi-always-dark';
    };

    const rowStyle = { margin: '16px 10px' };
    const badgeStyle = { width: '42px', height: '42px', borderRadius: '4px', display: 'inline-block' };
    const tagStyle = { marginRight: '8px', marginBottom: '8px' };
    const headerButtonStyle = { color: 'var(--semi-color-text-2)', marginRight: '12px' };

    const sideItems: NavItems = [
        { itemKey: 'Home', text: '首页' },
        { itemKey: 'Histogram', text: '基础数据' },
        { itemKey: 'Live', text: '测试功能' },
        { itemKey: 'Setting', text: '设置' },
    ];
    const sideIcons = { Home: IconHome, Histogram: IconHistogram, Live: IconLive, Setting: IconSetting };
    const sideIconOf = (item: NavItemConfig) => sideIcons[item.itemKey as keyof typeof sideIcons];

    const exampleItems: NavItems = [
        { itemKey: 'user', text: 'Option1' },
        { itemKey: 'union', text: 'Option2' },
        { itemKey: 'approve-management', text: 'Group3', items: ['3-1', '3-2'] },
    ];
    const exampleIcons = { user: IconEdit, union: IconCamera, 'approve-management': IconList };
    const exampleIconOf = (item: NavItemConfig) => exampleIcons[item.itemKey as keyof typeof exampleIcons];

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
</script>

<template>
    <Button :style="{ marginBottom: '4px' }" @click="switchMode">Switch Content Mode</Button>
    <Layout :style="{ border: '1px solid var(--semi-color-border)' }">
        <Header :style="{ backgroundColor: 'var(--semi-color-bg-1)' }">
            <div>
                <Nav aria-label="顶部导航" :defaultSelectedKeys="['Home']" mode="horizontal">
                    <Nav.Header>
                        <IconSemiLogo :style="{ width: '96px', height: '36px', fontSize: '36px' }" />
                    </Nav.Header>
                    <span :style="{ color: 'var(--semi-color-text-2)' }">
                        <span :style="{ marginRight: '24px', color: 'var(--semi-color-text-0)', fontWeight: '600' }"> 模版推荐 </span>
                        <span :style="{ marginRight: '24px' }">所有模版</span>
                        <span>我的模版</span>
                    </span>
                    <Nav.Footer>
                        <Button aria-label="通知" :style="headerButtonStyle" theme="borderless">
                            <template #icon>
                                <IconBell size="large" />
                            </template>
                        </Button>
                        <Button aria-label="帮助" :style="headerButtonStyle" theme="borderless">
                            <template #icon>
                                <IconHelpCircle size="large" />
                            </template>
                        </Button>
                        <Avatar color="orange" size="small">YJ</Avatar>
                    </Nav.Footer>
                </Nav>
            </div>
        </Header>
        <Layout>
            <Sider :style="{ backgroundColor: 'var(--semi-color-bg-1)' }">
                <Nav aria-label="侧边导航" :defaultSelectedKeys="['Home']" :footer="{ collapseButton: true }" :items="sideItems" :style="{ maxWidth: '220px', height: '100%' }">
                    <template #icon="{ item }">
                        <component :is="sideIconOf(item)" size="large" />
                    </template>
                </Nav>
            </Sider>
            <Content :class="mode" :style="{ padding: '24px', backgroundColor: 'var(--semi-color-bg-1)' }">
                <Breadcrumb :routes="routes" :style="{ marginBottom: '24px' }" />
                <div
                    :style="{
                        borderRadius: '10px',
                        border: '1px solid var(--semi-color-border)',
                        height: '700px',
                        padding: '32px',
                    }"
                >
                    <Row :style="rowStyle">
                        <Nav aria-label="示例导航" :items="exampleItems" mode="horizontal">
                            <template #icon="{ item }">
                                <component :is="exampleIconOf(item)" />
                            </template>
                        </Nav>
                        <br />
                        <br />
                        <Pagination showSizeChanger :total="80" />
                        <br />
                        <Steps :current="1">
                            <Steps.Step>
                                <template #title>Finished</template>
                                <template #description>This is a description.</template>
                            </Steps.Step>
                            <Steps.Step>
                                <template #title>In Progress</template>
                                <template #description>This is a description.</template>
                            </Steps.Step>
                            <Steps.Step>
                                <template #title>Waiting</template>
                                <template #description>This is a description.</template>
                            </Steps.Step>
                        </Steps>
                        <br />
                        <Steps :current="1" status="error">
                            <Steps.Step>
                                <template #title>Finished</template>
                                <template #description>This is a description</template>
                            </Steps.Step>
                            <Steps.Step>
                                <template #title>In Process</template>
                                <template #description>This is a description</template>
                            </Steps.Step>
                            <Steps.Step>
                                <template #title>Waiting</template>
                                <template #description>This is a description</template>
                            </Steps.Step>
                        </Steps>
                    </Row>
                    <Row :style="rowStyle">
                        <div :style="{ display: 'flex' }">
                            <div :style="{ padding: '8px' }">
                                <Badge :count="5" theme="solid">
                                    <Avatar color="blue" shape="square" :style="badgeStyle">XZ</Avatar>
                                </Badge>
                            </div>
                            <div :style="{ padding: '8px' }">
                                <Badge :count="5" theme="light">
                                    <Avatar color="cyan" shape="square" :style="badgeStyle">YB</Avatar>
                                </Badge>
                            </div>
                            <div :style="{ padding: '8px' }">
                                <Badge :count="5" theme="inverted">
                                    <Avatar color="indigo" shape="square" :style="badgeStyle">LX</Avatar>
                                </Badge>
                            </div>
                            <div :style="{ padding: '8px' }">
                                <Badge dot theme="solid">
                                    <Avatar color="light-blue" shape="square" :style="badgeStyle">YZ</Avatar>
                                </Badge>
                            </div>
                            <div :style="{ padding: '8px' }">
                                <Badge dot theme="light">
                                    <Avatar color="teal" shape="square" :style="badgeStyle">HW</Avatar>
                                </Badge>
                            </div>
                            <div
                                :style="{
                                    padding: '8px',
                                    borderRadius: '4px',
                                    backgroundColor: 'var(--semi-color-fill-0)',
                                }"
                            >
                                <Badge dot theme="inverted">
                                    <Avatar color="green" shape="square" :style="badgeStyle">XM</Avatar>
                                </Badge>
                            </div>
                        </div>
                        <br />
                        <div>
                            <Tag v-for="tag in tags" :key="tag.label" :color="tag.color" :style="tagStyle" :type="'type' in tag ? tag.type : undefined">
                                {{ tag.label }}
                            </Tag>
                        </div>
                        <br />
                        <div :style="{ display: 'flex', alignItems: 'center' }">
                            <Popover :style="{ padding: '8px' }">
                                <Tag :style="{ marginRight: '8px' }">I am Popover</Tag>
                                <template #content>hi semi-design</template>
                            </Popover>
                            <Tooltip>
                                <Tag :style="{ marginRight: '8px' }">I am Tooltip</Tag>
                                <template #content>hi semi-design</template>
                            </Tooltip>
                            <Rating :defaultValue="3" size="small" :style="{ marginRight: '8px' }" />
                        </div>
                        <br />
                        <Timeline>
                            <Timeline.Item type="ongoing">
                                <template #time>2019-07-14 10:35</template>
                                审核中
                            </Timeline.Item>
                            <Timeline.Item type="success">
                                <template #time>2019-06-13 16:17</template>
                                发布成功
                            </Timeline.Item>
                            <Timeline.Item type="error">
                                <template #time>2019-05-14 18:34</template>
                                审核失败
                            </Timeline.Item>
                        </Timeline>
                    </Row>
                </div>
            </Content>
        </Layout>
        <Footer
            :style="{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '20px',
                color: 'var(--semi-color-text-2)',
                backgroundColor: 'var(--semi-grey-0)',
            }"
        >
            <span :style="{ display: 'flex', alignItems: 'center' }">
                <IconBytedanceLogo size="large" :style="{ marginRight: '8px' }" />
                <span>Copyright © 2019 ByteDance. All Rights Reserved. </span>
            </span>
            <span>
                <span :style="{ marginRight: '24px' }">平台客服</span>
                <span>反馈建议</span>
            </span>
        </Footer>
    </Layout>
</template>
