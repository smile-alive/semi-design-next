import { useState } from 'react';
import { IconUser, IconSemiLogo, IconStar } from '@fibrae/semi-icons-react';
import { LocaleProvider, ConfigProvider, Pagination, Modal, Button, Select, Cascader, DatePicker, TreeSelect, Table, TimePicker, List, Calendar, Typography, Transfer, ImagePreview, Image, Form, FormInput, Nav } from '@fibrae/semi-ui-react';
import { en_US, zh_CN } from '@fibrae/semi-ui-react/locale';

const treeData = [
    {
        label: 'Asia',
        value: 'asia',
        key: '1',
        children: [
            {
                label: 'China',
                value: 'china',
                key: '1-0',
                children: [
                    { label: 'Beijing', value: 'beijing', key: '1-0-0' },
                    { label: 'Shanghai', value: 'shanghai', key: '1-0-1' },
                ],
            },
            {
                label: 'Japan',
                value: 'japan',
                key: '1-1',
                children: [{ label: 'Osaka', value: 'osaka', key: '1-1-0' }],
            },
        ],
    },
];
const columns = [
    {
        title: 'Name',
        width: 250,
        dataIndex: 'name',
    },
    {
        title: 'Age',
        width: 150,
        dataIndex: 'age',
    },
    {
        title: 'Address',
        dataIndex: 'address',
    },
];

const dataSource = Array.from({ length: 46 }, (_, i) => ({
    key: String(i),
    name: `Example ${i}`,
    age: 32,
    address: `Beijing, Haidian. Zhichun Road ${i}`,
}));

const transferData = Array.from({ length: 100 }, (_, i) => ({
    label: `选项名称 ${i}`,
    value: i,
    disabled: false,
    key: i,
}));

const srcList = ['/assets/root-web-sites/abstract.jpg', '/assets/root-web-sites/sky.jpg', '/assets/root-web-sites/greenleaf.jpg', '/assets/root-web-sites/colorful.jpg'];

const style = { margin: 10 };

function I18nComponent() {
    const [modalVisible, setModalVisible] = useState(false);
    return (
        <>
            <h5>Pagination</h5>
            <Pagination total={100} showTotal showSizeChanger style={style} showQuickJumper />
            <h5>Modal</h5>

            <div style={style}>
                <Button onClick={() => setModalVisible(true)}>Show Modal</Button>
                <Modal title="Modal" visible={modalVisible} onOk={() => setModalVisible(false)} onCancel={() => setModalVisible(false)}>
                    <p>This is the content of a basic modal.</p>
                    <p>More content...</p>
                </Modal>
            </div>
            <h5>Select & Cascader</h5>
            <div style={style}>
                <Select aria-label="Select" filter style={{ width: '180px' }}>
                    <Select.Option value="abc">abc</Select.Option>
                    <Select.Option value="vigo" disabled>
                        vigo
                    </Select.Option>
                    <Select.Option value="hotsoon">hotsoon</Select.Option>
                </Select>
                <Cascader style={{ width: 300, margin: 10 }} treeData={treeData} filterTreeNode prefix="Cascader" />
            </div>
            <h5>DatePicker</h5>
            <DatePicker style={{ ...style, width: 250 }} />
            <DatePicker style={{ ...style, width: 300 }} type="dateTime" />
            <DatePicker style={{ ...style, width: 300 }} type="dateRange" />
            <DatePicker style={{ ...style, width: 450 }} type="dateTimeRange" />
            <h5>TimePicker</h5>
            <TimePicker style={style} />
            <TimePicker use12Hours style={style} />
            <br />
            <br />
            <h5>TreeSelect</h5>
            <TreeSelect style={{ ...style, width: 300 }} styles={{ dropdown: { maxHeight: 400, overflow: 'auto' } }} treeData={treeData} filterTreeNode />
            <h5>Table</h5>
            <Table columns={columns} dataSource={dataSource} scroll={{ y: 320 }} />
            <h5>Table - Empty</h5>
            <Table columns={columns} dataSource={[]} scroll={{ y: 320 }} />
            <h5>List - Empty</h5>
            <List header={<div>List</div>} dataSource={[]} />
            <h5>Calendar</h5>
            <Calendar mode="month" displayValue={new Date(2024, 4, 6, 12)} />
            <h5>Typography - Copyable</h5>
            <Typography.Paragraph copyable>Click to copy text.</Typography.Paragraph>
            <h5>Typography - Collapsible</h5>
            <Typography.Paragraph ellipsis={{ rows: 3, expandable: true, collapsible: true }} style={{ width: 300 }}>
                支持展开和折叠：Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用。设计系统包含设计语言以及一整套可复用的前端组件，帮助设计师与开发者更容易地打造高质量的、用户体验一致的、符合设计规范的 Web 应用。
            </Typography.Paragraph>
            <h5>Transfer</h5>
            <Transfer style={{ width: 568, height: 416 }} dataSource={transferData} />
            <h5>Image</h5>
            <ImagePreview showTooltip>
                {srcList.map((src, index) => {
                    return <Image key={index} src={src} width={200} alt={`lamp${index + 1}`} style={{ marginInlineEnd: 5 }} />;
                })}
            </ImagePreview>
            <h5>Form</h5>
            <Form layout="horizontal" onValueChange={(values) => console.log(values)}>
                <FormInput field="UserName" label={{ text: '角色', optional: true }} style={{ width: 200 }} />
            </Form>
            <h5>Navigation</h5>
            <Nav
                styles={{ body: { height: 320 } }}
                items={[
                    { itemKey: 'user', text: '用户管理', icon: <IconUser /> },
                    { itemKey: 'union', text: '活动管理', icon: <IconStar /> },
                ]}
                header={{
                    logo: <IconSemiLogo style={{ height: '36px', fontSize: 36 }} />,
                    text: 'Semi 数据后台',
                }}
                footer={{
                    collapseButton: true,
                }}
            />
        </>
    );
}

export default function LocaleDemo() {
    const [code, setCode] = useState('zh_CN');
    const locale = code === 'en_US' ? en_US : zh_CN;

    return (
        <>
            <div style={{ borderBlockEnd: '1px solid var(--semi-color-border)', paddingBlockEnd: 20 }}>
                <Select aria-label="切换语言" onChange={(value) => setCode(String(value))} prefix="切换语言" style={{ width: 250 }} value={code}>
                    <Select.Option value="zh_CN">简体中文</Select.Option>
                    <Select.Option value="en_US">英语（美）</Select.Option>
                </Select>
            </div>
            <LocaleProvider locale={locale}>
                <ConfigProvider locale={locale}>
                    <I18nComponent key={code} />
                </ConfigProvider>
            </LocaleProvider>
        </>
    );
}
