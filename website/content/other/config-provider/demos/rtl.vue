<script setup lang="ts">
    import { h, ref, type CSSProperties } from 'vue';
    import { IconCamera, IconChevronDown, IconEdit, IconList, IconSidebar, IconVigoLogo } from '@fibrae/semi-icons-vue';
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
        TypographyText,
        type NavItemConfig,
    } from '@fibrae/semi-ui-vue';

    const direction = ref<'ltr' | 'rtl'>();
    const flexStyle: CSSProperties = { display: 'flex', marginBottom: '32px', flexWrap: 'wrap' };
    const titleStyle = { margin: '50px 0 16px 0' };
    const rowStyle = { margin: '16px 10px' };
    const badgeStyle = {
        width: '42px',
        height: '42px',
        borderRadius: '4px',
        display: 'inline-block',
    };
    const tagStyle = { marginRight: '8px', marginBottom: '8px' };
    const buttonStyle = { ...tagStyle };
    const opts = () => ({
        title: 'Hi,Bytedance',
        content: 'ies dance dance dance',
        duration: 3,
        direction: direction.value,
    });
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
    const navItems = [
        { itemKey: 'user', text: 'Option1' },
        { itemKey: 'union', text: 'Option2' },
        { itemKey: 'approve-management', text: 'Group3', items: ['3-1', '3-2'] },
    ];
    const navIcons = { user: IconEdit, union: IconCamera, 'approve-management': IconList };
    const navIconOf = (item: NavItemConfig) => navIcons[item.itemKey as keyof typeof navIcons];
    const vigoNotice = (color?: string) => Notification.info({ ...opts(), icon: h(IconVigoLogo, color ? { style: { color } } : null) });
</script>

<template>
    <div>
        <div :style="{ marginBottom: '20px' }">
            <ButtonGroup>
                <Button @click="direction = 'ltr'">LTR</Button>
                <Button @click="direction = 'rtl'">RTL</Button>
            </ButtonGroup>
        </div>
        <ConfigProvider :direction="direction">
            <Row>
                <h3 :style="titleStyle">Buttons</h3>
            </Row>
            <Row :style="rowStyle">
                <Button loading :style="{ marginRight: '8px' }" theme="solid">加载</Button>
                <Button :style="{ marginRight: '8px' }" theme="solid">
                    <template #icon>
                        <IconSidebar />
                    </template>
                    收起
                </Button>
                <Button iconPosition="right" :style="{ marginRight: '8px' }" theme="solid">
                    <template #icon>
                        <IconChevronDown />
                    </template>
                    展开选项
                </Button>
                <br />
                <br />
                <ButtonGroup>
                    <Button>拷贝</Button>
                    <Button>查询</Button>
                    <Button>剪切</Button>
                </ButtonGroup>
            </Row>
            <Row>
                <h3 :style="titleStyle">Input</h3>
            </Row>
            <Row :gutter="16" :style="rowStyle">
                <Col :span="12">
                    <Input aria-label="输入框" placeholder="输入框" />
                    <br />
                    <br />
                    <Input aria-label="禁用的输入框" disabled placeholder="输入框" />
                    <br />
                    <br />
                    <Input aria-label="带前缀的输入框" showClear>
                        <template #prefix>Prefix</template>
                    </Input>
                    <br />
                    <br />
                    <Input aria-label="带后缀的输入框" showClear>
                        <template #suffix>
                            <TypographyText strong :style="{ margin: '0 8px' }" type="secondary">Suffix</TypographyText>
                        </template>
                    </Input>
                    <br />
                    <br />
                    <TextArea aria-label="文本框" :maxCount="100" placeholder="文本框" />
                    <br />
                    <br />
                    <div :style="flexStyle">
                        <Switch aria-label="已开启的开关" defaultChecked :style="{ marginRight: '8px' }" />
                        <Switch aria-label="已关闭的开关" :style="{ marginRight: '8px' }" />
                        <Switch aria-label="禁用的开关" defaultChecked disabled :style="{ marginRight: '8px' }" />
                    </div>
                    <div :style="flexStyle">
                        <Checkbox defaultChecked :style="{ marginRight: '8px' }">多选框</Checkbox>
                        <Checkbox defaultChecked disabled :style="{ marginRight: '8px' }">禁用的多选框</Checkbox>
                        <Checkbox disabled :style="{ marginRight: '8px' }">禁用的多选框</Checkbox>
                    </div>
                    <div :style="{ ...flexStyle, marginBottom: 0 }">
                        <Radio defaultChecked :style="{ marginRight: '8px' }">单选框</Radio>
                        <Radio defaultChecked disabled :style="{ marginRight: '8px' }">禁用的单选框</Radio>
                        <Radio disabled :style="{ marginRight: '8px' }">禁用的单选框</Radio>
                    </div>
                </Col>
                <Col :span="12">
                    <DatePicker :style="{ width: '100%' }" @change="(_date, dateString) => console.log(dateString)" />
                    <br />
                    <br />
                    <TimePicker :style="{ width: '100%' }" />
                    <br />
                    <br />
                    <Select aria-label="选择器-单选" placeholder="选择器-单选" :style="{ width: '100%' }">
                        <Select.Option value="abc">抖音</Select.Option>
                        <Select.Option value="hotsoon">火山</Select.Option>
                        <Select.Option disabled value="pipixia">皮皮虾</Select.Option>
                        <Select.Option value="xigua">西瓜视频</Select.Option>
                    </Select>
                    <br />
                    <br />
                    <Select aria-label="选择器-禁用" disabled placeholder="选择器-禁用" :style="{ width: '100%' }">
                        <Select.Option value="abc">抖音</Select.Option>
                        <Select.Option value="hotsoon">火山</Select.Option>
                        <Select.Option disabled value="pipixia">皮皮虾</Select.Option>
                        <Select.Option value="xigua">西瓜视频</Select.Option>
                    </Select>
                    <br />
                    <br />
                    <Select aria-label="选择器-多选" multiple placeholder="选择器-多选" :style="{ width: '100%' }">
                        <Select.Option value="abc">抖音</Select.Option>
                        <Select.Option value="hotsoon">火山</Select.Option>
                        <Select.Option disabled value="pipixia">皮皮虾</Select.Option>
                        <Select.Option value="xigua">西瓜视频</Select.Option>
                    </Select>
                    <br />
                    <br />
                    <Cascader placeholder="级联选择器" :style="{ width: '100%' }" :treeData="treeData" />
                </Col>
            </Row>
            <Row>
                <h3 :style="titleStyle">Navigation</h3>
            </Row>
            <Row :style="rowStyle">
                <Breadcrumb>
                    <Breadcrumb.Item>Semi-ui</Breadcrumb.Item>
                    <Breadcrumb.Item>Breadcrumb</Breadcrumb.Item>
                    <Breadcrumb.Item>Default</Breadcrumb.Item>
                </Breadcrumb>
                <Nav :items="navItems" mode="horizontal">
                    <template #icon="{ item }">
                        <component :is="navIconOf(item)" />
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
            <Row>
                <h3 :style="titleStyle">Display</h3>
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
                    <div :style="{ padding: '8px', borderRadius: '4px', backgroundColor: 'var(--semi-color-fill-0)' }">
                        <Badge dot theme="inverted">
                            <Avatar color="green" shape="square" :style="badgeStyle">XM</Avatar>
                        </Badge>
                    </div>
                </div>
                <br />
                <div>
                    <Tag color="grey" :style="tagStyle">grey tag</Tag>
                    <Tag color="blue" :style="tagStyle">blue tag</Tag>
                    <Tag color="blue" :style="tagStyle" type="ghost">ghost tag</Tag>
                    <Tag color="blue" :style="tagStyle" type="solid">solid tag</Tag>
                    <Tag color="red" :style="tagStyle">red tag</Tag>
                    <Tag color="green" :style="tagStyle">green tag</Tag>
                    <Tag color="orange" :style="tagStyle">orange tag</Tag>
                    <Tag color="teal" :style="tagStyle">teal tag</Tag>
                    <Tag color="violet" :style="tagStyle">violet tag</Tag>
                    <Tag color="white" :style="tagStyle">white tag</Tag>
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
            <Row>
                <h3 :style="titleStyle">Feedback</h3>
            </Row>
            <Row :style="rowStyle">
                <Button :style="buttonStyle" type="primary" @click="Notification.success(opts())"> 成功信息的通知 </Button>
                <Button :style="buttonStyle" @click="Notification.info(opts())">提示信息的通知</Button>
                <Button :style="buttonStyle" type="warning" @click="Notification.warning(opts())"> 警告信息的通知 </Button>
                <Button :style="buttonStyle" type="danger" @click="Notification.error(opts())">失败信息的通知</Button>
                <Button aria-label="Vigo 图标通知" :style="buttonStyle" @click="vigoNotice()">
                    <template #icon>
                        <IconVigoLogo />
                    </template>
                </Button>
                <Button aria-label="粉色 Vigo 图标通知" :style="buttonStyle" @click="vigoNotice('pink')">
                    <template #icon>
                        <IconVigoLogo />
                    </template>
                </Button>
                <br />
                <Button :style="buttonStyle" type="primary" @click="Modal.success(opts())">成功信息的弹窗</Button>
                <Button :style="buttonStyle" @click="Modal.info(opts())">提示信息的弹窗</Button>
                <Button :style="buttonStyle" type="warning" @click="Modal.warning(opts())">警告信息的弹窗</Button>
                <Button :style="buttonStyle" type="danger" @click="Modal.error(opts())">失败信息的弹窗</Button>
                <br />
                <Button :style="buttonStyle" type="primary" @click="Toast.success(opts())">成功信息的提示</Button>
                <Button :style="buttonStyle" @click="Toast.info(opts())">提示信息的提示</Button>
                <Button :style="buttonStyle" type="warning" @click="Toast.warning(opts())">警告信息的提示</Button>
                <Button :style="buttonStyle" type="danger" @click="Toast.error(opts())">失败信息的提示</Button>
                <br />
                <br />
                <Spin>
                    <template #tip>I am loading...</template>
                    <div
                        :style="{
                            backgroundColor: 'var(--semi-color-primary-light-default)',
                            border: '1px solid var(--semi-color-primary)',
                            borderRadius: '4px',
                            padding: '16px 10px',
                        }"
                    >
                        <p>Here are some texts.</p>
                        <p>And more texts on the way.</p>
                    </div>
                </Spin>
            </Row>
        </ConfigProvider>
    </div>
</template>
