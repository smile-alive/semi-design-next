<script lang="ts">
    import { IconCamera, IconChevronDown, IconEdit, IconList, IconSidebar, IconVigoLogo } from '@fibrae/semi-icons-svelte';
    import {
        Avatar,
        Badge,
        Breadcrumb,
        Button,
        ButtonGroup,
        Cascader,
        Checkbox,
        Col,
        ConfigProvider,
        DatePicker,
        Input,
        Modal,
        Nav,
        Notification,
        Pagination,
        Popover,
        Radio,
        Rating,
        Row,
        Select,
        Spin,
        Steps,
        Switch,
        Tag,
        TextArea,
        TimePicker,
        Timeline,
        Toast,
        Tooltip,
        Typography,
        type NavItems,
        type TimelineData,
    } from '@fibrae/semi-ui-svelte';

    let direction = $state<'ltr' | 'rtl'>();
    const flexStyle = 'display: flex; margin-block-end: 32px; flex-wrap: wrap';
    const titleStyle = 'margin: 50px 0 16px 0';
    const rowStyle = 'margin: 16px 10px';
    const badgeStyle = 'width: 42px; height: 42px; border-radius: 4px; display: inline-block';
    const tagStyle = 'margin-inline-end: 8px; margin-block-end: 8px';
    const buttonStyle = tagStyle;
    const opts = () => ({
        title: 'Hi,semi',
        content: 'Semi Design Next',
        duration: 3,
        direction,
    });
    const optionList = [
        { value: 'video', label: '短视频' },
        { value: 'live', label: '直播' },
        { value: 'community', label: '社区', disabled: true },
        { value: 'movie', label: '长视频' },
    ];
    const treeData = [
        {
            label: '浙江省',
            value: 'zhejiang',
            children: [
                {
                    label: '杭州市',
                    value: 'hangzhou',
                    children: [
                        { label: '西湖区', value: 'xihu' },
                        { label: '萧山区', value: 'xiaoshan' },
                        { label: '临安区', value: 'linan' },
                    ],
                },
                {
                    label: '宁波市',
                    value: 'ningbo',
                    children: [
                        { label: '海曙区', value: 'haishu' },
                        { label: '江北区', value: 'jiangbei' },
                    ],
                },
            ],
        },
    ];
    const navItems: NavItems = [
        { itemKey: 'user', text: 'Option1' },
        { itemKey: 'union', text: 'Option2' },
        { itemKey: 'approve-management', text: 'Group3', items: ['3-1', '3-2'] },
    ];
    const navIcons = { user: IconEdit, union: IconCamera, 'approve-management': IconList };
    const steps = [
        { title: 'Finished', description: 'This is a description.' },
        { title: 'In Progress', description: 'This is a description.' },
        { title: 'Waiting', description: 'This is a description.' },
    ];
    const timeline: TimelineData[] = [
        { type: 'ongoing', time: '2019-07-14 10:35', content: '审核中' },
        { type: 'success', time: '2019-06-13 16:17', content: '发布成功' },
        { type: 'error', time: '2019-05-14 18:34', content: '审核失败' },
    ];
</script>

{#snippet vigo()}<IconVigoLogo />{/snippet}
{#snippet pinkVigo()}<IconVigoLogo style="color: pink" />{/snippet}

<div>
    <div style="margin-block-end: 20px">
        <ButtonGroup>
            <Button onclick={() => (direction = 'ltr')}>LTR</Button>
            <Button onclick={() => (direction = 'rtl')}>RTL</Button>
        </ButtonGroup>
    </div>
    <ConfigProvider {direction}>
        <div>
            <h3 style={titleStyle}>Buttons</h3>
        </div>
        <div style={rowStyle}>
            <Button loading style="margin-inline-end: 8px" theme="solid">加载</Button>
            <Button style="margin-inline-end: 8px" theme="solid">
                {#snippet icon()}
                    <IconSidebar />
                {/snippet}
                收起
            </Button>
            <Button iconPosition="right" style="margin-inline-end: 8px" theme="solid">
                {#snippet icon()}
                    <IconChevronDown />
                {/snippet}
                展开选项
            </Button>
            <br />
            <br />
            <ButtonGroup>
                <Button>拷贝</Button>
                <Button>查询</Button>
                <Button>剪切</Button>
            </ButtonGroup>
        </div>
        <div>
            <h3 style={titleStyle}>Input</h3>
        </div>
        <Row gutter={16} style={rowStyle}>
            <Col span={12}>
                <Input aria-label="输入框" placeholder="输入框" />
                <br />
                <br />
                <Input aria-label="禁用的输入框" disabled placeholder="输入框" />
                <br />
                <br />
                <Input aria-label="带前缀的输入框" showClear>
                    {#snippet prefix()}Prefix{/snippet}
                </Input>
                <br />
                <br />
                <Input aria-label="带后缀的输入框" showClear>
                    {#snippet suffix()}
                        <Typography.Text strong style="margin: 0 8px" type="secondary">Suffix</Typography.Text>
                    {/snippet}
                </Input>
                <br />
                <br />
                <TextArea aria-label="文本框" maxCount={100} placeholder="文本框" />
                <br />
                <br />
                <div style={flexStyle}>
                    <Switch aria-label="已开启的开关" checked style="margin-inline-end: 8px" />
                    <Switch aria-label="已关闭的开关" style="margin-inline-end: 8px" />
                    <Switch aria-label="禁用的开关" checked disabled style="margin-inline-end: 8px" />
                </div>
                <div style={flexStyle}>
                    <Checkbox checked style="margin-inline-end: 8px">多选框</Checkbox>
                    <Checkbox checked disabled style="margin-inline-end: 8px">禁用的多选框</Checkbox>
                    <Checkbox disabled style="margin-inline-end: 8px">禁用的多选框</Checkbox>
                </div>
                <div style="{flexStyle}; margin-block-end: 0">
                    <Radio checked style="margin-inline-end: 8px">单选框</Radio>
                    <Radio checked disabled style="margin-inline-end: 8px">禁用的单选框</Radio>
                    <Radio disabled style="margin-inline-end: 8px">禁用的单选框</Radio>
                </div>
            </Col>
            <Col span={12}>
                <DatePicker onChange={(_date, dateString) => console.log(dateString)} style="width: 100%" />
                <br />
                <br />
                <TimePicker style="width: 100%" />
                <br />
                <br />
                <Select aria-label="选择器-单选" {optionList} placeholder="选择器-单选" style="width: 100%" />
                <br />
                <br />
                <Select aria-label="选择器-禁用" disabled {optionList} placeholder="选择器-禁用" style="width: 100%" />
                <br />
                <br />
                <Select aria-label="选择器-多选" multiple {optionList} placeholder="选择器-多选" style="width: 100%" />
                <br />
                <br />
                <Cascader placeholder="级联选择器" style="width: 100%" {treeData} />
            </Col>
        </Row>
        <div>
            <h3 style={titleStyle}>Navigation</h3>
        </div>
        <div style={rowStyle}>
            <Breadcrumb routes={['Semi-ui', 'Breadcrumb', 'Default']} />
            <Nav items={navItems} mode="horizontal">
                {#snippet icon({ item, size })}
                    {@const Icon = navIcons[item.itemKey as keyof typeof navIcons]}
                    {#if Icon}
                        <Icon {size} />
                    {/if}
                {/snippet}
            </Nav>
            <br />
            <br />
            <Pagination showSizeChanger total={80} />
            <br />
            <Steps current={1} dataSource={steps} />
            <br />
            <Steps current={1} dataSource={steps} status="error" />
        </div>
        <div>
            <h3 style={titleStyle}>Display</h3>
        </div>
        <div style={rowStyle}>
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
                <Tag color="grey" style={tagStyle}>grey tag</Tag>
                <Tag color="blue" style={tagStyle}>blue tag</Tag>
                <Tag color="blue" style={tagStyle} type="ghost">ghost tag</Tag>
                <Tag color="blue" style={tagStyle} type="solid">solid tag</Tag>
                <Tag color="red" style={tagStyle}>red tag</Tag>
                <Tag color="green" style={tagStyle}>green tag</Tag>
                <Tag color="orange" style={tagStyle}>orange tag</Tag>
                <Tag color="teal" style={tagStyle}>teal tag</Tag>
                <Tag color="violet" style={tagStyle}>violet tag</Tag>
                <Tag color="white" style={tagStyle}>white tag</Tag>
            </div>
            <br />
            <div style="display: flex; align-items: center">
                <Popover style="padding: 8px">
                    {#snippet content()}hi semi-design{/snippet}
                    <Tag style="margin-inline-end: 8px">I am Popover</Tag>
                </Popover>
                <Tooltip>
                    {#snippet content()}hi semi-design{/snippet}
                    <Tag style="margin-inline-end: 8px">I am Tooltip</Tag>
                </Tooltip>
                <Rating size="small" style="margin-inline-end: 8px" value={3} />
            </div>
            <br />
            <Timeline dataSource={timeline} />
        </div>
        <div>
            <h3 style={titleStyle}>Feedback</h3>
        </div>
        <div style={rowStyle}>
            <Button style={buttonStyle} type="primary" onclick={() => Notification.success(opts())}>成功信息的通知</Button>
            <Button style={buttonStyle} onclick={() => Notification.info(opts())}>提示信息的通知</Button>
            <Button style={buttonStyle} type="warning" onclick={() => Notification.warning(opts())}>警告信息的通知</Button>
            <Button style={buttonStyle} type="danger" onclick={() => Notification.error(opts())}>失败信息的通知</Button>
            <Button aria-label="Vigo 图标通知" style={buttonStyle} onclick={() => Notification.info({ ...opts(), icon: vigo })}>
                {#snippet icon()}
                    <IconVigoLogo />
                {/snippet}
            </Button>
            <Button aria-label="粉色 Vigo 图标通知" style={buttonStyle} onclick={() => Notification.info({ ...opts(), icon: pinkVigo })}>
                {#snippet icon()}
                    <IconVigoLogo />
                {/snippet}
            </Button>
            <br />
            <Button style={buttonStyle} type="primary" onclick={() => Modal.success(opts())}>成功信息的弹窗</Button>
            <Button style={buttonStyle} onclick={() => Modal.info(opts())}>提示信息的弹窗</Button>
            <Button style={buttonStyle} type="warning" onclick={() => Modal.warning(opts())}>警告信息的弹窗</Button>
            <Button style={buttonStyle} type="danger" onclick={() => Modal.error(opts())}>失败信息的弹窗</Button>
            <br />
            <Button style={buttonStyle} type="primary" onclick={() => Toast.success(opts())}>成功信息的提示</Button>
            <Button style={buttonStyle} onclick={() => Toast.info(opts())}>提示信息的提示</Button>
            <Button style={buttonStyle} type="warning" onclick={() => Toast.warning(opts())}>警告信息的提示</Button>
            <Button style={buttonStyle} type="danger" onclick={() => Toast.error(opts())}>失败信息的提示</Button>
            <br />
            <br />
            <Spin>
                {#snippet tip()}I am loading...{/snippet}
                <div style="background-color: var(--semi-color-primary-light-default); border: 1px solid var(--semi-color-primary); border-radius: 4px; padding: 16px 10px">
                    <p>Here are some texts.</p>
                    <p>And more texts on the way.</p>
                </div>
            </Spin>
        </div>
    </ConfigProvider>
</div>
