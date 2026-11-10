import { useState, type CSSProperties } from 'react';
import { IconVigoLogo, IconEdit, IconCamera, IconList, IconSidebar, IconChevronDown } from '@fibrae/semi-icons-react';
import { ConfigProvider, ButtonGroup, Button, Row, Col, Notification, DatePicker, TimePicker, Timeline, Popover, Tag, Tooltip, Badge, Avatar, Steps, Pagination, Modal, Breadcrumb, Rating, Nav, Spin, Cascader, Radio, Select, Input, Typography, TextArea, Checkbox, Switch, Toast } from '@fibrae/semi-ui-react';

const flexStyle: CSSProperties = { display: 'flex', marginBlockEnd: 32, flexWrap: 'wrap' };
const titleStyle = { margin: '50px 0 16px 0' };
const rowStyle = { margin: '16px 10px' };
const badgeStyle = {
    width: '42px',
    height: '42px',
    borderRadius: '4px',
    display: 'inline-block',
};
const tagStyle = { marginInlineEnd: 8, marginBlockEnd: 8 };
const buttonStyle = { ...tagStyle };
const treeData = [
    {
        label: '浙江省',
        value: 'zhejiang',
        children: [
            {
                label: '杭州市',
                value: 'hangzhou',
                children: [
                    {
                        label: '西湖区',
                        value: 'xihu',
                    },
                    {
                        label: '萧山区',
                        value: 'xiaoshan',
                    },
                    {
                        label: '临安区',
                        value: 'linan',
                    },
                ],
            },
            {
                label: '宁波市',
                value: 'ningbo',
                children: [
                    {
                        label: '海曙区',
                        value: 'haishu',
                    },
                    {
                        label: '江北区',
                        value: 'jiangbei',
                    },
                ],
            },
        ],
    },
];

export default function ConfigProviderDemo() {
    const [direction, setDirection] = useState<'ltr' | 'rtl'>();
    const opts = {
        title: 'Hi,Bytedance',
        content: 'ies dance dance dance',
        duration: 3,
        direction,
    };

    return (
        <div>
            <div style={{ marginBlockEnd: 20 }}>
                <ButtonGroup>
                    <Button onClick={() => setDirection('ltr')}>LTR</Button>
                    <Button onClick={() => setDirection('rtl')}>RTL</Button>
                </ButtonGroup>
            </div>
            <ConfigProvider direction={direction}>
                <div>
                    <h3 style={titleStyle}>Buttons</h3>
                </div>
                <div style={rowStyle}>
                    <Button loading theme="solid" style={{ marginInlineEnd: 8 }}>
                        加载
                    </Button>
                    <Button icon={<IconSidebar />} theme="solid" style={{ marginInlineEnd: 8 }}>
                        收起
                    </Button>
                    <Button icon={<IconChevronDown />} theme="solid" iconPosition="right" style={{ marginInlineEnd: 8 }}>
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
                <Row style={rowStyle} gutter={16}>
                    <Col span={12}>
                        <Input aria-label="输入框" placeholder="输入框" />
                        <br />
                        <br />
                        <Input aria-label="禁用的输入框" disabled placeholder="输入框" />
                        <br />
                        <br />
                        <Input aria-label="带前缀的输入框" prefix="Prefix" showClear />
                        <br />
                        <br />
                        <Input
                            aria-label="带后缀的输入框"
                            suffix={
                                <Typography.Text strong type="secondary" style={{ margin: '0 8px' }}>
                                    Suffix
                                </Typography.Text>
                            }
                            showClear
                        />
                        <br />
                        <br />
                        <TextArea aria-label="文本框" placeholder="文本框" maxCount={100} />
                        <br />
                        <br />
                        <div style={flexStyle}>
                            <Switch aria-label="已开启的开关" style={{ marginInlineEnd: 8 }} defaultChecked />
                            <Switch aria-label="已关闭的开关" style={{ marginInlineEnd: 8 }} />
                            <Switch aria-label="禁用的开关" disabled defaultChecked style={{ marginInlineEnd: 8 }} />
                        </div>
                        <div style={flexStyle}>
                            <Checkbox style={{ marginInlineEnd: 8 }} defaultChecked>
                                多选框
                            </Checkbox>
                            <Checkbox style={{ marginInlineEnd: 8 }} disabled defaultChecked>
                                禁用的多选框
                            </Checkbox>
                            <Checkbox style={{ marginInlineEnd: 8 }} disabled>
                                禁用的多选框
                            </Checkbox>
                        </div>
                        <div style={{ ...flexStyle, marginBlockEnd: 0 }}>
                            <Radio style={{ marginInlineEnd: 8 }} defaultChecked>
                                单选框
                            </Radio>
                            <Radio style={{ marginInlineEnd: 8 }} disabled defaultChecked>
                                禁用的单选框
                            </Radio>
                            <Radio style={{ marginInlineEnd: 8 }} disabled>
                                禁用的单选框
                            </Radio>
                        </div>
                    </Col>
                    <Col span={12}>
                        <DatePicker onChange={(_date, dateString) => console.log(dateString)} style={{ width: '100%' }} />
                        <br />
                        <br />
                        <TimePicker style={{ width: '100%' }} />
                        <br />
                        <br />
                        <Select aria-label="选择器-单选" style={{ width: '100%' }} placeholder="选择器-单选">
                            <Select.Option value="abc">抖音</Select.Option>
                            <Select.Option value="hotsoon">火山</Select.Option>
                            <Select.Option value="pipixia" disabled>
                                皮皮虾
                            </Select.Option>
                            <Select.Option value="xigua">西瓜视频</Select.Option>
                        </Select>
                        <br />
                        <br />
                        <Select aria-label="选择器-禁用" disabled style={{ width: '100%' }} placeholder="选择器-禁用">
                            <Select.Option value="abc">抖音</Select.Option>
                            <Select.Option value="hotsoon">火山</Select.Option>
                            <Select.Option value="pipixia" disabled>
                                皮皮虾
                            </Select.Option>
                            <Select.Option value="xigua">西瓜视频</Select.Option>
                        </Select>
                        <br />
                        <br />
                        <Select aria-label="选择器-多选" multiple style={{ width: '100%' }} placeholder="选择器-多选">
                            <Select.Option value="abc">抖音</Select.Option>
                            <Select.Option value="hotsoon">火山</Select.Option>
                            <Select.Option value="pipixia" disabled>
                                皮皮虾
                            </Select.Option>
                            <Select.Option value="xigua">西瓜视频</Select.Option>
                        </Select>
                        <br />
                        <br />
                        <Cascader style={{ width: '100%' }} treeData={treeData} placeholder="级联选择器" />
                    </Col>
                </Row>
                <div>
                    <h3 style={titleStyle}>Navigation</h3>
                </div>
                <div style={rowStyle}>
                    <Breadcrumb>
                        <Breadcrumb.Item>Semi-ui</Breadcrumb.Item>
                        <Breadcrumb.Item>Breadcrumb</Breadcrumb.Item>
                        <Breadcrumb.Item>Default</Breadcrumb.Item>
                    </Breadcrumb>
                    <Nav
                        mode="horizontal"
                        items={[
                            { itemKey: 'user', text: 'Option1', icon: <IconEdit /> },
                            { itemKey: 'union', text: 'Option2', icon: <IconCamera /> },
                            {
                                itemKey: 'approve-management',
                                text: 'Group3',
                                icon: <IconList />,
                                items: ['3-1', '3-2'],
                            },
                        ]}
                    />
                    <br />
                    <br />
                    <Pagination total={80} showSizeChanger />
                    <br />
                    <Steps current={1}>
                        <Steps.Step title="Finished" description="This is a description." />
                        <Steps.Step title="In Progress" description="This is a description." />
                        <Steps.Step title="Waiting" description="This is a description." />
                    </Steps>
                    <br />
                    <Steps current={1} status="error">
                        <Steps.Step title="Finished" description="This is a description" />
                        <Steps.Step title="In Process" description="This is a description" />
                        <Steps.Step title="Waiting" description="This is a description" />
                    </Steps>
                </div>
                <div>
                    <h3 style={titleStyle}>Display</h3>
                </div>
                <div style={rowStyle}>
                    <div style={{ display: 'flex' }}>
                        <div style={{ padding: 8 }}>
                            <Badge count={5} theme="solid">
                                <Avatar color="blue" shape="square" style={badgeStyle}>
                                    XZ
                                </Avatar>
                            </Badge>
                        </div>
                        <div style={{ padding: 8 }}>
                            <Badge count={5} theme="light">
                                <Avatar color="cyan" shape="square" style={badgeStyle}>
                                    YB
                                </Avatar>
                            </Badge>
                        </div>
                        <div style={{ padding: 8 }}>
                            <Badge count={5} theme="inverted">
                                <Avatar color="indigo" shape="square" style={badgeStyle}>
                                    LX
                                </Avatar>
                            </Badge>
                        </div>
                        <div style={{ padding: 8 }}>
                            <Badge dot theme="solid">
                                <Avatar color="light-blue" shape="square" style={badgeStyle}>
                                    YZ
                                </Avatar>
                            </Badge>
                        </div>
                        <div style={{ padding: 8 }}>
                            <Badge dot theme="light">
                                <Avatar color="teal" shape="square" style={badgeStyle}>
                                    HW
                                </Avatar>
                            </Badge>
                        </div>
                        <div style={{ padding: '8px', borderRadius: '4px', backgroundColor: 'var(--semi-color-fill-0)' }}>
                            <Badge dot theme="inverted">
                                <Avatar color="green" shape="square" style={badgeStyle}>
                                    XM
                                </Avatar>
                            </Badge>
                        </div>
                    </div>
                    <br />
                    <div>
                        <Tag color="grey" style={tagStyle}>
                            grey tag
                        </Tag>
                        <Tag color="blue" style={tagStyle}>
                            blue tag
                        </Tag>
                        <Tag color="blue" type="ghost" style={tagStyle}>
                            ghost tag
                        </Tag>
                        <Tag color="blue" type="solid" style={tagStyle}>
                            solid tag
                        </Tag>
                        <Tag color="red" style={tagStyle}>
                            red tag
                        </Tag>
                        <Tag color="green" style={tagStyle}>
                            green tag
                        </Tag>
                        <Tag color="orange" style={tagStyle}>
                            orange tag
                        </Tag>
                        <Tag color="teal" style={tagStyle}>
                            teal tag
                        </Tag>
                        <Tag color="violet" style={tagStyle}>
                            violet tag
                        </Tag>
                        <Tag color="white" style={tagStyle}>
                            white tag
                        </Tag>
                    </div>
                    <br />
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Popover content="hi semi-design" style={{ padding: 8 }}>
                            <Tag style={{ marginInlineEnd: 8 }}>I am Popover</Tag>
                        </Popover>
                        <Tooltip content="hi semi-design">
                            <Tag style={{ marginInlineEnd: 8 }}>I am Tooltip</Tag>
                        </Tooltip>
                        <Rating defaultValue={3} size="small" style={{ marginInlineEnd: 8 }} />
                    </div>
                    <br />
                    <Timeline>
                        <Timeline.Item time="2019-07-14 10:35" type="ongoing">
                            审核中
                        </Timeline.Item>
                        <Timeline.Item time="2019-06-13 16:17" type="success">
                            发布成功
                        </Timeline.Item>
                        <Timeline.Item time="2019-05-14 18:34" type="error">
                            审核失败
                        </Timeline.Item>
                    </Timeline>
                </div>
                <div>
                    <h3 style={titleStyle}>Feedback</h3>
                </div>
                <div style={rowStyle}>
                    <Button type="primary" onClick={() => Notification.success(opts)} style={buttonStyle}>
                        成功信息的通知
                    </Button>
                    <Button onClick={() => Notification.info(opts)} style={buttonStyle}>
                        提示信息的通知
                    </Button>
                    <Button type="warning" onClick={() => Notification.warning(opts)} style={buttonStyle}>
                        警告信息的通知
                    </Button>
                    <Button type="danger" onClick={() => Notification.error(opts)} style={buttonStyle}>
                        失败信息的通知
                    </Button>
                    <Button style={buttonStyle} aria-label="Vigo 图标通知" icon={<IconVigoLogo />} onClick={() => Notification.info({ ...opts, icon: <IconVigoLogo /> })} />
                    <Button style={buttonStyle} aria-label="粉色 Vigo 图标通知" icon={<IconVigoLogo />} onClick={() => Notification.info({ ...opts, icon: <IconVigoLogo style={{ color: 'pink' }} /> })} />
                    <br />
                    <Button type="primary" onClick={() => Modal.success(opts)} style={buttonStyle}>
                        成功信息的弹窗
                    </Button>
                    <Button onClick={() => Modal.info(opts)} style={buttonStyle}>
                        提示信息的弹窗
                    </Button>
                    <Button type="warning" onClick={() => Modal.warning(opts)} style={buttonStyle}>
                        警告信息的弹窗
                    </Button>
                    <Button type="danger" onClick={() => Modal.error(opts)} style={buttonStyle}>
                        失败信息的弹窗
                    </Button>
                    <br />
                    <Button type="primary" onClick={() => Toast.success(opts)} style={buttonStyle}>
                        成功信息的提示
                    </Button>
                    <Button onClick={() => Toast.info(opts)} style={buttonStyle}>
                        提示信息的提示
                    </Button>
                    <Button type="warning" onClick={() => Toast.warning(opts)} style={buttonStyle}>
                        警告信息的提示
                    </Button>
                    <Button type="danger" onClick={() => Toast.error(opts)} style={buttonStyle}>
                        失败信息的提示
                    </Button>
                    <br />
                    <br />
                    <Spin tip="I am loading...">
                        <div
                            style={{
                                backgroundColor: 'var(--semi-color-primary-light-default)',
                                border: '1px solid var(--semi-color-primary)',
                                borderRadius: '4px',
                                padding: '16px 10px',
                            }}
                        >
                            <p>Here are some texts.</p>
                            <p>And more texts on the way.</p>
                        </div>
                    </Spin>
                </div>
            </ConfigProvider>
        </div>
    );
}
