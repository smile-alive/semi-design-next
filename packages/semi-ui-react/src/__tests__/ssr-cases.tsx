import type { ReactElement } from 'react';
import { expect } from 'vite-plus/test';
import { IconHome } from '@fibrae/semi-icons-react';
import { IllustrationNoContent } from '@fibrae/semi-illustrations-react';
import {
    Anchor,
    ArrayField,
    AudioPlayer,
    AutoComplete,
    Avatar,
    AvatarGroup,
    BackTop,
    Badge,
    Banner,
    Breadcrumb,
    Button,
    ButtonGroup,
    Calendar,
    Card,
    CardGroup,
    Carousel,
    Cascader,
    Checkbox,
    CheckboxGroup,
    CodeHighlight,
    Col,
    Collapse,
    Collapsible,
    ColorPicker,
    ConfigConsumer,
    ConfigProvider,
    Cropper,
    DatePicker,
    Descriptions,
    Divider,
    DragMove,
    Dropdown,
    DropdownDivider,
    DropdownItem,
    DropdownMenu,
    Empty,
    Feedback,
    FloatButton,
    FloatButtonGroup,
    Form,
    Highlight,
    HotKeys,
    Icon,
    IconButton,
    Image,
    ImagePreview,
    Input,
    InputGroup,
    InputNumber,
    JsonViewer,
    Layout,
    List,
    LocaleConsumer,
    LocaleProvider,
    Lottie,
    MarkdownRender,
    Modal,
    Nav,
    NavItem,
    Notification,
    OverflowList,
    Pagination,
    PinCode,
    Popconfirm,
    Popover,
    Progress,
    Radio,
    RadioGroup,
    Rating,
    Resizable,
    ResizeGroup,
    ResizeHandler,
    ResizeItem,
    Row,
    ScrollItem,
    ScrollList,
    Select,
    SideSheet,
    Skeleton,
    Slider,
    Space,
    Spin,
    SplitButtonGroup,
    SplitTagGroup,
    Step,
    Steps,
    SubNav,
    Switch,
    Table,
    TabPane,
    Tabs,
    Tag,
    TagGroup,
    TagInput,
    TextArea,
    Timeline,
    TimePicker,
    Toast,
    Tooltip,
    Transfer,
    Tree,
    TreeSelect,
    Typography,
    TypographyNumeral,
    TypographyParagraph,
    TypographyText,
    TypographyTitle,
    Upload,
    UserGuide,
    VideoPlayer,
} from '../index';

export interface SsrCase {
    // `<component directory>/<scenario>`, so `-t '^(tooltip|popover)/'` selects by directory
    name: string;
    // index.ts exports this case renders; the coverage guard requires every component export in some case
    covers: string[];
    element: () => ReactElement;
    // Server HTML must contain these and pass `check`: React does not compare form control values, so hydration cannot
    // catch them
    html?: string[];
    // for what a substring cannot pin to the controlled value, such as which tab is selected
    check?: (markup: string) => void;
    // Role of the popup a default-open case shows once hydrated; the server leaves popups out
    opened?: string;
}

// Fixed dates: the server project does not freeze the clock, and a server-chosen "today" differs from the client's
const day = new Date(2026, 9, 31, 8, 30);
const options = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Bravo' },
];
const treeData = [{ key: 'asia', value: 'asia', label: 'Asia', children: [{ key: 'china', value: 'china', label: 'China' }] }];
const columns = [{ title: 'Name', dataIndex: 'name', sorter: (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name) }];
const rows = Array.from({ length: 30 }, (_, index) => ({ key: String(index), name: `row-${index}` }));
const transferData = [
    { key: 'a', label: 'Alpha', value: 'a' },
    { key: 'b', label: 'Bravo', value: 'b' },
];
const image = 'https://localhost/a.png';
// reads document like a caller's getter does, so calling it while rendering on the server throws
const documentBody = () => document.body;

function ToastHolder() {
    const [, contextHolder] = Toast.useToast();
    return <div>{contextHolder}</div>;
}

function NotificationHolder() {
    const [, contextHolder] = Notification.useNotification();
    return <div>{contextHolder}</div>;
}

function ModalHolder() {
    const [, contextHolder] = Modal.useModal();
    return <div>{contextHolder}</div>;
}

export const ssrCases: SsrCase[] = [
    {
        name: 'anchor/默认',
        covers: ['Anchor'],
        element: () => (
            <Anchor>
                <Anchor.Link title="A" href="#a" />
            </Anchor>
        ),
    },
    { name: 'audio-player/默认', covers: ['AudioPlayer'], element: () => <AudioPlayer audioUrl="https://localhost/a.mp3" /> },
    { name: 'auto-complete/默认', covers: ['AutoComplete'], element: () => <AutoComplete data={['semi']} /> },
    { name: 'auto-complete/受控值', covers: ['AutoComplete'], element: () => <AutoComplete value="semi" data={['semi']} />, html: ['value="semi"'] },
    { name: 'auto-complete/默认打开', covers: ['AutoComplete'], element: () => <AutoComplete data={['semi']} defaultOpen />, opened: 'listbox' },
    { name: 'avatar/文字', covers: ['Avatar'], element: () => <Avatar>SD</Avatar> },
    { name: 'avatar/图片', covers: ['Avatar'], element: () => <Avatar alt="a" src={image} /> },
    {
        name: 'avatar/头像组',
        covers: ['AvatarGroup'],
        element: () => (
            <AvatarGroup maxCount={1}>
                <Avatar>A</Avatar>
                <Avatar>B</Avatar>
            </AvatarGroup>
        ),
    },
    { name: 'backtop/默认', covers: ['BackTop'], element: () => <BackTop /> },
    {
        name: 'badge/默认',
        covers: ['Badge'],
        element: () => (
            <Badge count={5}>
                <span>a</span>
            </Badge>
        ),
    },
    { name: 'banner/默认', covers: ['Banner'], element: () => <Banner description="d" /> },
    {
        name: 'breadcrumb/默认',
        covers: ['Breadcrumb'],
        element: () => (
            <Breadcrumb>
                <Breadcrumb.Item>Home</Breadcrumb.Item>
                <Breadcrumb.Item>Page</Breadcrumb.Item>
            </Breadcrumb>
        ),
    },
    // No default-open case: moreType="popover" takes no props that open its popover from outside
    { name: 'button/默认', covers: ['Button'], element: () => <Button>Go</Button> },
    {
        name: 'button/加载中带图标',
        covers: ['Button'],
        element: () => (
            <Button loading icon={<IconHome />}>
                Go
            </Button>
        ),
    },
    {
        name: 'button/按钮组',
        covers: ['ButtonGroup'],
        element: () => (
            <ButtonGroup>
                <Button>A</Button>
                <Button>B</Button>
            </ButtonGroup>
        ),
    },
    {
        name: 'button/分裂按钮组',
        covers: ['SplitButtonGroup'],
        element: () => (
            <SplitButtonGroup>
                <Button>A</Button>
                <Button>B</Button>
            </SplitButtonGroup>
        ),
    },
    { name: 'calendar/月视图', covers: ['Calendar'], element: () => <Calendar displayValue={day} events={[{ key: 'e', start: day, end: day, children: <b>event</b> }]} mode="month" /> },
    { name: 'calendar/周视图', covers: ['Calendar'], element: () => <Calendar displayValue={day} mode="week" showCurrTime /> },
    { name: 'calendar/日视图', covers: ['Calendar'], element: () => <Calendar displayValue={day} mode="day" showCurrTime /> },
    { name: 'calendar/范围视图', covers: ['Calendar'], element: () => <Calendar displayValue={day} mode="range" range={[new Date(2026, 9, 29), new Date(2026, 10, 2)]} /> },
    {
        name: 'card/默认',
        covers: ['Card'],
        element: () => (
            <Card title="t">
                <Card.Meta title="m" />
            </Card>
        ),
    },
    {
        name: 'card/卡片组',
        covers: ['CardGroup'],
        element: () => (
            <CardGroup>
                <Card title="t" />
            </CardGroup>
        ),
    },
    {
        name: 'carousel/默认',
        covers: ['Carousel'],
        element: () => (
            <Carousel>
                <div>slide-1</div>
                <div>slide-2</div>
            </Carousel>
        ),
    },
    { name: 'cascader/默认', covers: ['Cascader'], element: () => <Cascader treeData={treeData} /> },
    { name: 'cascader/受控值', covers: ['Cascader'], element: () => <Cascader value={['asia', 'china']} treeData={treeData} />, html: ['China'] },
    { name: 'cascader/默认打开', covers: ['Cascader'], element: () => <Cascader defaultOpen treeData={treeData} />, opened: 'tree' },
    { name: 'checkbox/默认', covers: ['Checkbox'], element: () => <Checkbox checked>Check</Checkbox> },
    { name: 'checkbox/复选框组', covers: ['CheckboxGroup'], element: () => <CheckboxGroup value={['a']} options={options} /> },
    { name: 'code-highlight/默认', covers: ['CodeHighlight'], element: () => <CodeHighlight code="const a = 1;" language="js" /> },
    {
        name: 'collapse/默认',
        covers: ['Collapse'],
        element: () => (
            <Collapse defaultActiveKey="1">
                <Collapse.Panel header="h" itemKey="1">
                    body
                </Collapse.Panel>
            </Collapse>
        ),
    },
    { name: 'collapsible/展开', covers: ['Collapsible'], element: () => <Collapsible isOpen>content</Collapsible> },
    { name: 'color-picker/默认', covers: ['ColorPicker'], element: () => <ColorPicker /> },
    { name: 'color-picker/弹层', covers: ['ColorPicker'], element: () => <ColorPicker usePopover /> },
    { name: 'color-picker/默认打开', covers: ['ColorPicker'], element: () => <ColorPicker popoverProps={{ trigger: 'custom', visible: true }} usePopover />, opened: 'dialog' },
    {
        name: 'config-provider/时区与方向',
        covers: ['ConfigProvider', 'ConfigConsumer'],
        element: () => (
            <ConfigProvider direction="rtl" timeZone="Asia/Tokyo">
                <ConfigConsumer>{({ direction }) => <span>{direction}</span>}</ConfigConsumer>
                <DatePicker type="dateTime" value={day} />
            </ConfigProvider>
        ),
        // the test runs in Asia/Shanghai, an hour behind Tokyo
        html: ['>rtl<', 'value="2026-10-31 09:30:00"'],
    },
    { name: 'cropper/默认', covers: ['Cropper'], element: () => <Cropper src={image} /> },
    { name: 'date-picker/默认', covers: ['DatePicker'], element: () => <DatePicker /> },
    { name: 'date-picker/date 受控值', covers: ['DatePicker'], element: () => <DatePicker value={day} />, html: ['value="2026-10-31"'] },
    {
        name: 'date-picker/dateRange 受控值',
        covers: ['DatePicker'],
        element: () => <DatePicker type="dateRange" value={[day, new Date(2026, 10, 2)]} />,
        html: ['value="2026-10-31"', 'value="2026-11-02"'],
    },
    { name: 'date-picker/month 受控值', covers: ['DatePicker'], element: () => <DatePicker type="month" value={day} />, html: ['value="2026-10"'] },
    { name: 'date-picker/dateTime 受控值', covers: ['DatePicker'], element: () => <DatePicker type="dateTime" value={day} />, html: ['value="2026-10-31 08:30:00"'] },
    { name: 'date-picker/默认打开', covers: ['DatePicker'], element: () => <DatePicker defaultOpen />, opened: 'grid' },
    { name: 'descriptions/默认', covers: ['Descriptions'], element: () => <Descriptions data={[{ key: 'k', value: 'v' }]} /> },
    { name: 'divider/默认', covers: ['Divider'], element: () => <Divider>text</Divider> },
    {
        name: 'drag-move/默认',
        covers: ['DragMove'],
        element: () => (
            <DragMove>
                <div>drag</div>
            </DragMove>
        ),
    },
    {
        name: 'dropdown/默认打开',
        covers: ['Dropdown', 'DropdownMenu', 'DropdownItem', 'DropdownDivider'],
        element: () => (
            <Dropdown
                render={
                    <DropdownMenu>
                        <DropdownItem>A</DropdownItem>
                        <DropdownDivider />
                        <DropdownItem>B</DropdownItem>
                    </DropdownMenu>
                }
                trigger="custom"
                visible
            >
                <Button>Menu</Button>
            </Dropdown>
        ),
        opened: 'menu',
    },
    { name: 'empty/默认', covers: ['Empty'], element: () => <Empty description="none" image={<IllustrationNoContent />} /> },
    { name: 'empty/暗色图', covers: ['Empty'], element: () => <Empty darkModeImage={<IllustrationNoContent />} image={<IllustrationNoContent />} /> },
    { name: 'feedback/弹窗默认打开', covers: ['Feedback'], element: () => <Feedback type="text" mode="modal" visible />, opened: 'dialog' },
    { name: 'feedback/侧边栏默认打开', covers: ['Feedback'], element: () => <Feedback type="text" visible />, opened: 'dialog' },
    { name: 'float-button/默认', covers: ['FloatButton'], element: () => <FloatButton icon={<IconHome />} /> },
    { name: 'float-button/按钮组', covers: ['FloatButtonGroup'], element: () => <FloatButtonGroup items={[{ value: 'a', content: 'A' }]} /> },
    {
        name: 'form/initValues',
        covers: ['Form'],
        element: () => (
            <Form initValues={{ name: 'semi', kind: 'a' }}>
                <Form.Input field="name" label="Name" />
                <Form.Select field="kind" label="Kind" optionList={options} />
            </Form>
        ),
        html: ['value="semi"', 'Alpha'],
    },
    {
        name: 'form/initValues 含 File',
        covers: ['Form'],
        element: () => (
            <Form initValues={{ files: [{ uid: '1', name: 'a.txt', status: 'success', fileInstance: new File(['a'], 'a.txt') }] }}>
                <Form.Upload action="/upload" field="files" label="Files" />
            </Form>
        ),
        html: ['a.txt'],
    },
    {
        name: 'form/ArrayField',
        covers: ['ArrayField'],
        element: () => (
            <Form initValues={{ rules: [{ name: 'r1' }] }}>
                <ArrayField field="rules">{({ arrayFields }) => arrayFields.map(({ field, key }) => <Form.Input key={key} field={`${field}.name`} />)}</ArrayField>
            </Form>
        ),
        html: ['value="r1"'],
    },
    {
        name: 'grid/默认',
        covers: ['Row', 'Col'],
        element: () => (
            <Row gutter={8}>
                <Col span={12}>a</Col>
                <Col span={12}>b</Col>
            </Row>
        ),
    },
    { name: 'highlight/默认', covers: ['Highlight'], element: () => <Highlight searchWords={['semi']} sourceString="semi design" /> },
    { name: 'hot-keys/默认', covers: ['HotKeys'], element: () => <HotKeys hotKeys={['Control', 'a']} /> },
    { name: 'icon-button/默认', covers: ['IconButton'], element: () => <IconButton aria-label="home" icon={<IconHome />} /> },
    { name: 'icons/默认', covers: ['Icon'], element: () => <Icon svg={<svg viewBox="0 0 24 24" />} /> },
    { name: 'image/默认', covers: ['Image'], element: () => <Image alt="a" height={100} src={image} width={100} /> },
    { name: 'image/回退图', covers: ['Image'], element: () => <Image alt="a" fallback="fallback" height={100} src={image} width={100} /> },
    { name: 'image/预览默认打开', covers: ['Image'], element: () => <Image alt="a" height={100} preview={{ visible: true }} src={image} width={100} />, opened: 'dialog' },
    { name: 'image/预览组件默认打开', covers: ['ImagePreview'], element: () => <ImagePreview src={[image]} visible />, opened: 'dialog' },
    { name: 'image/预览指定容器', covers: ['ImagePreview'], element: () => <ImagePreview getPopupContainer={documentBody} src={[image]} visible />, opened: 'dialog' },
    { name: 'input/受控值', covers: ['Input'], element: () => <Input value="hello" />, html: ['value="hello"'] },
    {
        name: 'input/输入框组',
        covers: ['InputGroup'],
        element: () => (
            <InputGroup disabled size="small">
                <Input />
                <Input />
            </InputGroup>
        ),
        html: ['semi-input-wrapper-small', 'disabled=""'],
    },
    { name: 'input/文本域', covers: ['TextArea'], element: () => <TextArea value="multi" autosize />, html: ['multi'] },
    { name: 'input-number/受控值', covers: ['InputNumber'], element: () => <InputNumber value={1234.5} formatter={(value) => `${value}%`} parser={(value) => value.replace('%', '')} />, html: ['value="1234.5%"'] },
    { name: 'json-viewer/默认', covers: ['JsonViewer'], element: () => <JsonViewer value='{"a":1}' /> },
    {
        name: 'layout/带侧边栏',
        covers: ['Layout'],
        element: () => (
            <Layout>
                <Layout.Sider>side</Layout.Sider>
                <Layout>
                    <Layout.Header>head</Layout.Header>
                    <Layout.Content>body</Layout.Content>
                    <Layout.Footer>foot</Layout.Footer>
                </Layout>
            </Layout>
        ),
    },
    { name: 'list/默认', covers: ['List'], element: () => <List dataSource={['a', 'b']} renderItem={(item) => <List.Item>{item}</List.Item>} /> },
    {
        name: 'locale/默认',
        covers: ['LocaleProvider', 'LocaleConsumer'],
        element: () => (
            <LocaleProvider>
                <LocaleConsumer componentName="Pagination">{(locale) => <span>{String(Boolean(locale))}</span>}</LocaleConsumer>
            </LocaleProvider>
        ),
    },
    { name: 'lottie/默认', covers: ['Lottie'], element: () => <Lottie params={{}} /> },
    { name: 'markdown-render/md', covers: ['MarkdownRender'], element: () => <MarkdownRender format="md" raw="# Title\n\nhello **world**" />, html: ['Title', 'world'] },
    { name: 'markdown-render/mdx', covers: ['MarkdownRender'], element: () => <MarkdownRender format="mdx" raw="hello" /> },
    {
        name: 'modal/默认打开',
        covers: ['Modal'],
        element: () => (
            <Modal title="t" visible>
                body
            </Modal>
        ),
        opened: 'dialog',
    },
    {
        name: 'modal/keepDOM 关闭',
        covers: ['Modal'],
        element: () => (
            <Modal title="t" keepDOM visible={false} lazyRender={false}>
                body
            </Modal>
        ),
    },
    {
        name: 'modal/指定容器',
        covers: ['Modal'],
        element: () => (
            <Modal title="t" getPopupContainer={documentBody} visible>
                body
            </Modal>
        ),
        opened: 'dialog',
    },
    { name: 'modal/useModal', covers: ['Modal'], element: () => <ModalHolder /> },
    {
        name: 'navigation/默认',
        covers: ['Nav', 'NavItem', 'SubNav'],
        element: () => (
            <Nav defaultSelectedKeys={['home']} footer={{ collapseButton: true }} header={{ text: 'Semi' }}>
                <NavItem itemKey="home" text="Home" icon={<IconHome />} />
                <SubNav itemKey="more" text="More">
                    <NavItem itemKey="a" text="A" />
                </SubNav>
            </Nav>
        ),
    },
    { name: 'navigation/折叠', covers: ['Nav'], element: () => <Nav isCollapsed items={[{ itemKey: 'home', text: 'Home', icon: <IconHome /> }]} /> },
    {
        // openKeys cannot open a popup-mode submenu; its Dropdown can
        name: 'navigation/子菜单默认打开',
        covers: ['Nav', 'SubNav'],
        element: () => (
            <Nav mode="horizontal">
                <SubNav dropdownProps={{ trigger: 'custom', visible: true }} itemKey="more" text="More">
                    <NavItem itemKey="a" text="A" />
                </SubNav>
            </Nav>
        ),
        opened: 'menu',
    },
    { name: 'notification/useNotification', covers: ['Notification'], element: () => <NotificationHolder /> },
    {
        name: 'overflow-list/默认',
        covers: ['OverflowList'],
        element: () => <OverflowList items={[{ key: 'a' }, { key: 'b' }]} overflowRenderer={(items) => <span>+{items.length}</span>} visibleItemRenderer={(item) => <span key={item.key}>{item.key}</span>} />,
    },
    { name: 'pagination/受控页码', covers: ['Pagination'], element: () => <Pagination currentPage={3} showSizeChanger total={100} />, check: (markup) => expect(markup).toMatch(/aria-current="page"[^>]*>3</) },
    { name: 'pincode/默认', covers: ['PinCode'], element: () => <PinCode value="12" count={4} />, html: ['value="1"', 'value="2"'] },
    {
        name: 'popconfirm/默认打开',
        covers: ['Popconfirm'],
        element: () => (
            <Popconfirm title="Sure?" trigger="custom" visible>
                <Button>Delete</Button>
            </Popconfirm>
        ),
        opened: 'dialog',
    },
    {
        name: 'popover/默认打开',
        covers: ['Popover'],
        element: () => (
            <Popover content="tip" showArrow trigger="custom" visible>
                <Button>Hover</Button>
            </Popover>
        ),
        opened: 'dialog',
    },
    { name: 'progress/默认', covers: ['Progress'], element: () => <Progress aria-label="p" percent={30} /> },
    { name: 'progress/环形', covers: ['Progress'], element: () => <Progress type="circle" aria-label="p" percent={30} /> },
    { name: 'radio/默认', covers: ['Radio'], element: () => <Radio checked>Radio</Radio> },
    { name: 'radio/单选框组', covers: ['RadioGroup'], element: () => <RadioGroup value="a" options={options} /> },
    { name: 'rating/默认', covers: ['Rating'], element: () => <Rating value={3} /> },
    { name: 'resizable/单个', covers: ['Resizable'], element: () => <Resizable defaultSize={{ width: 200, height: 100 }}>box</Resizable> },
    {
        name: 'resizable/分组',
        covers: ['ResizeGroup', 'ResizeItem', 'ResizeHandler'],
        element: () => (
            <ResizeGroup direction="horizontal">
                <ResizeItem defaultSize="50%">a</ResizeItem>
                <ResizeHandler />
                <ResizeItem>b</ResizeItem>
            </ResizeGroup>
        ),
    },
    {
        name: 'scroll-list/默认',
        covers: ['ScrollList', 'ScrollItem'],
        element: () => (
            <ScrollList header="h">
                <ScrollItem list={[{ value: 1, text: '1' }]} selectedIndex={0} />
            </ScrollList>
        ),
    },
    { name: 'select/默认', covers: ['Select'], element: () => <Select optionList={options} /> },
    { name: 'select/受控值', covers: ['Select'], element: () => <Select value="b" optionList={options} />, html: ['Bravo'] },
    { name: 'select/多选受控值', covers: ['Select'], element: () => <Select multiple value={['a', 'b']} maxTagCount={1} optionList={options} />, html: ['Alpha'] },
    { name: 'select/默认打开', covers: ['Select'], element: () => <Select defaultOpen optionList={options} />, opened: 'listbox' },
    {
        name: 'side-sheet/默认打开',
        covers: ['SideSheet'],
        element: () => (
            <SideSheet title="t" visible>
                body
            </SideSheet>
        ),
        opened: 'dialog',
    },
    {
        name: 'side-sheet/指定容器',
        covers: ['SideSheet'],
        element: () => (
            <SideSheet title="t" getPopupContainer={documentBody} visible>
                body
            </SideSheet>
        ),
        opened: 'dialog',
    },
    {
        name: 'side-sheet/keepDOM 关闭',
        covers: ['SideSheet'],
        element: () => (
            <SideSheet title="t" keepDOM visible={false}>
                body
            </SideSheet>
        ),
    },
    { name: 'skeleton/加载中', covers: ['Skeleton'], element: () => <Skeleton placeholder={<Skeleton.Paragraph rows={2} />} loading /> },
    { name: 'slider/默认', covers: ['Slider'], element: () => <Slider aria-label="s" value={30} /> },
    { name: 'slider/范围', covers: ['Slider'], element: () => <Slider aria-label="s" value={[10, 40]} range /> },
    { name: 'slider/默认打开', covers: ['Slider'], element: () => <Slider aria-label="s" value={30} tooltipVisible />, opened: 'tooltip' },
    {
        name: 'space/默认',
        covers: ['Space'],
        element: () => (
            <Space>
                <span>a</span>
                <span>b</span>
            </Space>
        ),
    },
    { name: 'spin/默认', covers: ['Spin'], element: () => <Spin /> },
    {
        name: 'steps/默认',
        covers: ['Steps', 'Step'],
        element: () => (
            <Steps current={1}>
                <Step title="A" />
                <Step title="B" />
            </Steps>
        ),
    },
    { name: 'switch/默认', covers: ['Switch'], element: () => <Switch aria-label="s" checked /> },
    { name: 'table/排序', covers: ['Table'], element: () => <Table columns={[{ ...columns[0], sortOrder: 'descend' }]} dataSource={rows.slice(0, 3)} pagination={false} />, html: ['row-2'] },
    { name: 'table/虚拟列表', covers: ['Table'], element: () => <Table columns={columns} dataSource={rows} pagination={false} scroll={{ y: 200 }} virtualized /> },
    { name: 'table/resizable', covers: ['Table'], element: () => <Table columns={[{ title: 'Name', dataIndex: 'name', width: 120 }]} dataSource={rows.slice(0, 3)} pagination={false} resizable /> },
    {
        name: 'tabs/受控激活项',
        covers: ['Tabs', 'TabPane'],
        element: () => (
            <Tabs activeKey="b">
                <TabPane itemKey="a" tab="A">
                    panel-a
                </TabPane>
                <TabPane itemKey="b" tab="B">
                    panel-b
                </TabPane>
            </Tabs>
        ),
        check: (markup) => expect(markup).toMatch(/aria-selected="true"[^>]*>B</),
    },
    {
        name: 'tabs/折叠',
        covers: ['Tabs'],
        element: () => <Tabs collapsible tabList={Array.from({ length: 12 }, (_, index) => ({ itemKey: String(index), tab: `tab-${index}` }))} />,
    },
    {
        // No `opened`: jsdom has no layout, so no tab overflows and the arrow renders without its dropdown
        name: 'tabs/折叠默认打开',
        covers: ['Tabs'],
        element: () => <Tabs collapsible dropdownProps={{ end: { trigger: 'custom', visible: true } }} tabList={Array.from({ length: 12 }, (_, index) => ({ itemKey: String(index), tab: `tab-${index}` }))} />,
    },
    { name: 'tag/默认', covers: ['Tag'], element: () => <Tag closable>tag</Tag> },
    { name: 'tag/标签组', covers: ['TagGroup'], element: () => <TagGroup maxTagCount={1} showPopover tagList={[{ children: 'a' }, { children: 'b' }]} /> },
    {
        name: 'tag/标签组默认打开',
        covers: ['TagGroup'],
        element: () => <TagGroup maxTagCount={1} popoverProps={{ trigger: 'custom', visible: true }} showPopover tagList={[{ children: 'a' }, { children: 'b' }]} />,
        opened: 'dialog',
    },
    {
        name: 'tag/分裂标签组',
        covers: ['SplitTagGroup'],
        element: () => (
            <SplitTagGroup>
                <Tag>a</Tag>
                <Tag>b</Tag>
            </SplitTagGroup>
        ),
    },
    { name: 'tag-input/受控值', covers: ['TagInput'], element: () => <TagInput value={['semi', 'design']} />, html: ['semi', 'design'] },
    { name: 'tag-input/拖拽', covers: ['TagInput'], element: () => <TagInput value={['semi', 'design']} draggable /> },
    {
        name: 'timeline/默认',
        covers: ['Timeline'],
        element: () => (
            <Timeline>
                <Timeline.Item time="t">event</Timeline.Item>
            </Timeline>
        ),
    },
    { name: 'time-picker/受控值', covers: ['TimePicker'], element: () => <TimePicker value={day} />, html: ['value="08:30:00"'] },
    { name: 'time-picker/默认打开', covers: ['TimePicker'], element: () => <TimePicker defaultOpen />, opened: 'listbox' },
    { name: 'toast/useToast', covers: ['Toast'], element: () => <ToastHolder /> },
    {
        name: 'tooltip/默认打开',
        covers: ['Tooltip'],
        element: () => (
            <Tooltip content="tip" trigger="custom" visible>
                <Button>Hover</Button>
            </Tooltip>
        ),
        opened: 'tooltip',
    },
    // the selected panel lists Bravo alone
    { name: 'transfer/受控值', covers: ['Transfer'], element: () => <Transfer value={['b']} dataSource={transferData} />, check: (markup) => expect(markup.match(/role="listitem"[^>]*><div[^>]*>\w+</g)).toEqual([expect.stringContaining('>Bravo<')]) },
    { name: 'transfer/拖拽', covers: ['Transfer'], element: () => <Transfer value={['a', 'b']} dataSource={transferData} draggable /> },
    { name: 'tree/受控值', covers: ['Tree'], element: () => <Tree value="china" defaultExpandAll treeData={treeData} />, check: (markup) => expect(markup).toMatch(/data-key="china"[^>]*aria-selected="true"/) },
    { name: 'tree/虚拟列表', covers: ['Tree'], element: () => <Tree defaultExpandAll treeData={treeData} virtualize={{ itemSize: 28, height: 200 }} /> },
    { name: 'tree-select/受控值', covers: ['TreeSelect'], element: () => <TreeSelect value="china" defaultExpandAll treeData={treeData} />, html: ['China'] },
    { name: 'tree-select/默认打开', covers: ['TreeSelect'], element: () => <TreeSelect defaultOpen treeData={treeData} />, opened: 'tree' },
    {
        name: 'typography/默认',
        covers: ['Typography', 'TypographyTitle', 'TypographyText', 'TypographyParagraph', 'TypographyNumeral'],
        element: () => (
            <Typography>
                <TypographyTitle heading={2}>Title</TypographyTitle>
                <TypographyText copyable>Text</TypographyText>
                <TypographyParagraph>Paragraph</TypographyParagraph>
                <TypographyNumeral rule="percentages">0.5</TypographyNumeral>
            </Typography>
        ),
        html: ['Title', 'Text', 'Paragraph'],
    },
    {
        name: 'typography/省略',
        covers: ['Typography'],
        element: () => (
            <Typography.Paragraph style={{ width: 100 }} ellipsis={{ rows: 2, showTooltip: true }}>
                {'long text '.repeat(40)}
            </Typography.Paragraph>
        ),
    },
    { name: 'upload/默认', covers: ['Upload'], element: () => <Upload action="/upload" defaultFileList={[{ uid: '1', name: 'a.txt', size: '1KB', status: 'success' }]} />, html: ['a.txt'] },
    { name: 'user-guide/弹窗默认打开', covers: ['UserGuide'], element: () => <UserGuide mode="modal" steps={[{ title: 'Step 1', description: 'd' }]} visible />, opened: 'dialog' },
    { name: 'user-guide/气泡默认打开', covers: ['UserGuide'], element: () => <UserGuide steps={[{ title: 'Step 1', description: 'd', target: () => null }]} visible /> },
    { name: 'video-player/默认', covers: ['VideoPlayer'], element: () => <VideoPlayer src="https://localhost/a.mp4" /> },
];
