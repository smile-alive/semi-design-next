import { useState } from 'react';
import { IconSemiLogo, IconCamera, IconBell, IconHelpCircle, IconBytedanceLogo, IconHome, IconHistogram, IconLive, IconSetting, IconEdit, IconList } from '@fibrae/semi-icons-react';
import { Layout, Nav, Button, Breadcrumb, Avatar, Steps, Pagination, Badge, Tag, Rating, Tooltip, Timeline, Popover } from '@fibrae/semi-ui-react';

const rowStyle = { margin: '16px 10px' };
const badgeStyle = {
    width: '42px',
    height: '42px',
    borderRadius: '4px',
    display: 'inline-block',
};
const tagStyle = { marginInlineEnd: '8px', marginBlockEnd: '8px' };

export default function DarkModeDemo() {
    const [mode, setMode] = useState('semi-always-dark');

    const switchMode = () => {
        setMode(mode === 'semi-always-dark' ? 'semi-always-light' : 'semi-always-dark');
    };

    return (
        <>
            <Button onClick={switchMode} style={{ marginBlockEnd: '4px' }}>
                Switch Content Mode
            </Button>
            <Layout style={{ border: '1px solid var(--semi-color-border)' }}>
                <Layout.Header style={{ backgroundColor: 'var(--semi-color-bg-1)' }}>
                    <div>
                        <Nav aria-label="顶部导航" mode="horizontal" defaultSelectedKeys={['Home']}>
                            <Nav.Header>
                                <IconSemiLogo style={{ width: '96px', height: '36px', fontSize: '36px' }} />
                            </Nav.Header>
                            <span
                                style={{
                                    color: 'var(--semi-color-text-2)',
                                }}
                            >
                                <span
                                    style={{
                                        marginInlineEnd: '24px',
                                        color: 'var(--semi-color-text-0)',
                                        fontWeight: '600',
                                    }}
                                >
                                    模版推荐
                                </span>
                                <span style={{ marginInlineEnd: '24px' }}>所有模版</span>
                                <span>我的模版</span>
                            </span>
                            <Nav.Footer>
                                <Button
                                    theme="borderless"
                                    aria-label="通知"
                                    icon={<IconBell size="large" />}
                                    style={{
                                        color: 'var(--semi-color-text-2)',
                                        marginInlineEnd: '12px',
                                    }}
                                />
                                <Button
                                    theme="borderless"
                                    aria-label="帮助"
                                    icon={<IconHelpCircle size="large" />}
                                    style={{
                                        color: 'var(--semi-color-text-2)',
                                        marginInlineEnd: '12px',
                                    }}
                                />
                                <Avatar color="orange" size="small">
                                    YJ
                                </Avatar>
                            </Nav.Footer>
                        </Nav>
                    </div>
                </Layout.Header>
                <Layout>
                    <Layout.Sider style={{ backgroundColor: 'var(--semi-color-bg-1)' }}>
                        <Nav
                            aria-label="侧边导航"
                            style={{ maxWidth: '220px', height: '100%' }}
                            defaultSelectedKeys={['Home']}
                            items={[
                                { itemKey: 'Home', text: '首页', icon: <IconHome size="large" /> },
                                { itemKey: 'Histogram', text: '基础数据', icon: <IconHistogram size="large" /> },
                                { itemKey: 'Live', text: '测试功能', icon: <IconLive size="large" /> },
                                { itemKey: 'Setting', text: '设置', icon: <IconSetting size="large" /> },
                            ]}
                            footer={{
                                collapseButton: true,
                            }}
                        />
                    </Layout.Sider>
                    <Layout.Content
                        className={mode}
                        style={{
                            padding: '24px',
                            backgroundColor: 'var(--semi-color-bg-1)',
                        }}
                    >
                        <Breadcrumb
                            style={{
                                marginBlockEnd: '24px',
                            }}
                            routes={['首页', '当这个页面标题很长时需要省略', '上一页', '详情页']}
                        />
                        <div
                            style={{
                                borderRadius: '10px',
                                border: '1px solid var(--semi-color-border)',
                                height: '700px',
                                padding: '32px',
                            }}
                        >
                            <div style={rowStyle}>
                                <Nav
                                    aria-label="示例导航"
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
                            <div style={rowStyle}>
                                <div style={{ display: 'flex' }}>
                                    <div style={{ padding: '8px' }}>
                                        <Badge count={5} theme="solid">
                                            <Avatar color="blue" shape="square" style={badgeStyle}>
                                                XZ
                                            </Avatar>
                                        </Badge>
                                    </div>
                                    <div style={{ padding: '8px' }}>
                                        <Badge count={5} theme="light">
                                            <Avatar color="cyan" shape="square" style={badgeStyle}>
                                                YB
                                            </Avatar>
                                        </Badge>
                                    </div>
                                    <div style={{ padding: '8px' }}>
                                        <Badge count={5} theme="inverted">
                                            <Avatar color="indigo" shape="square" style={badgeStyle}>
                                                LX
                                            </Avatar>
                                        </Badge>
                                    </div>
                                    <div style={{ padding: '8px' }}>
                                        <Badge dot theme="solid">
                                            <Avatar color="light-blue" shape="square" style={badgeStyle}>
                                                YZ
                                            </Avatar>
                                        </Badge>
                                    </div>
                                    <div style={{ padding: '8px' }}>
                                        <Badge dot theme="light">
                                            <Avatar color="teal" shape="square" style={badgeStyle}>
                                                HW
                                            </Avatar>
                                        </Badge>
                                    </div>
                                    <div
                                        style={{
                                            padding: '8px',
                                            borderRadius: '4px',
                                            backgroundColor: 'var(--semi-color-fill-0)',
                                        }}
                                    >
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
                                    <Popover content="hi semi-design" style={{ padding: '8px' }}>
                                        <Tag style={{ marginInlineEnd: '8px' }}>I am Popover</Tag>
                                    </Popover>
                                    <Tooltip content="hi semi-design">
                                        <Tag style={{ marginInlineEnd: '8px' }}>I am Tooltip</Tag>
                                    </Tooltip>
                                    <Rating defaultValue={3} size="small" style={{ marginInlineEnd: '8px' }} />
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
                        </div>
                    </Layout.Content>
                </Layout>
                <Layout.Footer
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '20px',
                        color: 'var(--semi-color-text-2)',
                        backgroundColor: 'var(--semi-grey-0)',
                    }}
                >
                    <span
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        <IconBytedanceLogo size="large" style={{ marginInlineEnd: '8px' }} />
                        <span>Copyright © 2019 ByteDance. All Rights Reserved. </span>
                    </span>
                    <span>
                        <span style={{ marginInlineEnd: '24px' }}>平台客服</span>
                        <span>反馈建议</span>
                    </span>
                </Layout.Footer>
            </Layout>
        </>
    );
}
