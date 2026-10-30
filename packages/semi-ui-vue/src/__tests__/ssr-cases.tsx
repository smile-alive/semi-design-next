/** @jsxImportSource vue */
import type { SsrCase } from '@test/utils/vue.ssr';
import {
    AnchorLink,
    Anchor,
    ArrayField,
    AutoComplete,
    Avatar,
    AvatarGroup,
    BackTop,
    Badge,
    Banner,
    Breadcrumb,
    BreadcrumbItem,
    Button,
    ButtonGroup,
    Calendar,
    Card,
    CardGroup,
    CardMeta,
    Carousel,
    Cascader,
    Checkbox,
    CheckboxGroup,
    CodeHighlight,
    Col,
    Collapse,
    CollapsePanel,
    Collapsible,
    ColorPicker,
    ConfigConsumer,
    ConfigProvider,
    Cropper,
    DatePicker,
    Descriptions,
    DescriptionsItem,
    Divider,
    DragMove,
    Dropdown,
    DropdownDivider,
    DropdownItem,
    DropdownMenu,
    DropdownTitle,
    Empty,
    Feedback,
    FloatButton,
    FloatButtonGroup,
    Form,
    FormAutoComplete,
    FormCascader,
    FormCheckbox,
    FormCheckboxGroup,
    FormDatePicker,
    FormErrorMessage,
    FormInput,
    FormInputGroup,
    FormInputNumber,
    FormLabel,
    FormPinCode,
    FormRadio,
    FormRadioGroup,
    FormRating,
    FormSection,
    FormSelect,
    FormSlider,
    FormSlot,
    FormSwitch,
    FormTagInput,
    FormTextArea,
    FormTimePicker,
    FormTransfer,
    FormTreeSelect,
    FormUpload,
    Highlight,
    HotKeys,
    IconButton,
    Image,
    ImagePreview,
    Input,
    InputGroup,
    InputNumber,
    JsonViewer,
    Layout,
    LayoutContent,
    LayoutFooter,
    LayoutHeader,
    LayoutSider,
    List,
    ListItem,
    LocaleConsumer,
    LocaleProvider,
    Lottie,
    MarkdownRender,
    Modal,
    Nav,
    NavFooter,
    NavHeader,
    NavItem,
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
    SkeletonAvatar,
    SkeletonButton,
    SkeletonImage,
    SkeletonParagraph,
    SkeletonTitle,
    Slider,
    Space,
    Spin,
    SplitButtonGroup,
    SplitTagGroup,
    Step,
    Steps,
    SubNav,
    Switch,
    TabItem,
    TabPane,
    Table,
    TableColumn,
    Tabs,
    TagGroup,
    TagInput,
    TextArea,
    TimePicker,
    Timeline,
    TimelineItem,
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
    UploadFileCard,
    UserGuide,
    VideoPlayer,
    AudioPlayer,
    withField,
} from '..';
import SelectGroups from '../select/__tests__/fixtures/groups.vue';

const options = [
    { value: 'a', label: 'A' },
    { value: 'b', label: 'B' },
];
const treeData = [
    { label: 'Asia', value: 'asia', key: 'asia', children: [{ label: 'China', value: 'china', key: 'china' }] },
    { label: 'Europe', value: 'europe', key: 'europe' },
];
const columns = [{ title: 'Name', dataIndex: 'name' }];
const dataSource = [{ key: '1', name: 'row1' }];
// Fixed so server and client agree; every Calendar case passes displayValue (A4)
const day = new Date(2019, 7, 8, 12);
const FormInputWrapped = withField(Input);
const trigger = () => <Button>{() => 'a'}</Button>;
const popupSlots = (content: string) => ({ default: trigger, content: () => content });
const pane = (tab: string) => ({ tab: () => tab, default: () => tab.toLowerCase() });

export const ssrCases: SsrCase[] = [
    // Base and layout
    { name: 'config-provider/基本', covers: ['ConfigProvider', 'ConfigConsumer'], render: () => <ConfigProvider>{() => <ConfigConsumer>{(config: { direction?: string }) => <span>{config.direction}</span>}</ConfigConsumer>}</ConfigProvider> },
    { name: 'locale/基本', covers: ['LocaleProvider', 'LocaleConsumer'], render: () => <LocaleProvider>{() => <LocaleConsumer componentName="Pagination">{({ locale }: { locale: object }) => <span>{Object.keys(locale).length}</span>}</LocaleConsumer>}</LocaleProvider> },
    { name: 'spin/基本', covers: ['Spin'], render: () => <Spin /> },
    { name: 'avatar/基本', covers: ['Avatar', 'AvatarGroup'], render: () => <AvatarGroup>{() => [<Avatar>{() => 'AB'}</Avatar>, <Avatar>{() => 'CD'}</Avatar>]}</AvatarGroup> },
    { name: 'space/基本', covers: ['Space'], render: () => <Space>{() => [<span>a</span>, <span>b</span>]}</Space> },
    { name: 'divider/基本', covers: ['Divider'], render: () => <Divider /> },
    { name: 'grid/基本', covers: ['Row', 'Col'], render: () => <Row>{() => <Col span={12}>{() => 'a'}</Col>}</Row> },
    {
        name: 'layout/基本',
        covers: ['Layout', 'LayoutHeader', 'LayoutFooter', 'LayoutContent', 'LayoutSider'],
        render: () => <Layout>{() => [<LayoutHeader>{() => 'h'}</LayoutHeader>, <Layout>{() => [<LayoutSider>{() => 's'}</LayoutSider>, <LayoutContent>{() => 'c'}</LayoutContent>]}</Layout>, <LayoutFooter>{() => 'f'}</LayoutFooter>]}</Layout>,
    },
    { name: 'button/基本', covers: ['Button', 'ButtonGroup'], render: () => <ButtonGroup>{() => [<Button>{() => 'a'}</Button>, <Button>{() => 'b'}</Button>]}</ButtonGroup> },
    { name: 'button/分割按钮组', covers: ['SplitButtonGroup'], render: () => <SplitButtonGroup>{() => [<Button>{() => 'a'}</Button>, <Button>{() => 'b'}</Button>]}</SplitButtonGroup> },
    { name: 'icon-button/基本', covers: ['IconButton'], render: () => <IconButton>{() => 'a'}</IconButton> },
    { name: 'tag/基本', covers: ['Tag', 'TagGroup'], render: () => <TagGroup tagList={[{ children: 'a' }, { children: 'b' }]} /> },
    { name: 'tag/分割标签组', covers: ['SplitTagGroup'], render: () => <SplitTagGroup>{() => <span>a</span>}</SplitTagGroup> },
    {
        name: 'typography/基本',
        covers: ['Typography', 'TypographyText', 'TypographyTitle', 'TypographyParagraph', 'TypographyNumeral'],
        render: () => <Typography>{() => [<TypographyTitle>{() => 't'}</TypographyTitle>, <TypographyText>{() => 'x'}</TypographyText>, <TypographyParagraph>{() => 'p'}</TypographyParagraph>, <TypographyNumeral>{() => '1'}</TypographyNumeral>]}</Typography>,
    },
    { name: 'badge/基本', covers: ['Badge'], render: () => <Badge count={5}>{() => <Avatar>{() => 'A'}</Avatar>}</Badge> },
    { name: 'empty/基本', covers: ['Empty'], render: () => <Empty title="empty" /> },
    {
        name: 'skeleton/基本',
        covers: ['Skeleton', 'SkeletonParagraph'],
        render: () => (
            <Skeleton loading active>
                {{ placeholder: () => <SkeletonParagraph rows={2} />, default: () => 'content' }}
            </Skeleton>
        ),
    },
    {
        name: 'skeleton/子组件',
        covers: ['SkeletonAvatar', 'SkeletonImage', 'SkeletonTitle', 'SkeletonButton'],
        render: () => (
            <div>
                <SkeletonAvatar />
                <SkeletonImage />
                <SkeletonTitle />
                <SkeletonButton />
            </div>
        ),
    },
    { name: 'highlight/基本', covers: ['Highlight'], render: () => <Highlight sourceString="hello world" searchWords={['world']} /> },
    { name: 'hot-keys/基本', covers: ['HotKeys'], render: () => <HotKeys hotKeys={['Meta', 's']} /> },
    { name: 'progress/基本', covers: ['Progress'], render: () => <Progress percent={30} /> },
    { name: 'timeline/基本', covers: ['Timeline', 'TimelineItem'], render: () => <Timeline>{() => <TimelineItem>{() => 'a'}</TimelineItem>}</Timeline> },
    { name: 'descriptions/基本', covers: ['Descriptions', 'DescriptionsItem'], render: () => <Descriptions>{() => <DescriptionsItem>{{ itemKey: () => 'k', default: () => 'v' }}</DescriptionsItem>}</Descriptions> },
    { name: 'steps/基本', covers: ['Steps', 'Step'], render: () => <Steps current={1}>{() => [<Step title="a" />, <Step title="b" />]}</Steps> },
    { name: 'collapsible/基本', covers: ['Collapsible'], render: () => <Collapsible isOpen>{() => 'a'}</Collapsible> },
    {
        name: 'collapse/基本',
        covers: ['Collapse', 'CollapsePanel'],
        render: () => <Collapse>{() => <CollapsePanel itemKey="1">{{ header: () => 'h', default: () => 'a' }}</CollapsePanel>}</Collapse>,
    },
    { name: 'card/基本', covers: ['Card', 'CardGroup', 'CardMeta'], render: () => <CardGroup>{() => <Card title="t">{() => <CardMeta title="m" />}</Card>}</CardGroup> },
    { name: 'list/基本', covers: ['List', 'ListItem'], render: () => <List dataSource={['a', 'b']} renderItem={(item: string) => <ListItem>{() => item}</ListItem>} /> },
    { name: 'banner/基本', covers: ['Banner'], render: () => <Banner>{{ description: () => 'd' }}</Banner> },
    { name: 'float-button/基本', covers: ['FloatButton', 'FloatButtonGroup'], render: () => <FloatButtonGroup items={[{ content: 'a' }]} /> },
    { name: 'float-button/单个', covers: ['FloatButton'], render: () => <FloatButton /> },
    { name: 'backtop/基本', covers: ['BackTop'], render: () => <BackTop /> },
    // Form controls
    { name: 'checkbox/基本', covers: ['Checkbox', 'CheckboxGroup'], render: () => <CheckboxGroup>{() => <Checkbox value="a">{() => 'a'}</Checkbox>}</CheckboxGroup> },
    { name: 'radio/基本', covers: ['Radio', 'RadioGroup'], render: () => <RadioGroup>{() => <Radio value="a">{() => 'a'}</Radio>}</RadioGroup> },
    { name: 'switch/基本', covers: ['Switch'], render: () => <Switch /> },
    { name: 'input/基本', covers: ['Input', 'TextArea', 'InputGroup'], render: () => <InputGroup>{() => [<Input defaultValue="a" />, <TextArea defaultValue="b" />]}</InputGroup> },
    { name: 'input/受控值', covers: ['Input'], render: () => <Input modelValue="controlled" /> },
    { name: 'rating/基本', covers: ['Rating'], render: () => <Rating defaultValue={2} /> },
    { name: 'slider/基本', covers: ['Slider'], render: () => <Slider defaultValue={30} /> },
    { name: 'input-number/基本', covers: ['InputNumber'], render: () => <InputNumber defaultValue={3} /> },
    { name: 'pincode/基本', covers: ['PinCode'], render: () => <PinCode count={4} /> },
    // A template SFC compiles the option slots the way applications write them; JSX slots passed to SelectOption are read outside the render function
    { name: 'select/基本', covers: ['Select', 'SelectOption', 'SelectOptGroup'], render: () => <SelectGroups {...{ defaultValue: 'a-1' }} /> },
    { name: 'select/optionList', covers: ['Select'], render: () => <Select optionList={options} multiple defaultValue={['a']} filter /> },
    { name: 'select/changeWithObject 简写', covers: ['Select'], render: () => <Select optionList={options} defaultValue="a" changeWithObject /> },
    { name: 'tag-input/基本', covers: ['TagInput'], render: () => <TagInput defaultValue={['a', 'b']} /> },
    { name: 'tag-input/draggable', covers: ['TagInput'], render: () => <TagInput defaultValue={['a', 'b']} draggable /> },
    { name: 'time-picker/基本', covers: ['TimePicker'], render: () => <TimePicker timeZone={8} defaultValue="10:00:00" /> },
    { name: 'auto-complete/基本', covers: ['AutoComplete'], render: () => <AutoComplete data={['a', 'b']} defaultValue="a" /> },
    { name: 'color-picker/基本', covers: ['ColorPicker'], render: () => <ColorPicker defaultValue={{ hsva: { h: 0, s: 1, v: 1, a: 1 }, rgba: { r: 255, g: 0, b: 0, a: 1 }, hex: '#ff0000ff' }} /> },
    { name: 'date-picker/基本', covers: ['DatePicker'], render: () => <DatePicker timeZone={8} defaultValue={day} /> },
    { name: 'date-picker/dateRange 受控值', covers: ['DatePicker'], render: () => <DatePicker type="dateRange" timeZone={8} modelValue={[day, new Date(2019, 7, 10)]} /> },
    { name: 'date-picker/dateTime', covers: ['DatePicker'], render: () => <DatePicker type="dateTime" timeZone={8} defaultValue={day} /> },
    { name: 'date-picker/month', covers: ['DatePicker'], render: () => <DatePicker type="month" timeZone={8} defaultValue={day} /> },
    { name: 'cascader/基本', covers: ['Cascader'], render: () => <Cascader treeData={treeData} defaultValue={['asia', 'china']} /> },
    { name: 'tree/基本', covers: ['Tree'], render: () => <Tree treeData={treeData} defaultExpandAll /> },
    { name: 'tree/virtualize', covers: ['Tree'], render: () => <Tree treeData={treeData} virtualize={{ height: 100, itemSize: 24 }} /> },
    { name: 'tree-select/基本', covers: ['TreeSelect'], render: () => <TreeSelect treeData={treeData} defaultValue="china" /> },
    { name: 'upload/基本', covers: ['Upload', 'UploadFileCard'], render: () => <Upload action="/upload">{() => <Button>{() => 'upload'}</Button>}</Upload> },
    { name: 'upload/文件卡片', covers: ['UploadFileCard'], render: () => <UploadFileCard file={{ uid: '1', name: 'a.txt', size: '1KB', status: 'success' }} /> },
    { name: 'transfer/基本', covers: ['Transfer'], render: () => <Transfer dataSource={[{ key: '1', label: 'a', value: '1' }]} /> },
    { name: 'transfer/draggable', covers: ['Transfer'], render: () => <Transfer dataSource={[{ key: '1', label: 'a', value: '1' }]} draggable /> },
    // Form
    {
        name: 'form/基本',
        covers: ['Form', 'FormInput', 'FormLabel', 'FormErrorMessage', 'FormSection', 'FormSlot', 'FormInputGroup'],
        render: () => (
            <Form>
                {() => [<FormSection>{{ text: () => 's', default: () => <FormInput field="a" label="A" /> }}</FormSection>, <FormSlot label="slot">{() => 'x'}</FormSlot>, <FormInputGroup label="g">{() => <FormInput field="g1" noLabel />}</FormInputGroup>, <FormLabel text="label" />, <FormErrorMessage error="err" />]}
            </Form>
        ),
    },
    {
        name: 'form/字段',
        covers: [
            'FormAutoComplete',
            'FormCascader',
            'FormCheckbox',
            'FormCheckboxGroup',
            'FormDatePicker',
            'FormInputNumber',
            'FormPinCode',
            'FormRadio',
            'FormRadioGroup',
            'FormRating',
            'FormSelect',
            'FormSlider',
            'FormSwitch',
            'FormTagInput',
            'FormTextArea',
            'FormTimePicker',
            'FormTransfer',
            'FormTreeSelect',
            'FormUpload',
            'withField',
        ],
        render: () => (
            <Form initValues={{ input: 'a', date: day }}>
                {() => [
                    <FormInputWrapped field="wrapped" />,
                    <FormAutoComplete field="ac" data={['a']} />,
                    <FormCascader field="cas" treeData={treeData} />,
                    <FormCheckbox field="cb">{() => 'c'}</FormCheckbox>,
                    <FormCheckboxGroup field="cbg" options={['a', 'b']} />,
                    <FormDatePicker field="date" timeZone={8} />,
                    <FormInputNumber field="num" />,
                    <FormPinCode field="pin" count={4} />,
                    <FormRadio field="r" value="a">
                        {() => 'r'}
                    </FormRadio>,
                    <FormRadioGroup field="rg" options={['a', 'b']} />,
                    <FormRating field="rate" />,
                    <FormSelect field="sel" optionList={options} />,
                    <FormSlider field="sli" />,
                    <FormSwitch field="sw" />,
                    <FormTagInput field="ti" />,
                    <FormTextArea field="ta" />,
                    <FormTimePicker field="tp" timeZone={8} />,
                    <FormTransfer field="tr" dataSource={[{ label: 'Option 1', value: 1, key: '1' }]} />,
                    <FormTreeSelect field="ts" treeData={treeData} />,
                    <FormUpload field="up" action="/upload" />,
                ]}
            </Form>
        ),
    },
    { name: 'form/File 初始值', covers: ['FormUpload'], render: () => <Form initValues={{ up: [{ uid: '1', name: 'a.txt', fileInstance: new File(['a'], 'a.txt') }] }}>{() => <FormUpload field="up" action="/upload" />}</Form> },
    {
        name: 'form/ArrayField',
        covers: ['ArrayField'],
        render: () => <Form initValues={{ rows: [{ v: 'a' }, { v: 'b' }] }}>{() => <ArrayField field="rows">{{ default: ({ arrayFields }: { arrayFields: { key: string; field: string }[] }) => arrayFields.map(({ key, field }) => <FormInput key={key} field={`${field}[v]`} />) }}</ArrayField>}</Form>,
    },
    // Navigation
    { name: 'breadcrumb/基本', covers: ['Breadcrumb', 'BreadcrumbItem'], render: () => <Breadcrumb>{() => [<BreadcrumbItem>{() => 'a'}</BreadcrumbItem>, <BreadcrumbItem>{() => 'b'}</BreadcrumbItem>]}</Breadcrumb> },
    { name: 'anchor/基本', covers: ['Anchor', 'AnchorLink'], render: () => <Anchor>{() => <AnchorLink href="#a" title="a" />}</Anchor> },
    {
        name: 'navigation/基本',
        covers: ['Nav', 'NavItem', 'SubNav', 'NavHeader', 'NavFooter'],
        render: () => (
            <Nav defaultSelectedKeys={['1']}>
                {() => [
                    <NavHeader text="h" />,
                    <NavItem itemKey="1" text="a" />,
                    <SubNav itemKey="2" text="s">
                        {() => <NavItem itemKey="3" text="b" />}
                    </SubNav>,
                    <NavFooter />,
                ]}
            </Nav>
        ),
    },
    {
        name: 'tabs/基本',
        covers: ['Tabs', 'TabPane', 'TabItem'],
        render: () => <Tabs>{() => [<TabPane itemKey="a">{pane('A')}</TabPane>, <TabPane itemKey="b">{pane('B')}</TabPane>]}</Tabs>,
    },
    { name: 'tabs/TabItem', covers: ['TabItem'], render: () => <TabItem itemKey="a">{{ tab: () => 'A' }}</TabItem> },
    {
        name: 'tabs/collapsible',
        covers: ['Tabs'],
        render: () => <Tabs collapsible>{() => <TabPane itemKey="a">{pane('A')}</TabPane>}</Tabs>,
    },
    { name: 'pagination/基本', covers: ['Pagination'], render: () => <Pagination total={100} showSizeChanger /> },
    {
        name: 'steps/导航',
        covers: ['Steps'],
        render: () => (
            <Steps type="nav" current={0}>
                {() => <Step title="a" />}
            </Steps>
        ),
    },
    // Data display
    { name: 'calendar/基本', covers: ['Calendar'], render: () => <Calendar mode="month" displayValue={day} /> },
    { name: 'calendar/week', covers: ['Calendar'], render: () => <Calendar mode="week" displayValue={day} /> },
    { name: 'calendar/range', covers: ['Calendar'], render: () => <Calendar mode="range" displayValue={day} range={[day, new Date(2019, 7, 12)]} /> },
    { name: 'table/基本', covers: ['Table', 'TableColumn'], render: () => <Table columns={columns} dataSource={dataSource} pagination={false} /> },
    {
        name: 'table/TableColumn',
        covers: ['TableColumn'],
        render: () => (
            <Table dataSource={dataSource} pagination={false}>
                {() => <TableColumn title="Name" dataIndex="name" />}
            </Table>
        ),
    },
    { name: 'table/virtualized', covers: ['Table'], render: () => <Table columns={[{ title: 'Name', dataIndex: 'name', width: 120 }]} dataSource={dataSource} pagination={false} virtualized scroll={{ y: 200 }} /> },
    { name: 'json-viewer/基本', covers: ['JsonViewer'], render: () => <JsonViewer modelValue='{"a":1}' /> },
    { name: 'markdown-render/基本', covers: ['MarkdownRender'], render: () => <MarkdownRender raw="# title" /> },
    { name: 'markdown-render/md', covers: ['MarkdownRender'], render: () => <MarkdownRender raw="**bold**" format="md" /> },
    { name: 'code-highlight/基本', covers: ['CodeHighlight'], render: () => <CodeHighlight code="const a = 1" language="js" /> },
    { name: 'lottie/基本', covers: ['Lottie'], render: () => <Lottie params={{ path: '/a.json' }} /> },
    { name: 'overflow-list/基本', covers: ['OverflowList'], render: () => <OverflowList items={[{ key: 'a' }]} visibleItemRenderer={(item: { key: string }) => <span>{item.key}</span>} overflowRenderer={() => <span>more</span>} /> },
    { name: 'scroll-list/基本', covers: ['ScrollList', 'ScrollItem'], render: () => <ScrollList>{() => <ScrollItem list={options.map((o) => ({ value: o.value }))} />}</ScrollList> },
    {
        name: 'resizable/基本',
        covers: ['Resizable', 'ResizeGroup', 'ResizeItem', 'ResizeHandler'],
        render: () => (
            <div>
                <Resizable defaultSize={{ width: 100, height: 100 }}>{() => 'r'}</Resizable>
                <ResizeGroup>{() => [<ResizeItem defaultSize="50%">{() => 'a'}</ResizeItem>, <ResizeHandler />, <ResizeItem>{() => 'b'}</ResizeItem>]}</ResizeGroup>
            </div>
        ),
    },
    { name: 'drag-move/基本', covers: ['DragMove'], render: () => <DragMove>{() => <div>drag</div>}</DragMove> },
    { name: 'carousel/基本', covers: ['Carousel'], render: () => <Carousel>{() => [<div>a</div>, <div>b</div>]}</Carousel> },
    { name: 'image/基本', covers: ['Image', 'ImagePreview'], render: () => <Image src="/a.png" width={50} height={50} /> },
    { name: 'cropper/基本', covers: ['Cropper'], render: () => <Cropper src="/a.png" /> },
    { name: 'audio-player/基本', covers: ['AudioPlayer'], render: () => <AudioPlayer audioUrl="/a.mp3" /> },
    { name: 'video-player/基本', covers: ['VideoPlayer'], render: () => <VideoPlayer src="/a.mp4" /> },
    { name: 'user-guide/基本', covers: ['UserGuide'], render: () => <UserGuide steps={[{ target: () => null, title: 't' }]} visible={false} /> },
    // Popups, default closed
    { name: 'tooltip/基本', covers: ['Tooltip'], render: () => <Tooltip>{popupSlots('tip')}</Tooltip> },
    { name: 'popover/基本', covers: ['Popover'], render: () => <Popover>{popupSlots('pop')}</Popover> },
    { name: 'popconfirm/基本', covers: ['Popconfirm'], render: () => <Popconfirm title="sure">{() => <Button>{() => 'a'}</Button>}</Popconfirm> },
    {
        name: 'dropdown/基本',
        covers: ['Dropdown', 'DropdownMenu', 'DropdownItem', 'DropdownDivider', 'DropdownTitle'],
        render: () => <Dropdown>{{ default: trigger, content: () => <DropdownMenu>{() => [<DropdownTitle>{() => 't'}</DropdownTitle>, <DropdownItem>{() => 'a'}</DropdownItem>, <DropdownDivider />]}</DropdownMenu> }}</Dropdown>,
    },
    {
        name: 'modal/基本',
        covers: ['Modal'],
        render: () => (
            <Modal visible={false} title="m">
                {() => 'a'}
            </Modal>
        ),
    },
    {
        name: 'side-sheet/基本',
        covers: ['SideSheet'],
        render: () => (
            <SideSheet visible={false} title="s">
                {() => 'a'}
            </SideSheet>
        ),
    },
    { name: 'feedback/基本', covers: ['Feedback'], render: () => <Feedback visible={false} /> },
    // Default open: popups reach the DOM only after hydration (A3)
    {
        name: 'tooltip/默认打开',
        covers: ['Tooltip'],
        render: () => <Tooltip visible>{popupSlots('tip')}</Tooltip>,
    },
    {
        name: 'popover/默认打开',
        covers: ['Popover'],
        render: () => <Popover visible>{popupSlots('pop')}</Popover>,
    },
    {
        name: 'popconfirm/默认打开',
        covers: ['Popconfirm'],
        render: () => (
            <Popconfirm title="sure" visible>
                {() => <Button>{() => 'a'}</Button>}
            </Popconfirm>
        ),
    },
    {
        name: 'dropdown/默认打开',
        covers: ['Dropdown'],
        render: () => <Dropdown visible>{{ default: trigger, content: () => <DropdownMenu>{() => <DropdownItem>{() => 'a'}</DropdownItem>}</DropdownMenu> }}</Dropdown>,
    },
    { name: 'select/默认打开', covers: ['Select'], render: () => <Select optionList={options} defaultOpen /> },
    { name: 'tree-select/默认打开', covers: ['TreeSelect'], render: () => <TreeSelect treeData={treeData} defaultOpen /> },
    { name: 'auto-complete/默认打开', covers: ['AutoComplete'], render: () => <AutoComplete data={['a']} defaultOpen /> },
    { name: 'cascader/默认打开', covers: ['Cascader'], render: () => <Cascader treeData={treeData} defaultOpen /> },
    { name: 'date-picker/默认打开', covers: ['DatePicker'], render: () => <DatePicker timeZone={8} defaultValue={day} defaultOpen /> },
    { name: 'time-picker/默认打开', covers: ['TimePicker'], render: () => <TimePicker timeZone={8} defaultOpen /> },
    { name: 'color-picker/默认打开', covers: ['ColorPicker'], render: () => <ColorPicker usePopover popoverProps={{ visible: true }} /> },
    {
        name: 'modal/默认打开',
        covers: ['Modal'],
        render: () => (
            <Modal visible title="m">
                {() => 'a'}
            </Modal>
        ),
    },
    {
        name: 'side-sheet/默认打开',
        covers: ['SideSheet'],
        render: () => (
            <SideSheet visible title="s">
                {() => 'a'}
            </SideSheet>
        ),
    },
    { name: 'image/默认打开', covers: ['Image'], render: () => <Image src="/a.png" preview={{ visible: true }} /> },
    { name: 'image/ImagePreview 默认打开', covers: ['ImagePreview'], render: () => <ImagePreview src={['/a.png']} visible /> },
    { name: 'feedback/默认打开', covers: ['Feedback'], render: () => <Feedback visible /> },
    { name: 'user-guide/默认打开', covers: ['UserGuide'], render: () => <UserGuide steps={[{ target: () => null, title: 't' }]} visible /> },
];

// Exports that are not components, hooks of the form API and plain objects. Toast and Notification are imperative
// APIs that mount into the document, covered by imperative.ssr.test.ts
export const nonComponentExports = new Set(['BaseFoundation', 'semiGlobal', 'semiGlobalKey', 'Toast', 'Notification', 'useConfig', 'useLocale', 'defaultResponsiveMap', 'ToastFactory', 'useForm', 'useFieldApi', 'useFieldState', 'useFormApi', 'useFormState']);
