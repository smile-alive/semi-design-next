import { type JSX, For } from 'solid-js';
import { isServer } from 'solid-js/web';
import { IconAILoading, IconSearch, IconUpload } from '@fibrae/semi-icons-solid';
import type { MountDiff, SsrCase } from '@test/solid/ssr.solid';
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
    FormAutoComplete,
    FormCascader,
    FormCheckbox,
    FormCheckboxGroup,
    FormDatePicker,
    FormInput,
    FormInputNumber,
    FormPinCode,
    FormRadio,
    FormRadioGroup,
    FormRating,
    FormSelect,
    FormSlider,
    FormSwitch,
    FormTagInput,
    FormTextArea,
    FormTimePicker,
    FormTransfer,
    FormTreeSelect,
    FormUpload,
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
    semiGlobal,
    SideSheet,
    Skeleton,
    Slider,
    Space,
    Spin,
    SplitButtonGroup,
    SplitTagGroup,
    Step,
    Steps,
    Switch,
    TabPane,
    Table,
    Tabs,
    Tag,
    TagGroup,
    TagInput,
    TextArea,
    TimePicker,
    Timeline,
    Toast,
    Tooltip,
    Transfer,
    Tree,
    TreeSelect,
    Typography,
    Upload,
    UserGuide,
    VideoPlayer,
} from '..';
import type * as Entry from '..';

// Fixed instants: the two sides of a hydration case render at different times, and Calendar's "today" must not
// be in view on the server
const day = new Date(2019, 7, 8, 12);
const rangeStart = new Date(2019, 7, 1, 12);
const eventStart = new Date(2019, 7, 8, 10);
const eventEnd = new Date(2019, 7, 8, 11);

const treeData = [
    {
        label: 'Asia',
        value: 'Asia',
        key: '0',
        children: [
            { label: 'Beijing', value: 'Beijing', key: '0-0' },
            { label: 'Shanghai', value: 'Shanghai', key: '0-1' },
        ],
    },
    { label: 'Europe', value: 'Europe', key: '1' },
];

const options = [
    { label: 'Apple', value: 'apple' },
    { label: 'Banana', value: 'banana' },
];

const columns = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Size', dataIndex: 'size' },
];
const rows = [
    { key: '1', name: 'Semi.fig', size: '2M' },
    { key: '2', name: 'Semi.pdf', size: '3M' },
];

// Media whose load or error changes the DOM use data URLs: a remote one can settle after hydration and switch the
// component to its loaded or fallback state, while a data URL settles before the client modules run and the components
// only listen once mounted
const imageSrc = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
// AudioPlayer and VideoPlayer read a loaded source's duration on mount, which the server cannot know, so their sources fail
const audioSrc = 'data:audio/wav;base64,';
const videoSrc = 'data:video/mp4;base64,';

const uploadFiles = [{ uid: '1', name: 'semi.png', status: 'success' as const, size: '130KB', url: imageSrc }];

// Only the no-argument clock is replaced, so Dates made before stay instances of the global. The browser iframe has no
// `vi`, which is why the cross-midnight cases freeze the clock by hand on both sides.
function freezeClock(now: Date) {
    const RealDate = globalThis.Date;
    globalThis.Date = new Proxy(RealDate, {
        construct: (target, args, newTarget) => Reflect.construct(target, args.length ? args : [now.getTime()], newTarget),
        get: (target, key) => (key === 'now' ? () => now.getTime() : Reflect.get(target, key)),
    });
    return () => {
        globalThis.Date = RealDate;
    };
}

// The server renders just before midnight and the browser hydrates just after, with both days in view
export const crossMidnightPrefix = 'calendar/跨日';
const crossMidnight = () => freezeClock(isServer ? new Date(2026, 10, 1, 23, 59, 59) : new Date(2026, 10, 2, 0, 0, 1));

const svg = () => (
    <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
    </svg>
);

// Attributes Tooltip-family triggers gain after mount: the open state of a default-open layer, and the pointer-events
// a special trigger gets inside its wrapper span (docs/component-issues.md, Tooltip)
const triggerMountDiff: MountDiff[] = ['aria-expanded', 'aria-controls', 'aria-describedby', { selector: '.semi-tooltip-trigger-wrapper > *', attrs: ['style'] }];

const carouselMountDiff: MountDiff[] = [{ selector: '.semi-carousel-content > *', attrs: ['class', 'style', 'id', 'role', 'aria-labelledby', 'inert'] }];

export const ssrCases: SsrCase<keyof typeof Entry>[] = [
    {
        name: 'anchor/默认',
        covers: ['Anchor'],
        render: () => (
            <Anchor>
                <Anchor.Link href="#a" title="Section A">
                    <Anchor.Link href="#a1" title="Section A1" />
                </Anchor.Link>
                <Anchor.Link href="#b" title="Section B" />
            </Anchor>
        ),
        text: ['Section A', 'Section B'],
    },
    { name: 'audio-player/默认', covers: ['AudioPlayer'], render: () => <AudioPlayer autoPlay={false} audioUrl={audioSrc} /> },
    { name: 'auto-complete/默认', covers: ['AutoComplete'], render: () => <AutoComplete data={['semi', 'design']} placeholder="Search" /> },
    { name: 'auto-complete/默认打开', covers: ['AutoComplete'], render: () => <AutoComplete data={['semi', 'design']} defaultOpen />, mountDiff: ['aria-expanded', 'aria-controls', 'aria-activedescendant'] },
    { name: 'avatar/文字', covers: ['Avatar'], render: () => <Avatar>UI</Avatar>, text: ['UI'], mountDiff: ['style'] },
    { name: 'avatar/图片', covers: ['Avatar'], render: () => <Avatar src={imageSrc} alt="Semi" /> },
    {
        name: 'avatar/非预设尺寸的槽位',
        covers: ['Avatar'],
        // slots show at preset sizes only, so their text is created only there
        render: () => (
            <Avatar size="40px" topSlot={{ text: () => <b>LIVE</b> }} bottomSlot={{ text: () => <b>NEW</b> }}>
                UI
            </Avatar>
        ),
        text: ['UI'],
        mountDiff: ['style'],
    },
    {
        name: 'avatar/AvatarGroup',
        covers: ['AvatarGroup'],
        render: () => (
            <AvatarGroup maxCount={2}>
                <Avatar>A</Avatar>
                <Avatar>B</Avatar>
                <Avatar>C</Avatar>
            </AvatarGroup>
        ),
        mountDiff: ['class', 'style'],
    },
    {
        name: 'avatar/AvatarGroup 列表子项的 maxCount',
        covers: ['AvatarGroup'],
        render: () => (
            <AvatarGroup maxCount={2}>
                <For each={['A', 'B', 'C', 'D']}>{(name) => <Avatar alt={name}>{name}</Avatar>}</For>
            </AvatarGroup>
        ),
        text: ['A', 'B', '+2'],
        mountDiff: ['class', 'style'],
    },
    {
        name: 'avatar/AvatarGroup renderMore',
        covers: ['AvatarGroup'],
        // the hidden avatars are created where renderMore inserts them, on the first frame here
        render: () => (
            <AvatarGroup
                maxCount={1}
                renderMore={(restNumber, restAvatars) => (
                    <span>
                        {`+${restNumber}`}
                        <For each={restAvatars}>{(avatar) => avatar({ size: 'small' })}</For>
                    </span>
                )}
            >
                <Avatar>A</Avatar>
                <Avatar>B</Avatar>
                <Avatar>C</Avatar>
            </AvatarGroup>
        ),
        text: ['A', '+2', 'B', 'C'],
        mountDiff: ['class', 'style'],
    },
    { name: 'backtop/默认', covers: ['BackTop'], render: () => <BackTop /> },
    { name: 'backtop/icon', covers: ['BackTop'], render: () => <BackTop icon={<IconSearch />} /> },
    {
        name: 'badge/默认',
        covers: ['Badge'],
        render: () => (
            <Badge count={5}>
                <Avatar>B</Avatar>
            </Badge>
        ),
        text: ['5'],
    },
    { name: 'banner/默认', covers: ['Banner'], render: () => <Banner title="Banner title" description="Banner description" />, text: ['Banner title', 'Banner description'] },
    {
        name: 'breadcrumb/默认',
        covers: ['Breadcrumb'],
        render: () => (
            <Breadcrumb>
                <Breadcrumb.Item>Home</Breadcrumb.Item>
                <Breadcrumb.Item icon={<IconSearch />}>Search</Breadcrumb.Item>
            </Breadcrumb>
        ),
        text: ['Home', 'Search'],
        // The slot sizes and classes an icon created in it on the server too
        html: ['semi-icon-small semi-icon-search semi-breadcrumb-item-icon'],
    },
    { name: 'breadcrumb/routes', covers: ['Breadcrumb'], render: () => <Breadcrumb routes={['Home', 'Docs', 'Breadcrumb']} />, text: ['Home', 'Docs'] },
    {
        name: 'breadcrumb/renderMore',
        covers: ['Breadcrumb'],
        // the hidden items handed to renderMore are not inserted on the first frame
        render: () => <Breadcrumb routes={['Home', 'A', 'B', 'C', 'D', 'Detail']} renderMore={() => <span>More items</span>} />,
        text: ['Home', 'More items', 'Detail'],
    },
    {
        name: 'breadcrumb/文本子项',
        covers: ['Breadcrumb'],
        // an element child would log the dev warning against non-Item children, which the hydration check counts
        render: () => (
            <Breadcrumb>
                <Breadcrumb.Item>Home</Breadcrumb.Item>
                Plain text
            </Breadcrumb>
        ),
        text: ['Home', 'Plain text'],
    },
    { name: 'button/默认', covers: ['Button'], render: () => <Button>Submit</Button>, text: ['Submit'] },
    { name: 'button/icon', covers: ['Button'], render: () => <Button icon={<IconSearch />}>Search</Button>, text: ['Search'] },
    {
        name: 'button/loading icon',
        covers: ['Button'],
        render: () => (
            <Button loading icon={<IconSearch />}>
                Search
            </Button>
        ),
    },
    {
        name: 'button/overrideDefaultProps',
        covers: ['Button', 'semiGlobal'],
        setup: () => {
            const previous = semiGlobal.config.overrideDefaultProps;
            semiGlobal.config.overrideDefaultProps = { Button: { theme: 'solid' } };
            return () => {
                semiGlobal.config.overrideDefaultProps = previous;
            };
        },
        render: () => <Button>Global</Button>,
        text: ['Global'],
    },
    {
        name: 'button/ButtonGroup',
        covers: ['ButtonGroup'],
        render: () => (
            <ButtonGroup>
                <Button>One</Button>
                <Button>Two</Button>
            </ButtonGroup>
        ),
        text: ['One', 'Two'],
        html: ['semi-button-group-line semi-button-group-line-light semi-button-group-line-primary'],
    },
    {
        name: 'button/SplitButtonGroup',
        covers: ['SplitButtonGroup'],
        render: () => (
            <SplitButtonGroup>
                <Button>Main</Button>
                <Button icon={<IconSearch />} aria-label="More" />
            </SplitButtonGroup>
        ),
        // the group marks its first and last button after mount
        mountDiff: [{ selector: '.semi-button', classes: ['semi-button-first', 'semi-button-last'] }],
    },
    { name: 'calendar/month', covers: ['Calendar'], render: () => <Calendar mode="month" displayValue={day} /> },
    { name: 'calendar/week', covers: ['Calendar'], render: () => <Calendar mode="week" displayValue={day} /> },
    { name: 'calendar/day', covers: ['Calendar'], render: () => <Calendar mode="day" displayValue={day} /> },
    // The today marker is the one thing hydration adds, so it stays out of the DOM comparison on the date cells and the
    // browser test asserts it on the hydrated DOM instead
    {
        name: `${crossMidnightPrefix} month`,
        covers: ['Calendar'],
        render: () => <Calendar mode="month" displayValue={new Date(2026, 10, 4)} />,
        setup: crossMidnight,
        mountDiff: [{ selector: '[role="cell"][aria-label]', attrs: ['aria-current'], classes: ['semi-calendar-today'] }],
    },
    // The week and day views rebuild the column that turns out to be today's, to start its current time line
    // (docs/component-issues.md, Calendar)
    { name: `${crossMidnightPrefix} week`, covers: ['Calendar'], render: () => <Calendar mode="week" displayValue={new Date(2026, 10, 4)} />, setup: crossMidnight, mountDiff: ['*'] },
    { name: `${crossMidnightPrefix} day`, covers: ['Calendar'], render: () => <Calendar mode="day" displayValue={new Date(2026, 10, 2, 12)} />, setup: crossMidnight, mountDiff: ['*'] },
    {
        name: 'calendar/events 含 JSX',
        covers: ['Calendar'],
        render: () => <Calendar mode="month" displayValue={day} events={[{ key: 'e1', start: eventStart, end: eventEnd, children: <span>Event body</span> }]} />,
        text: ['Event body'],
    },
    {
        name: 'card/默认',
        covers: ['Card'],
        render: () => (
            <Card title="Card title" footer="Card footer">
                <Card.Meta title="Meta title" description="Meta description" />
            </Card>
        ),
        text: ['Card title', 'Meta title', 'Meta description'],
    },
    {
        name: 'card/loading',
        covers: ['Card'],
        // the body is not created while the placeholder shows
        render: () => (
            <Card loading title="Card title">
                <Card.Meta title="Meta title" />
            </Card>
        ),
        text: ['Card title'],
    },
    {
        name: 'card/CardGroup',
        covers: ['CardGroup'],
        render: () => (
            <CardGroup>
                <Card title="First" />
                <Card title="Second" />
            </CardGroup>
        ),
        text: ['First', 'Second'],
    },
    {
        name: 'carousel/默认',
        covers: ['Carousel'],
        render: () => (
            <Carousel autoPlay={false}>
                <div>Slide 1</div>
                <div>Slide 2</div>
            </Carousel>
        ),
        text: ['Slide 1'],
        // the slides are the consumer's markup on the server, decorated at hydration, a known limitation (Carousel)
        mountDiff: carouselMountDiff,
    },
    {
        name: 'carousel/leftArrow rightArrow',
        covers: ['Carousel'],
        render: () => (
            <Carousel autoPlay={false} leftArrow={<span>Back</span>} rightArrow={<span>Forward</span>}>
                <div>Slide 1</div>
                <div>Slide 2</div>
            </Carousel>
        ),
        text: ['Back', 'Forward'],
        mountDiff: carouselMountDiff,
    },
    { name: 'cascader/默认', covers: ['Cascader'], render: () => <Cascader treeData={treeData} placeholder="Region" /> },
    { name: 'cascader/受控值', covers: ['Cascader'], render: () => <Cascader treeData={treeData} value={['Asia', 'Beijing']} />, text: ['Beijing'] },
    { name: 'cascader/多选', covers: ['Cascader'], render: () => <Cascader treeData={treeData} multiple defaultValue={[['Asia', 'Beijing']]} />, text: ['Beijing'] },
    { name: 'cascader/默认打开', covers: ['Cascader'], render: () => <Cascader treeData={treeData} defaultOpen />, mountDiff: ['aria-expanded', 'aria-controls', { selector: '.semi-cascader', classes: ['semi-cascader-focus'] }] },
    { name: 'checkbox/默认', covers: ['Checkbox'], render: () => <Checkbox defaultChecked>Agree</Checkbox>, text: ['Agree'] },
    { name: 'checkbox/CheckboxGroup', covers: ['CheckboxGroup'], render: () => <CheckboxGroup options={options} defaultValue={['apple']} />, text: ['Apple', 'Banana'] },
    { name: 'code-highlight/默认', covers: ['CodeHighlight'], render: () => <CodeHighlight language="javascript" code="const semi = 1;" />, text: ['semi'] },
    {
        name: 'collapse/默认',
        covers: ['Collapse'],
        render: () => (
            <Collapse defaultActiveKey="1">
                <Collapse.Panel header="Panel one" itemKey="1">
                    Panel body
                </Collapse.Panel>
                <Collapse.Panel header="Panel two" itemKey="2">
                    Hidden body
                </Collapse.Panel>
            </Collapse>
        ),
        text: ['Panel one', 'Panel body'],
    },
    {
        name: 'collapse/自定义图标',
        covers: ['Collapse'],
        render: () => (
            <Collapse defaultActiveKey="1" expandIcon={<IconUpload />} collapseIcon={<IconSearch />}>
                <Collapse.Panel header="Panel one" itemKey="1">
                    Panel body
                </Collapse.Panel>
                <Collapse.Panel header="Panel two" itemKey="2">
                    Hidden body
                </Collapse.Panel>
            </Collapse>
        ),
        text: ['Panel one', 'Panel body'],
    },
    {
        name: 'collapsible/打开',
        covers: ['Collapsible'],
        render: () => (
            <Collapsible isOpen>
                <p>Collapsible body</p>
            </Collapsible>
        ),
        text: ['Collapsible body'],
    },
    { name: 'color-picker/默认', covers: ['ColorPicker'], render: () => <ColorPicker defaultValue={ColorPicker.colorStringToValue('#3366ff')} />, html: ['background-color:rgba(51,102,255,1)'] },
    { name: 'color-picker/usePopover', covers: ['ColorPicker'], render: () => <ColorPicker usePopover defaultValue={ColorPicker.colorStringToValue('#3366ff')} /> },
    {
        name: 'color-picker/usePopover 默认打开',
        covers: ['ColorPicker'],
        render: () => <ColorPicker usePopover popoverProps={{ visible: true, trigger: 'custom' }} defaultValue={ColorPicker.colorStringToValue('#3366ff')} />,
        mountDiff: triggerMountDiff,
    },
    {
        name: 'config-provider/默认',
        covers: ['ConfigProvider', 'ConfigConsumer'],
        render: () => (
            <ConfigProvider direction="rtl">
                <ConfigConsumer>{(value) => <span>{value.direction}</span>}</ConfigConsumer>
            </ConfigProvider>
        ),
        text: ['rtl'],
    },
    { name: 'cropper/默认', covers: ['Cropper'], render: () => <Cropper src={imageSrc} style={{ width: '300px', height: '200px' }} /> },
    { name: 'date-picker/默认', covers: ['DatePicker'], render: () => <DatePicker placeholder="Pick a date" /> },
    { name: 'date-picker/受控值', covers: ['DatePicker'], render: () => <DatePicker value={day} />, html: ['value="2019-08-08"'] },
    // Start and end differ, so a swapped or empty end input fails the substring checks
    { name: 'date-picker/dateRange 受控值', covers: ['DatePicker'], render: () => <DatePicker type="dateRange" value={[rangeStart, day]} />, html: ['value="2019-08-01"', 'value="2019-08-08"'] },
    { name: 'date-picker/默认打开', covers: ['DatePicker'], render: () => <DatePicker defaultValue={day} defaultOpen />, html: ['value="2019-08-08"'], mountDiff: ['aria-expanded', 'aria-controls'] },
    {
        name: 'descriptions/默认',
        covers: ['Descriptions'],
        render: () => (
            <Descriptions
                data={[
                    { key: 'Users', value: '1,480,000' },
                    { key: 'Level', value: 'Gold' },
                ]}
            />
        ),
        text: ['Users', 'Gold'],
    },
    {
        name: 'descriptions/renderValue 与隐藏项',
        covers: ['Descriptions'],
        render: () => (
            <Descriptions
                row
                data={[
                    { key: 'Plan', value: 'Silver', hidden: true },
                    { key: 'Level', value: 'Gold' },
                ]}
                renderValue={(item) => <Tag>{`${item.value} tier`}</Tag>}
            />
        ),
        text: ['Level', 'Gold tier'],
    },
    { name: 'divider/默认', covers: ['Divider'], render: () => <Divider>Divider text</Divider>, text: ['Divider text'] },
    {
        name: 'drag-move/默认',
        covers: ['DragMove'],
        render: () => (
            <DragMove>
                <div style={{ position: 'absolute' }}>Drag me</div>
            </DragMove>
        ),
        text: ['Drag me'],
        // binding the element writes its cursor and touch-action
        mountDiff: [{ selector: ':scope > *', attrs: ['style'] }],
    },
    {
        name: 'dropdown/默认',
        covers: ['Dropdown', 'DropdownMenu', 'DropdownItem', 'DropdownDivider'],
        render: () => (
            <Dropdown
                render={
                    <DropdownMenu>
                        <DropdownItem>Item one</DropdownItem>
                        <DropdownDivider />
                        <DropdownItem>Item two</DropdownItem>
                    </DropdownMenu>
                }
            >
                {(t) => <Button {...t()}>Menu</Button>}
            </Dropdown>
        ),
        text: ['Menu'],
        mountDiff: triggerMountDiff,
    },
    { name: 'dropdown/纯文本触发器', covers: ['Dropdown'], render: () => <Dropdown menu={[{ node: 'item', name: 'Item one' }]}>Plain trigger</Dropdown>, text: ['Plain trigger'], mountDiff: triggerMountDiff },
    {
        name: 'dropdown/默认打开',
        covers: ['Dropdown'],
        render: () => (
            <Dropdown visible trigger="custom" menu={[{ node: 'item', name: 'Item one' }]}>
                {(t) => <Button {...t()}>Open menu</Button>}
            </Dropdown>
        ),
        mountDiff: triggerMountDiff,
    },
    { name: 'empty/默认', covers: ['Empty'], render: () => <Empty title="Nothing here" description="Empty description" />, text: ['Nothing here'] },
    { name: 'feedback/默认', covers: ['Feedback'], render: () => <Feedback title="Rate us" /> },
    { name: 'feedback/默认打开', covers: ['Feedback'], render: () => <Feedback title="Rate us" visible /> },
    { name: 'feedback/modal 默认打开', covers: ['Feedback'], render: () => <Feedback mode="modal" title="Rate us" visible /> },
    { name: 'float-button/默认', covers: ['FloatButton'], render: () => <FloatButton icon={<IconSearch />} aria-label="Search" /> },
    {
        name: 'float-button/FloatButtonGroup',
        covers: ['FloatButtonGroup'],
        render: () => (
            <FloatButtonGroup
                items={[
                    { value: 'a', content: 'A' },
                    { value: 'b', content: 'B' },
                ]}
            />
        ),
    },
    {
        name: 'form/全部字段',
        covers: [
            'Form',
            'FormAutoComplete',
            'FormCascader',
            'FormCheckbox',
            'FormCheckboxGroup',
            'FormDatePicker',
            'FormInput',
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
        ],
        render: () => (
            <Form
                initValues={{
                    name: 'semi',
                    files: [{ uid: '1', name: 'resso.jpeg', status: 'success', size: '2KB', fileInstance: new File([new ArrayBuffer(2048)], 'resso.jpeg', { type: 'image/jpeg' }) }],
                }}
            >
                <Form.Section text="Basics">
                    <FormInput field="name" label="Name" />
                    <FormTextArea field="description" label="Description" />
                    <FormInputNumber field="count" label="Count" initValue={20} />
                    <FormAutoComplete field="keyword" label="Keyword" data={['semi']} />
                    <FormSelect field="role" label="Role" optionList={options} initValue="apple" />
                    <FormCascader field="area" label="Area" treeData={treeData} />
                    <FormTreeSelect field="node" label="Node" treeData={treeData} />
                    <FormTagInput field="tags" label="Tags" initValue={['abc']} />
                    <FormDatePicker field="date" label="Date" initValue={day} />
                    <FormTimePicker field="time" label="Time" initValue={day} />
                    <FormPinCode field="code" label="Code" />
                </Form.Section>
                <Form.Section text="Choices">
                    <FormCheckboxGroup field="type" label="Type" initValue={['user']}>
                        <FormCheckbox value="admin">admin</FormCheckbox>
                        <FormCheckbox value="user">user</FormCheckbox>
                    </FormCheckboxGroup>
                    <FormRadioGroup field="exclusive" label="Exclusive">
                        <FormRadio value={1}>Yes</FormRadio>
                        <FormRadio value={0}>No</FormRadio>
                    </FormRadioGroup>
                    <FormSlider field="range" label="Range" initValue={10} />
                    <FormSwitch field="enabled" label="Enabled" />
                    <FormRating field="rating" label="Rating" initValue={2} />
                    <FormTransfer field="picked" label="Picked" dataSource={[{ label: 'Option 1', value: 1, key: '1' }]} initValue={[1]} />
                    <FormUpload field="files" label="Files" action="https://example.com/upload">
                        <Button icon={<IconUpload />}>Upload</Button>
                    </FormUpload>
                </Form.Section>
            </Form>
        ),
        text: ['Basics', 'Name', 'resso.jpeg'],
    },
    {
        name: 'form/ArrayField',
        covers: ['ArrayField'],
        render: () => (
            <Form>
                <ArrayField field="rules" initValue={[{ name: 'Semi D2C' }, { name: 'Semi C2D' }]}>
                    {(props) => <For each={props.arrayFields}>{(row) => <FormInput field={`${row.field}[name]`} label={`${row.field}.name`} />}</For>}
                </ArrayField>
            </Form>
        ),
        text: ['rules[0].name'],
    },
    {
        name: 'grid/默认',
        covers: ['Row', 'Col'],
        render: () => (
            <Row gutter={8}>
                <Col span={12}>Left</Col>
                <Col span={12}>Right</Col>
            </Row>
        ),
        text: ['Left', 'Right'],
    },
    { name: 'highlight/默认', covers: ['Highlight'], render: () => <Highlight sourceString="Semi Design system" searchWords={['Design']} />, text: ['Design'] },
    { name: 'hot-keys/默认', covers: ['HotKeys'], render: () => <HotKeys hotKeys={['Control', 'A']} /> },
    { name: 'icons/svg', covers: ['Icon'], render: () => <Icon svg={svg} size="large" /> },
    // The gradient id carries a per-instance `{uid}`, which is where a mismatched hydration key shows first
    {
        name: 'icons/带 uid 的图标',
        covers: [],
        render: () => (
            <div>
                <IconAILoading />
                <IconAILoading />
            </div>
        ),
        html: ['__semi-ai-loading'],
    },
    { name: 'icon-button/默认', covers: ['IconButton'], render: () => <IconButton icon={<IconSearch />} aria-label="Search" /> },
    { name: 'image/默认', covers: ['Image'], render: () => <Image src={imageSrc} width={200} height={100} alt="Semi" />, mountDiff: ['role', 'tabindex', 'aria-haspopup'] },
    { name: 'image/预览默认打开', covers: ['Image'], render: () => <Image src={imageSrc} width={200} height={100} alt="Semi" preview={{ visible: true }} />, mountDiff: ['role', 'tabindex', 'aria-haspopup'], opened: 'dialog' },
    { name: 'image/ImagePreview', covers: ['ImagePreview'], render: () => <ImagePreview src={[imageSrc]} /> },
    { name: 'image/ImagePreview 默认打开', covers: ['ImagePreview'], render: () => <ImagePreview src={[imageSrc]} visible /> },
    { name: 'input/默认', covers: ['Input'], render: () => <Input placeholder="Type" /> },
    { name: 'input/受控值', covers: ['Input'], render: () => <Input value="Controlled value" />, html: ['value="Controlled value"'] },
    { name: 'input/非受控值', covers: ['Input'], render: () => <Input defaultValue="Uncontrolled value" />, html: ['value="Uncontrolled value"'] },
    { name: 'input/前后缀图标', covers: ['Input'], render: () => <Input prefix={<IconSearch />} suffix="kg" showClear />, html: ['semi-input-prefix-icon', 'semi-input-suffix-text'] },
    {
        name: 'input/InputGroup',
        covers: ['InputGroup'],
        render: () => (
            <InputGroup>
                <Input placeholder="First" />
                <Input placeholder="Second" />
            </InputGroup>
        ),
    },
    { name: 'input/TextArea', covers: ['TextArea'], render: () => <TextArea defaultValue="Area text" autosize />, text: ['Area text'] },
    // An empty textarea keeps no content, which would hide the placeholder before hydration
    { name: 'input/TextArea 空值', covers: ['TextArea'], render: () => <TextArea placeholder="Empty" />, html: ['></textarea>'] },
    { name: 'input/readonly', covers: ['Input'], render: () => <Input readonly defaultValue="Locked" />, html: ['readonly', 'value="Locked"'] },
    { name: 'input-number/默认', covers: ['InputNumber'], render: () => <InputNumber defaultValue={3} />, html: ['value="3"'] },
    // The editor is created on mount and fills the container the server left empty; attribute lists cannot describe a
    // subtree (docs/component-issues.md, JsonViewer)
    { name: 'json-viewer/默认', covers: ['JsonViewer'], render: () => <JsonViewer height={120} width={400} value={'{"name":"Semi"}'} />, mountDiff: ['*'] },
    {
        name: 'json-viewer/renderSearchButton 插入默认按钮',
        covers: ['JsonViewer'],
        render: () => <JsonViewer height={120} width={400} value={'{"name":"Semi"}'} renderSearchButton={(defaultButton) => <div class="custom-search">{defaultButton()}</div>} />,
        html: ['custom-search'],
        mountDiff: ['*'],
    },
    {
        name: 'layout/has-sider',
        covers: ['Layout'],
        render: () => (
            <Layout>
                <Layout.Sider>Sider</Layout.Sider>
                <Layout>
                    <Layout.Header>Header</Layout.Header>
                    <Layout.Content>Content</Layout.Content>
                    <Layout.Footer>Footer</Layout.Footer>
                </Layout>
            </Layout>
        ),
        text: ['Sider', 'Content'],
        html: ['semi-layout-has-sider'],
    },
    {
        name: 'layout/has-sider 被包装组件包住的 Sider',
        covers: ['Layout'],
        render: () => {
            const Wrapped = (props: { children: JSX.Element }) => <div>{props.children}</div>;
            return (
                <Layout>
                    <Wrapped>
                        <Layout.Sider>Wrapped sider</Layout.Sider>
                    </Wrapped>
                    <Layout.Content>Content</Layout.Content>
                </Layout>
            );
        },
        text: ['Wrapped sider'],
        html: ['semi-layout-has-sider'],
    },
    {
        name: 'list/默认',
        covers: ['List'],
        render: () => <List dataSource={['First item', 'Second item']} renderItem={(item) => <List.Item>{item}</List.Item>} header={<div>List header</div>} />,
        text: ['First item', 'List header'],
    },
    {
        name: 'locale/默认',
        covers: ['LocaleProvider', 'LocaleConsumer'],
        render: () => (
            <LocaleProvider>
                <LocaleConsumer componentName="Pagination">{(locale) => <span>{locale.pageSize}</span>}</LocaleConsumer>
            </LocaleProvider>
        ),
    },
    { name: 'lottie/默认', covers: ['Lottie'], render: () => <Lottie params={{ path: 'https://example.com/a.json' }} width="100px" height="100px" /> },
    { name: 'markdown-render/md', covers: ['MarkdownRender'], render: () => <MarkdownRender format="md" raw={'# Heading\n\nMarkdown body'} />, text: ['Heading', 'Markdown body'] },
    { name: 'markdown-render/mdx', covers: ['MarkdownRender'], render: () => <MarkdownRender raw="Mdx body" /> },
    { name: 'markdown-render/md 表格', covers: ['MarkdownRender'], render: () => <MarkdownRender format="md" raw={'| Name | **Size** |\n| :-: | -: |\n| Semi | 2 |'} />, text: ['Name', 'Size', 'Semi'] },
    { name: 'modal/默认打开', covers: ['Modal'], render: () => <Modal title="Modal title" visible footer={<Button>Close</Button>} /> },
    { name: 'modal/关闭', covers: ['Modal'], render: () => <Modal title="Modal title" visible={false} /> },
    {
        name: 'modal/useModal',
        covers: ['Modal'],
        render: () => {
            const [, holder] = Modal.useModal();
            return <div>{holder}</div>;
        },
    },
    {
        name: 'navigation/默认',
        covers: ['Nav'],
        render: () => (
            <Nav
                items={[
                    { itemKey: 'user', text: 'Users' },
                    { itemKey: 'job', text: 'Jobs', items: ['Job list', 'Job search'] },
                ]}
                renderItemIcon={() => <IconSearch />}
                header={{ logo: () => <IconUpload />, text: 'Console' }}
                footer={{ collapseButton: true }}
            />
        ),
        text: ['Users', 'Jobs', 'Console'],
    },
    {
        name: 'navigation/水平子菜单默认打开',
        covers: ['Nav'],
        render: () => <Nav mode="horizontal" subDropdownProps={{ visible: true, trigger: 'custom' }} items={[{ itemKey: 'job', text: 'Jobs', items: ['Job list', 'Job search'] }]} />,
        text: ['Jobs'],
        mountDiff: triggerMountDiff,
    },
    {
        name: 'notification/useNotification',
        covers: ['Notification'],
        render: () => {
            const [, holder] = Notification.useNotification();
            return <div>{holder}</div>;
        },
    },
    {
        name: 'overflow-list/默认',
        covers: ['OverflowList'],
        render: () => <OverflowList items={[{ key: 'a' }, { key: 'b' }]} visibleItemRenderer={(item) => <Tag>{item.key}</Tag>} overflowRenderer={(items) => <Tag>+{items.length}</Tag>} />,
        // hidden until measured (docs/component-issues.md, OverflowList)
        mountDiff: [{ selector: '.semi-overflow-list', attrs: ['style'] }],
    },
    { name: 'pagination/默认', covers: ['Pagination'], render: () => <Pagination total={80} />, text: ['1'] },
    { name: 'pagination/showSizeChanger', covers: ['Pagination'], render: () => <Pagination total={80} showSizeChanger /> },
    { name: 'pincode/默认', covers: ['PinCode'], render: () => <PinCode count={4} /> },
    {
        name: 'popconfirm/默认',
        covers: ['Popconfirm'],
        render: () => (
            <Popconfirm title="Sure?" content="Delete it">
                {(t) => <Button {...t()}>Delete</Button>}
            </Popconfirm>
        ),
        text: ['Delete'],
        mountDiff: triggerMountDiff,
    },
    {
        name: 'popconfirm/默认打开',
        covers: ['Popconfirm'],
        render: () => (
            <Popconfirm title="Sure?" defaultVisible>
                {(t) => <Button {...t()}>Delete</Button>}
            </Popconfirm>
        ),
        mountDiff: triggerMountDiff,
    },
    {
        name: 'popover/默认',
        covers: ['Popover'],
        render: () => <Popover content="Popover content">{(t) => <Button {...t()}>Hover</Button>}</Popover>,
        text: ['Hover'],
        mountDiff: triggerMountDiff,
    },
    {
        name: 'popover/showArrow',
        covers: ['Popover'],
        render: () => (
            <Popover content="Popover content" showArrow>
                {(t) => <Button {...t()}>Arrow</Button>}
            </Popover>
        ),
        mountDiff: triggerMountDiff,
    },
    {
        name: 'popover/showArrow 默认打开',
        covers: ['Popover'],
        render: () => (
            <Popover content="Popover content" showArrow visible trigger="custom" aria-label="Arrow details">
                {(t) => <Button {...t()}>Arrow</Button>}
            </Popover>
        ),
        mountDiff: triggerMountDiff,
    },
    { name: 'popover/纯文本触发器', covers: ['Popover'], render: () => <Popover content="Popover content">Plain text</Popover>, text: ['Plain text'], mountDiff: triggerMountDiff },
    { name: 'progress/默认', covers: ['Progress'], render: () => <Progress percent={30} showInfo aria-label="Progress" />, text: ['30'] },
    { name: 'progress/circle', covers: ['Progress'], render: () => <Progress type="circle" percent={60} aria-label="Progress" /> },
    { name: 'radio/默认', covers: ['Radio'], render: () => <Radio checked>Choice</Radio>, text: ['Choice'] },
    {
        name: 'radio/RadioGroup',
        covers: ['RadioGroup'],
        render: () => (
            <RadioGroup defaultValue={1}>
                <Radio value={1}>One</Radio>
                <Radio value={2}>Two</Radio>
            </RadioGroup>
        ),
        text: ['One', 'Two'],
    },
    { name: 'radio/RadioGroup options', covers: ['RadioGroup'], render: () => <RadioGroup options={options} type="button" defaultValue="apple" />, text: ['Apple'] },
    { name: 'rating/默认', covers: ['Rating'], render: () => <Rating defaultValue={3} />, html: ['aria-checked="true" aria-disabled="false" aria-label="3 星"'] },
    { name: 'rating/character', covers: ['Rating'], render: () => <Rating defaultValue={2} character={<span>A</span>} />, text: ['A'], html: ['aria-checked="true" aria-disabled="false" aria-label="2 星"'] },
    { name: 'rating/allowHalf character', covers: ['Rating'], render: () => <Rating allowHalf defaultValue={1.5} character={<span>A</span>} />, text: ['A'] },
    { name: 'resizable/默认', covers: ['Resizable'], render: () => <Resizable defaultSize={{ width: 200, height: 100 }}>Resizable body</Resizable>, text: ['Resizable body'], mountDiff: ['aria-valuemin', 'aria-valuemax', 'aria-valuenow'] },
    {
        name: 'resizable/renderHandle',
        covers: ['Resizable'],
        render: () => (
            <Resizable defaultSize={{ width: 200, height: 100 }} enable={{ left: false }} renderHandle={(direction) => (direction === 'right' || direction === 'left' ? <span>{direction} handle</span> : undefined)}>
                Resizable body
            </Resizable>
        ),
        text: ['right handle'],
        mountDiff: ['aria-valuemin', 'aria-valuemax', 'aria-valuenow'],
    },
    {
        name: 'resizable/ResizeGroup',
        covers: ['ResizeGroup', 'ResizeItem', 'ResizeHandler'],
        render: () => (
            <ResizeGroup direction="horizontal">
                <ResizeItem defaultSize="50%">Left pane</ResizeItem>
                <ResizeHandler />
                <ResizeItem>Right pane</ResizeItem>
            </ResizeGroup>
        ),
        text: ['Left pane'],
        mountDiff: ['id', 'aria-controls', 'aria-valuemin', 'aria-valuemax', 'aria-valuenow', { selector: '.semi-resizable-item', attrs: ['style'] }],
    },
    {
        name: 'scroll-list/默认',
        covers: ['ScrollList', 'ScrollItem'],
        render: () => (
            <ScrollList header="Time">
                <ScrollItem aria-label="Hour" mode="wheel" list={[{ value: 1 }, { value: 2 }]} selectedIndex={0} />
            </ScrollList>
        ),
        // the foundation writes the wheel highlight with classList after mount (docs/component-issues.md, ScrollList)
        mountDiff: [{ selector: '[role="option"]', classes: ['semi-scrolllist-item-selected'] }],
    },
    {
        name: 'select/默认',
        covers: ['Select'],
        render: () => (
            <Select placeholder="Fruit">
                <Select.Option value="apple">Apple</Select.Option>
                <Select.Option value="banana">Banana</Select.Option>
            </Select>
        ),
    },
    { name: 'select/受控值', covers: ['Select'], render: () => <Select optionList={options} value="banana" />, text: ['Banana'] },
    { name: 'select/多选', covers: ['Select'], render: () => <Select optionList={options} multiple defaultValue={['apple', 'banana']} />, text: ['Apple', 'Banana'] },
    {
        name: 'select/OptGroup',
        covers: ['Select'],
        render: () => (
            <Select defaultValue="apple">
                <Select.OptGroup label="Fruits">
                    <Select.Option value="apple">Apple</Select.Option>
                </Select.OptGroup>
            </Select>
        ),
        text: ['Apple'],
    },
    { name: 'select/默认打开', covers: ['Select'], render: () => <Select optionList={options} defaultOpen />, mountDiff: ['aria-expanded', 'aria-controls', 'aria-activedescendant', { selector: '.semi-select', classes: ['semi-select-open', 'semi-select-focus'] }] },
    {
        name: 'side-sheet/默认打开',
        covers: ['SideSheet'],
        render: () => (
            <SideSheet title="Sheet title" visible>
                Sheet body
            </SideSheet>
        ),
    },
    { name: 'side-sheet/关闭', covers: ['SideSheet'], render: () => <SideSheet title="Sheet title" visible={false} /> },
    {
        name: 'skeleton/默认',
        covers: ['Skeleton'],
        render: () => (
            <Skeleton
                loading
                active
                placeholder={
                    <div>
                        <Skeleton.Avatar />
                        <Skeleton.Title />
                        <Skeleton.Paragraph rows={2} />
                        <Skeleton.Image />
                        <Skeleton.Button />
                    </div>
                }
            >
                <p>Loaded</p>
            </Skeleton>
        ),
    },
    { name: 'slider/默认', covers: ['Slider'], render: () => <Slider defaultValue={30} aria-label="Volume" />, html: ['value="30"'] },
    {
        name: 'slider/renderMark 与 tooltipOnMark',
        covers: ['Slider'],
        render: () => <Slider defaultValue={30} aria-label="Volume" marks={{ 20: '20', 40: '40' }} tooltipOnMark renderMark={(_, label) => <b>{`${label}°C`}</b>} />,
        text: ['20°C', '40°C'],
    },
    { name: 'slider/默认打开', covers: ['Slider'], render: () => <Slider defaultValue={30} aria-label="Volume" tooltipVisible />, html: ['value="30"'], mountDiff: triggerMountDiff, opened: 'tooltip' },
    { name: 'slider/range', covers: ['Slider'], render: () => <Slider range defaultValue={[10, 40]} aria-label="Range" />, html: ['value="10"', 'value="40"'] },
    {
        name: 'space/默认',
        covers: ['Space'],
        render: () => (
            <Space>
                <Button>A</Button>
                <Button>B</Button>
            </Space>
        ),
        text: ['A', 'B'],
    },
    { name: 'spin/默认', covers: ['Spin'], render: () => <Spin tip="Loading" />, text: ['Loading'] },
    {
        name: 'spin/包裹内容',
        covers: ['Spin'],
        render: () => (
            <Spin spinning>
                <div>Spin content</div>
            </Spin>
        ),
        text: ['Spin content'],
    },
    {
        name: 'steps/默认',
        covers: ['Steps', 'Step'],
        render: () => (
            <Steps current={1}>
                <Step title="Finished" description="Step one" />
                <Step title="In progress" />
                <Step title="Waiting" />
            </Steps>
        ),
        text: ['Finished', 'In progress'],
    },
    { name: 'switch/默认', covers: ['Switch'], render: () => <Switch defaultChecked aria-label="Toggle" checkedText="On" />, text: ['On'] },
    { name: 'table/默认', covers: ['Table'], render: () => <Table columns={columns} dataSource={rows} pagination={false} />, text: ['Name', 'Semi.fig'] },
    { name: 'table/分页', covers: ['Table'], render: () => <Table columns={columns} dataSource={rows} pagination={{ pageSize: 1 }} />, text: ['Semi.fig'] },
    { name: 'table/rowSelection', covers: ['Table'], render: () => <Table columns={columns} dataSource={rows} rowSelection={{}} pagination={false} /> },
    { name: 'table/空', covers: ['Table'], render: () => <Table columns={columns} dataSource={[]} /> },
    {
        name: 'table/useFullRender 只插入部分节点',
        covers: ['Table'],
        render: () => (
            <Table
                columns={[
                    {
                        dataIndex: 'name',
                        sorter: (a, b) => a.name.localeCompare(b.name),
                        filters: [{ text: 'Figma', value: 'fig' }],
                        onFilter: () => true,
                        useFullRender: true,
                        title: (parts) => (
                            <span class="custom-title">
                                {parts.selection?.()}
                                Name
                                {parts.sorter?.()}
                            </span>
                        ),
                        render: (text, _record, _index, options) => (
                            <span class="custom-cell">
                                {options.selection?.()}
                                {text}
                            </span>
                        ),
                    },
                    columns[1],
                ]}
                dataSource={rows}
                rowSelection={{ hidden: true }}
                pagination={false}
            />
        ),
        text: ['Name', 'Semi.fig'],
        html: ['custom-title', 'custom-cell', 'semi-table-column-sorter'],
    },
    {
        name: 'table/rowSelection.renderCell 插入 originNode',
        covers: ['Table'],
        render: () => <Table columns={columns} dataSource={rows} rowSelection={{ renderCell: (cell) => <div class="custom-selection">{cell.originNode()}</div> }} pagination={false} />,
        html: ['custom-selection'],
    },
    {
        // the merged-away cell never calls render, so its JSX is not created without markup
        name: 'table/合并单元格',
        covers: ['Table'],
        render: () => (
            <Table
                columns={[
                    { title: 'Name', dataIndex: 'name', onCell: (_record, index) => (index === 0 ? { colSpan: 2 } : {}), render: (text) => <strong>{text}</strong> },
                    { title: 'Size', dataIndex: 'size', onCell: (_record, index) => (index === 0 ? { colSpan: 0 } : {}), render: (text) => <strong>{text}</strong> },
                ]}
                dataSource={rows}
                pagination={false}
            />
        ),
        text: ['Semi.fig', 'Semi.pdf', '3M'],
    },
    {
        name: 'table/选择列合并',
        covers: ['Table'],
        render: () => <Table columns={columns} dataSource={rows} rowSelection={{ onCell: (_record, index) => (index === 0 ? { colSpan: 0 } : {}) }} pagination={false} />,
        text: ['Semi.fig'],
    },
    {
        name: 'table/筛选默认打开',
        covers: ['Table'],
        render: () => <Table columns={[{ ...columns[0], filters: [{ text: 'Figma', value: 'fig' }], filterDropdownVisible: true }, columns[1]]} dataSource={rows} pagination={false} />,
        text: ['Name', 'Semi.fig'],
        mountDiff: triggerMountDiff,
    },
    {
        name: 'tabs/默认',
        covers: ['Tabs', 'TabPane'],
        render: () => (
            <Tabs defaultActiveKey="1">
                <TabPane tab="First tab" itemKey="1">
                    First pane
                </TabPane>
                <TabPane tab="Second tab" itemKey="2">
                    Second pane
                </TabPane>
            </Tabs>
        ),
        text: ['First tab', 'First pane'],
    },
    {
        name: 'tabs/collapsible',
        covers: ['Tabs'],
        render: () => (
            <Tabs collapsible>
                <TabPane tab="First tab" itemKey="1">
                    First pane
                </TabPane>
            </Tabs>
        ),
        mountDiff: ['*'],
    },
    {
        name: 'tabs/折叠默认打开',
        covers: ['Tabs'],
        // the fixed width makes the tab list overflow whatever the viewport, so the collapsed menu is really needed
        render: () => (
            <div style={{ width: '300px' }}>
                <Tabs collapsible dropdownProps={{ end: { trigger: 'custom', visible: true } }} tabList={Array.from({ length: 12 }, (_, index) => ({ itemKey: String(index), tab: `tab-${index}` }))} />
            </div>
        ),
        mountDiff: ['*'],
        opened: 'menu',
    },
    {
        name: 'tabs/renderArrow 不用默认箭头',
        covers: ['Tabs'],
        render: () => (
            <Tabs collapsible renderArrow={(_items, pos) => <span>{pos}</span>}>
                <TabPane tab="First tab" itemKey="1">
                    First pane
                </TabPane>
            </Tabs>
        ),
        mountDiff: ['*'],
    },
    {
        name: 'tabs/renderArrow 插入默认箭头',
        covers: ['Tabs'],
        render: () => (
            <Tabs collapsible renderArrow={(_items, pos, _onClick, defaultNode) => <span class={`custom-arrow-${pos}`}>{defaultNode()}</span>}>
                <TabPane tab="First tab" itemKey="1">
                    First pane
                </TabPane>
            </Tabs>
        ),
        html: ['custom-arrow-start'],
        mountDiff: ['*'],
    },
    {
        name: 'tabs/tabList 的 renderTab 与 renderIcon',
        covers: ['Tabs'],
        render: () => (
            <Tabs
                more={1}
                defaultActiveKey="2"
                tabList={[
                    { itemKey: '1', tab: 'First' },
                    { itemKey: '2', tab: 'Second' },
                ]}
                renderTab={(item) => <b>{`${item.tab} tab`}</b>}
                renderIcon={(item) => <i class={`tab-icon-${item.itemKey}`} />}
            >
                Pane
            </Tabs>
        ),
        text: ['First tab', 'Second tab', 'Pane'],
        html: ['tab-icon-1'],
    },
    {
        name: 'tag/默认',
        covers: ['Tag'],
        render: () => (
            <Tag closable avatarSrc={imageSrc}>
                Tag text
            </Tag>
        ),
        text: ['Tag text'],
    },
    {
        name: 'tag/TagGroup',
        covers: ['TagGroup'],
        render: () => <TagGroup maxTagCount={1} showPopover tagList={[{ children: 'First tag' }, { children: 'Second tag' }]} />,
        text: ['First tag'],
        mountDiff: triggerMountDiff,
    },
    {
        name: 'tag/TagGroup 默认打开',
        covers: ['TagGroup'],
        render: () => <TagGroup maxTagCount={1} showPopover popoverProps={{ visible: true, trigger: 'custom', 'aria-label': 'More tags' }} tagList={[{ children: 'First tag' }, { children: 'Second tag' }]} />,
        text: ['First tag'],
        mountDiff: triggerMountDiff,
    },
    {
        name: 'tag/TagGroup 自定义渲染',
        covers: ['TagGroup'],
        render: () => <TagGroup maxTagCount={1} showPopover tagList={[{ children: 'First tag' }, { children: 'Second tag' }]} renderTag={(tag) => <span>{tag.children}</span>} />,
        text: ['First tag'],
        mountDiff: triggerMountDiff,
    },
    {
        name: 'tag/TagGroup 自定义渲染默认打开',
        covers: ['TagGroup'],
        render: () => <TagGroup maxTagCount={1} showPopover popoverProps={{ visible: true, trigger: 'custom', 'aria-label': 'More tags' }} tagList={[{ children: 'First tag' }, { children: 'Second tag' }]} renderTag={(tag) => <span>{tag.children}</span>} />,
        text: ['First tag'],
        mountDiff: triggerMountDiff,
    },
    {
        name: 'tag/SplitTagGroup',
        covers: ['SplitTagGroup'],
        render: () => (
            <SplitTagGroup>
                <Tag>Left</Tag>
                <Tag>Right</Tag>
            </SplitTagGroup>
        ),
        text: ['Left', 'Right'],
    },
    { name: 'tag-input/默认', covers: ['TagInput'], render: () => <TagInput defaultValue={['semi', 'design']} />, text: ['semi', 'design'] },
    { name: 'tag-input/maxTagCount', covers: ['TagInput'], render: () => <TagInput defaultValue={['semi', 'design', 'solid']} maxTagCount={1} showRestTagsPopover />, text: ['semi', '+2'], mountDiff: triggerMountDiff },
    {
        name: 'tag-input/剩余标签默认打开',
        covers: ['TagInput'],
        render: () => <TagInput defaultValue={['semi', 'design', 'solid']} maxTagCount={1} showRestTagsPopover restTagsPopoverProps={{ visible: true, trigger: 'custom', 'aria-label': 'More tags' }} />,
        text: ['semi'],
        mountDiff: triggerMountDiff,
    },
    { name: 'time-picker/默认', covers: ['TimePicker'], render: () => <TimePicker /> },
    { name: 'time-picker/受控值', covers: ['TimePicker'], render: () => <TimePicker value={day} />, html: ['value="12:00:00"'] },
    { name: 'time-picker/默认打开', covers: ['TimePicker'], render: () => <TimePicker defaultValue={day} defaultOpen />, html: ['value="12:00:00"'], mountDiff: ['aria-expanded', 'aria-controls'] },
    {
        name: 'timeline/默认',
        covers: ['Timeline'],
        render: () => (
            <Timeline>
                <Timeline.Item time="2019-07-14">First node</Timeline.Item>
                <Timeline.Item time="2019-06-13">Second node</Timeline.Item>
            </Timeline>
        ),
        text: ['First node'],
    },
    {
        name: 'timeline/dataSource 渲染函数',
        covers: ['Timeline'],
        render: () => (
            <Timeline
                dataSource={[
                    { content: 'First node', time: '2019-07-14' },
                    { content: 'Second node', extra: 'note' },
                ]}
                renderContent={(item) => <b>{`${item.content}!`}</b>}
                renderDot={(_, index) => <i>{index + 1}</i>}
            />
        ),
        text: ['First node!', 'Second node!', 'note'],
    },
    {
        name: 'toast/useToast',
        covers: ['Toast'],
        render: () => {
            const [, holder] = Toast.useToast();
            return <div>{holder}</div>;
        },
    },
    {
        name: 'tooltip/默认',
        covers: ['Tooltip'],
        render: () => <Tooltip content="Tooltip content">{(t) => <Button {...t()}>Hover</Button>}</Tooltip>,
        text: ['Hover'],
        mountDiff: triggerMountDiff,
    },
    { name: 'tooltip/纯文本触发器', covers: ['Tooltip'], render: () => <Tooltip content="Tooltip content">Plain text</Tooltip>, text: ['Plain text'], mountDiff: triggerMountDiff },
    {
        name: 'tooltip/默认打开',
        covers: ['Tooltip'],
        render: () => (
            <Tooltip content="Tooltip content" visible trigger="custom">
                {(t) => <Button {...t()}>Open</Button>}
            </Tooltip>
        ),
        mountDiff: triggerMountDiff,
    },
    {
        name: 'tooltip/禁用按钮',
        covers: ['Tooltip'],
        render: () => (
            <Tooltip content="Tooltip content">
                <Button disabled>Disabled</Button>
            </Tooltip>
        ),
        text: ['Disabled'],
        mountDiff: triggerMountDiff,
    },
    {
        name: 'tooltip/函数子元素禁用按钮',
        covers: ['Tooltip'],
        render: () => (
            <Tooltip content="Tooltip content" trigger="click">
                {(t) => (
                    <Button {...t()} disabled>
                        Disabled
                    </Button>
                )}
            </Tooltip>
        ),
        text: ['Disabled'],
        html: ['semi-tooltip-trigger-wrapper', 'cursor:not-allowed'],
        mountDiff: triggerMountDiff,
    },
    {
        name: 'tooltip/函数子元素加载中按钮',
        covers: ['Tooltip'],
        render: () => (
            <Tooltip content="Tooltip content">
                {(t) => (
                    <Button {...t()} loading>
                        Loading
                    </Button>
                )}
            </Tooltip>
        ),
        text: ['Loading'],
        html: ['semi-tooltip-trigger-wrapper', 'tabindex="-1"'],
        mountDiff: triggerMountDiff,
    },
    {
        name: 'tooltip/函数子元素禁用输入框',
        covers: ['Tooltip'],
        render: () => (
            <Tooltip content="Tooltip content" trigger="click">
                {(t) => <Input {...t()} disabled defaultValue="Disabled input" />}
            </Tooltip>
        ),
        html: ['semi-tooltip-trigger-wrapper', 'cursor:not-allowed', 'Disabled input'],
        mountDiff: triggerMountDiff,
    },
    {
        name: 'tooltip/函数子元素禁用开关',
        covers: ['Tooltip'],
        render: () => (
            <Tooltip content="Tooltip content" trigger="click">
                {(t) => <Switch {...t()} disabled />}
            </Tooltip>
        ),
        html: ['semi-tooltip-trigger-wrapper', 'cursor:not-allowed'],
        mountDiff: triggerMountDiff,
    },
    {
        name: 'tooltip/函数子元素禁用复选框',
        covers: ['Tooltip'],
        render: () => (
            <Tooltip content="Tooltip content" trigger="click">
                {(t) => (
                    <Checkbox {...t()} disabled>
                        Disabled checkbox
                    </Checkbox>
                )}
            </Tooltip>
        ),
        text: ['Disabled checkbox'],
        html: ['semi-tooltip-trigger-wrapper', 'cursor:not-allowed'],
        mountDiff: triggerMountDiff,
    },
    {
        name: 'tooltip/函数子元素禁用滑块',
        covers: ['Tooltip'],
        render: () => (
            <Tooltip content="Tooltip content" trigger="click">
                {(t) => <Slider {...t()} disabled defaultValue={30} />}
            </Tooltip>
        ),
        html: ['semi-tooltip-trigger-wrapper', 'cursor:not-allowed'],
        // Slider puts the trigger ref on its inner wrapper, which takes the pointer-events
        mountDiff: [...triggerMountDiff, { selector: '.semi-slider-wrapper', attrs: ['style'] }],
    },
    {
        name: 'tooltip/函数子元素禁用选择器',
        covers: ['Tooltip'],
        render: () => (
            <Tooltip content="Tooltip content" trigger="click">
                {(t) => <Select {...t()} disabled placeholder="Disabled select" optionList={[{ value: 'a', label: 'A' }]} />}
            </Tooltip>
        ),
        text: ['Disabled select'],
        html: ['semi-tooltip-trigger-wrapper', 'cursor:not-allowed'],
        mountDiff: triggerMountDiff,
    },
    // The remaining special triggers: each hands getTriggerProps its own ref, or the server cannot tell it is disabled
    // and leaves out the wrapper span
    {
        name: 'tooltip/函数子元素禁用自动完成',
        covers: ['Tooltip', 'AutoComplete'],
        render: () => (
            <Tooltip content="Tooltip content" trigger="click">
                {(t) => <AutoComplete {...t()} disabled data={['semi']} placeholder="Disabled auto-complete" />}
            </Tooltip>
        ),
        html: ['semi-tooltip-trigger-wrapper', 'cursor:not-allowed'],
        mountDiff: triggerMountDiff,
    },
    {
        name: 'tooltip/函数子元素禁用级联选择',
        covers: ['Tooltip', 'Cascader'],
        render: () => (
            <Tooltip content="Tooltip content" trigger="click">
                {(t) => <Cascader {...t()} disabled treeData={treeData} placeholder="Disabled cascader" />}
            </Tooltip>
        ),
        text: ['Disabled cascader'],
        html: ['semi-tooltip-trigger-wrapper', 'cursor:not-allowed'],
        mountDiff: triggerMountDiff,
    },
    {
        name: 'tooltip/函数子元素禁用日期选择',
        covers: ['Tooltip', 'DatePicker'],
        render: () => (
            <Tooltip content="Tooltip content" trigger="click">
                {(t) => <DatePicker {...t()} disabled placeholder="Disabled date picker" />}
            </Tooltip>
        ),
        html: ['semi-tooltip-trigger-wrapper', 'cursor:not-allowed'],
        mountDiff: triggerMountDiff,
    },
    {
        name: 'tooltip/函数子元素禁用数字输入框',
        covers: ['Tooltip', 'InputNumber'],
        render: () => (
            <Tooltip content="Tooltip content" trigger="click">
                {(t) => <InputNumber {...t()} disabled defaultValue={3} />}
            </Tooltip>
        ),
        html: ['semi-tooltip-trigger-wrapper', 'cursor:not-allowed'],
        mountDiff: triggerMountDiff,
    },
    {
        name: 'tooltip/函数子元素禁用多行输入框',
        covers: ['Tooltip', 'TextArea'],
        render: () => (
            <Tooltip content="Tooltip content" trigger="click">
                {(t) => <TextArea {...t()} disabled defaultValue="Disabled area" />}
            </Tooltip>
        ),
        text: ['Disabled area'],
        html: ['semi-tooltip-trigger-wrapper', 'cursor:not-allowed'],
        mountDiff: triggerMountDiff,
    },
    {
        name: 'tooltip/函数子元素禁用分页',
        covers: ['Tooltip', 'Pagination'],
        render: () => (
            <Tooltip content="Tooltip content" trigger="click">
                {(t) => <Pagination {...t()} disabled total={50} />}
            </Tooltip>
        ),
        html: ['semi-tooltip-trigger-wrapper', 'cursor:not-allowed'],
        mountDiff: triggerMountDiff,
    },
    {
        name: 'tooltip/函数子元素禁用验证码输入',
        covers: ['Tooltip', 'PinCode'],
        render: () => (
            <Tooltip content="Tooltip content" trigger="click">
                {(t) => <PinCode {...t()} disabled />}
            </Tooltip>
        ),
        html: ['semi-tooltip-trigger-wrapper', 'cursor:not-allowed'],
        mountDiff: triggerMountDiff,
    },
    {
        name: 'tooltip/函数子元素禁用单选框',
        covers: ['Tooltip', 'Radio'],
        render: () => (
            <Tooltip content="Tooltip content" trigger="click">
                {(t) => (
                    <Radio {...t()} disabled>
                        Disabled radio
                    </Radio>
                )}
            </Tooltip>
        ),
        text: ['Disabled radio'],
        html: ['semi-tooltip-trigger-wrapper', 'cursor:not-allowed'],
        mountDiff: triggerMountDiff,
    },
    {
        name: 'tooltip/函数子元素禁用评分',
        covers: ['Tooltip', 'Rating'],
        render: () => (
            <Tooltip content="Tooltip content" trigger="click">
                {(t) => <Rating {...t()} disabled defaultValue={2} />}
            </Tooltip>
        ),
        html: ['semi-tooltip-trigger-wrapper', 'cursor:not-allowed'],
        mountDiff: triggerMountDiff,
    },
    {
        name: 'tooltip/函数子元素禁用标签输入框',
        covers: ['Tooltip', 'TagInput'],
        render: () => (
            <Tooltip content="Tooltip content" trigger="click">
                {(t) => <TagInput {...t()} disabled defaultValue={['semi']} />}
            </Tooltip>
        ),
        text: ['semi'],
        html: ['semi-tooltip-trigger-wrapper', 'cursor:not-allowed'],
        mountDiff: triggerMountDiff,
    },
    {
        name: 'tooltip/函数子元素禁用时间选择',
        covers: ['Tooltip', 'TimePicker'],
        render: () => (
            <Tooltip content="Tooltip content" trigger="click">
                {(t) => <TimePicker {...t()} disabled placeholder="Disabled time picker" />}
            </Tooltip>
        ),
        html: ['semi-tooltip-trigger-wrapper', 'cursor:not-allowed'],
        mountDiff: triggerMountDiff,
    },
    {
        name: 'tooltip/函数子元素禁用穿梭框',
        covers: ['Tooltip', 'Transfer'],
        render: () => (
            <Tooltip content="Tooltip content" trigger="click">
                {(t) => <Transfer {...t()} disabled dataSource={[{ label: 'Option 1', value: 1, key: '1' }]} />}
            </Tooltip>
        ),
        text: ['Option 1'],
        html: ['semi-tooltip-trigger-wrapper', 'cursor:not-allowed'],
        mountDiff: triggerMountDiff,
    },
    {
        name: 'tooltip/函数子元素禁用树选择',
        covers: ['Tooltip', 'TreeSelect'],
        render: () => (
            <Tooltip content="Tooltip content" trigger="click">
                {(t) => <TreeSelect {...t()} disabled treeData={treeData} placeholder="Disabled tree select" />}
            </Tooltip>
        ),
        text: ['Disabled tree select'],
        html: ['semi-tooltip-trigger-wrapper', 'cursor:not-allowed'],
        mountDiff: triggerMountDiff,
    },
    {
        name: 'tooltip/函数子元素禁用上传',
        covers: ['Tooltip', 'Upload'],
        render: () => (
            <Tooltip content="Tooltip content" trigger="click">
                {(t) => <Upload {...t()} disabled action="https://example.com/upload" />}
            </Tooltip>
        ),
        html: ['semi-tooltip-trigger-wrapper', 'cursor:not-allowed'],
        mountDiff: triggerMountDiff,
    },
    { name: 'transfer/默认', covers: ['Transfer'], render: () => <Transfer dataSource={[{ label: 'Option 1', value: 1, key: '1' }]} />, text: ['Option 1'] },
    { name: 'tree/默认', covers: ['Tree'], render: () => <Tree treeData={treeData} defaultExpandAll />, text: ['Asia', 'Beijing'] },
    {
        name: 'tree/renderLabel 与 icon 函数',
        covers: ['Tree'],
        render: () => <Tree treeData={treeData} defaultExpandAll icon={(row) => <IconSearch class={`icon-${row.eventKey}`} />} renderLabel={(label) => <b>{label}</b>} />,
        text: ['Asia', 'Beijing'],
    },
    {
        name: 'tree/renderFullLabel 与 icon',
        covers: ['Tree'],
        render: () => <Tree treeData={treeData} defaultExpandAll icon={<IconSearch />} renderFullLabel={(row) => <div class={row.class}>{row.data.label}</div>} />,
        text: ['Asia', 'Beijing'],
    },
    {
        name: 'tree/renderFullLabel 只在分支行插入 expandIcon',
        covers: ['Tree'],
        render: () => (
            <Tree
                treeData={treeData}
                defaultExpandAll
                expandIcon={(icon) => <IconSearch class={`custom-arrow ${icon.class}`} />}
                renderFullLabel={(row) => (
                    <div class={row.class}>
                        {row.data.children?.length ? row.expandIcon() : null}
                        {row.data.label}
                    </div>
                )}
            />
        ),
        text: ['Asia', 'Beijing'],
        html: ['custom-arrow'],
    },
    { name: 'tree-select/renderLabel', covers: ['TreeSelect'], render: () => <TreeSelect treeData={treeData} value="Beijing" defaultOpen renderLabel={(label) => <b>{label}</b>} />, text: ['Beijing'], mountDiff: ['aria-expanded', 'aria-controls'] },
    { name: 'tree-select/默认', covers: ['TreeSelect'], render: () => <TreeSelect treeData={treeData} placeholder="Node" /> },
    { name: 'tree-select/受控值', covers: ['TreeSelect'], render: () => <TreeSelect treeData={treeData} value="Beijing" />, text: ['Beijing'] },
    { name: 'tree-select/默认打开', covers: ['TreeSelect'], render: () => <TreeSelect treeData={treeData} defaultOpen />, mountDiff: ['aria-expanded', 'aria-controls'] },
    {
        name: 'tree-select/maxTagCount',
        covers: ['TreeSelect'],
        render: () => <TreeSelect multiple maxTagCount={1} showRestTagsPopover treeData={treeData} defaultValue={['Beijing', 'Europe']} />,
        text: ['Beijing'],
        mountDiff: triggerMountDiff,
    },
    {
        name: 'typography/默认',
        covers: ['Typography'],
        render: () => (
            <Typography>
                <Typography.Title heading={3}>Title text</Typography.Title>
                <Typography.Text>Plain text</Typography.Text>
                <Typography.Paragraph>Paragraph text</Typography.Paragraph>
            </Typography>
        ),
        text: ['Title text', 'Plain text', 'Paragraph text'],
    },
    {
        name: 'typography/Numeral',
        covers: ['Typography'],
        render: () => (
            <Typography.Numeral precision={1}>
                Total 12.34 <b>5.678</b>
            </Typography.Numeral>
        ),
        text: ['12.3', '5.678'],
    },
    { name: 'typography/copyable', covers: ['Typography'], render: () => <Typography.Text copyable>Copy me</Typography.Text>, text: ['Copy me'] },
    {
        name: 'typography/ellipsis',
        covers: ['Typography'],
        render: () => <Typography.Paragraph ellipsis={{ rows: 1, showTooltip: true }}>A long paragraph that may be truncated</Typography.Paragraph>,
        text: ['A long paragraph'],
    },
    {
        name: 'upload/默认',
        covers: ['Upload'],
        render: () => (
            <Upload action="https://example.com/upload" defaultFileList={uploadFiles}>
                <Button icon={<IconUpload />}>Upload</Button>
            </Upload>
        ),
        text: ['semi.png'],
    },
    {
        name: 'upload/draggable 自定义内容',
        covers: ['Upload'],
        render: () => (
            <Upload action="https://example.com/upload" draggable dragIcon={<IconSearch />} dragMainText="Main text">
                <div>Drop area</div>
            </Upload>
        ),
        text: ['Drop area'],
    },
    { name: 'upload/picture', covers: ['Upload'], render: () => <Upload action="https://example.com/upload" listType="picture" defaultFileList={uploadFiles} /> },
    {
        name: 'user-guide/默认打开',
        covers: ['UserGuide'],
        render: () => <UserGuide visible steps={[{ target: () => document.body, title: 'Guide title', description: 'Guide body' }]} />,
        // a popup opens after hydration, so the server has nothing to compare with
        mountDiff: ['*'],
    },
    {
        name: 'user-guide/modal 模式默认打开',
        covers: ['UserGuide'],
        render: () => <UserGuide mode="modal" visible steps={[{ title: 'Guide title', description: 'Guide body' }]} renderCover={() => <img alt="Guide cover" />} renderDescription={() => <b>Guide body</b>} />,
        // the dialog opens after hydration, so the server has nothing to compare with
        mountDiff: ['*'],
    },
    { name: 'video-player/默认', covers: ['VideoPlayer'], render: () => <VideoPlayer src={videoSrc} height={300} /> },
];
