import { isServer } from 'solid-js/web';
import { omitInstanceIds, type GlobalDefaults } from '@fibrae/semi-foundation/base/constants';
import warning from '@fibrae/semi-foundation/utils/warning';
import type { AnchorProps } from '../components/anchor';
import type { AudioPlayerProps } from '../components/audio-player';
import type { AutoCompleteProps } from '../components/auto-complete';
import type { AvatarGroupProps, AvatarProps } from '../components/avatar';
import type { BackTopProps } from '../components/backtop';
import type { BadgeProps } from '../components/badge';
import type { BannerProps } from '../components/banner';
import type { BreadcrumbProps } from '../components/breadcrumb';
import type { ButtonGroupProps, ButtonProps, SplitButtonGroupProps } from '../components/button';
import type { CalendarProps } from '../components/calendar';
import type { CardGroupProps, CardProps } from '../components/card';
import type { CarouselProps } from '../components/carousel';
import type { CascaderProps } from '../components/cascader';
import type { CheckboxGroupProps, CheckboxProps } from '../components/checkbox';
import type { CodeHighlightProps } from '../components/code-highlight';
import type { CollapseProps } from '../components/collapse';
import type { CollapsibleProps } from '../components/collapsible';
import type { ColorPickerProps } from '../components/color-picker';
import type { CropperProps } from '../components/cropper';
import type { DatePickerProps } from '../components/date-picker';
import type { DescriptionsProps } from '../components/descriptions';
import type { DividerProps } from '../components/divider';
import type { DragMoveProps } from '../components/drag-move';
import type { DropdownProps } from '../components/dropdown';
import type { EmptyProps } from '../components/empty';
import type { FeedbackProps } from '../components/feedback';
import type { FloatButtonGroupProps, FloatButtonProps } from '../components/float-button';
import type { ArrayFieldProps, FormProps, SchemaFieldProps, SchemaFormProps } from '../components/form';
import type { ColProps, RowProps } from '../components/grid';
import type { HighlightProps } from '../components/highlight';
import type { HotKeysProps } from '../components/hot-keys';
import type { IconButtonProps } from '../components/icon-button';
import type { ImageProps, PreviewProps as ImagePreviewComponentProps } from '../components/image';
import type { InputGroupProps, InputProps, TextAreaProps } from '../components/input';
import type { InputNumberProps } from '../components/input-number';
import type { JsonViewerProps } from '../components/json-viewer';
import type { LayoutProps } from '../components/layout';
import type { ListProps } from '../components/list';
import type { LottieProps } from '../components/lottie';
import type { MarkdownRenderProps } from '../components/markdown-render';
import type { ModalProps } from '../components/modal';
import type { NavProps } from '../components/navigation';
import type { NoticeProps } from '../components/notification';
import type { OverflowListProps } from '../components/overflow-list';
import type { PaginationProps } from '../components/pagination';
import type { PinCodeProps } from '../components/pincode';
import type { PopconfirmProps } from '../components/popconfirm';
import type { PopoverProps } from '../components/popover';
import type { ProgressProps } from '../components/progress';
import type { RadioGroupProps, RadioProps } from '../components/radio';
import type { RatingProps } from '../components/rating';
import type { ResizableProps, ResizeGroupProps, ResizeHandlerProps, ResizeItemProps } from '../components/resizable';
import type { ScrollItemProps, ScrollListProps } from '../components/scroll-list';
import type { SelectProps } from '../components/select';
import type { SideSheetProps } from '../components/side-sheet';
import type { SkeletonProps } from '../components/skeleton';
import type { SliderProps } from '../components/slider';
import type { SpaceProps } from '../components/space';
import type { SpinProps } from '../components/spin';
import type { StepsProps } from '../components/steps';
import type { SwitchProps } from '../components/switch';
import type { TableProps } from '../components/table/interface';
import type { TabsProps } from '../components/tabs';
import type { SplitTagGroupProps, TagGroupProps, TagProps } from '../components/tag';
import type { TagInputProps } from '../components/tag-input';
import type { TimePickerProps } from '../components/time-picker';
import type { TimelineProps } from '../components/timeline';
import type { ToastProps } from '../components/toast';
import type { TooltipProps } from '../components/tooltip';
import type { TransferProps } from '../components/transfer';
import type { TreeProps } from '../components/tree';
import type { TreeSelectProps } from '../components/tree-select';
import type { TypographyProps } from '../components/typography';
import type { UploadProps } from '../components/upload';
import type { UserGuideProps } from '../components/user-guide';
import type { VideoPlayerProps } from '../components/video-player';

export type { GlobalDefaults };

// Each component adds its entry here; dependent packages add theirs through declaration merging
export interface OverrideDefaultProps {
    Anchor?: GlobalDefaults<AnchorProps>;
    ArrayField?: GlobalDefaults<ArrayFieldProps>;
    AudioPlayer?: GlobalDefaults<AudioPlayerProps>;
    AutoComplete?: GlobalDefaults<AutoCompleteProps>;
    Avatar?: GlobalDefaults<AvatarProps>;
    AvatarGroup?: GlobalDefaults<AvatarGroupProps>;
    BackTop?: GlobalDefaults<BackTopProps>;
    Badge?: GlobalDefaults<BadgeProps>;
    Banner?: GlobalDefaults<BannerProps>;
    Breadcrumb?: GlobalDefaults<BreadcrumbProps>;
    Button?: GlobalDefaults<ButtonProps>;
    ButtonGroup?: GlobalDefaults<ButtonGroupProps>;
    Calendar?: GlobalDefaults<CalendarProps>;
    Card?: GlobalDefaults<CardProps>;
    CardGroup?: GlobalDefaults<CardGroupProps>;
    Carousel?: GlobalDefaults<CarouselProps>;
    Cascader?: GlobalDefaults<CascaderProps>;
    Checkbox?: GlobalDefaults<CheckboxProps>;
    CheckboxGroup?: GlobalDefaults<CheckboxGroupProps>;
    CodeHighlight?: GlobalDefaults<CodeHighlightProps>;
    Col?: GlobalDefaults<ColProps>;
    Collapse?: GlobalDefaults<CollapseProps>;
    Collapsible?: GlobalDefaults<CollapsibleProps>;
    ColorPicker?: GlobalDefaults<ColorPickerProps>;
    Cropper?: GlobalDefaults<CropperProps>;
    DatePicker?: GlobalDefaults<DatePickerProps>;
    Descriptions?: GlobalDefaults<DescriptionsProps>;
    Divider?: GlobalDefaults<DividerProps>;
    DragMove?: GlobalDefaults<DragMoveProps>;
    Dropdown?: GlobalDefaults<DropdownProps>;
    Empty?: GlobalDefaults<EmptyProps>;
    Feedback?: GlobalDefaults<FeedbackProps>;
    FloatButton?: GlobalDefaults<FloatButtonProps>;
    FloatButtonGroup?: GlobalDefaults<FloatButtonGroupProps>;
    Form?: GlobalDefaults<FormProps>;
    Highlight?: GlobalDefaults<HighlightProps>;
    HotKeys?: GlobalDefaults<HotKeysProps>;
    IconButton?: GlobalDefaults<IconButtonProps>;
    Image?: GlobalDefaults<ImageProps>;
    ImagePreview?: GlobalDefaults<ImagePreviewComponentProps>;
    Input?: GlobalDefaults<InputProps>;
    InputGroup?: GlobalDefaults<InputGroupProps>;
    InputNumber?: GlobalDefaults<InputNumberProps>;
    JsonViewer?: GlobalDefaults<JsonViewerProps>;
    Layout?: GlobalDefaults<LayoutProps>;
    List?: GlobalDefaults<ListProps<any>>;
    Lottie?: GlobalDefaults<LottieProps>;
    MarkdownRender?: GlobalDefaults<MarkdownRenderProps>;
    Modal?: GlobalDefaults<ModalProps>;
    Nav?: GlobalDefaults<NavProps>;
    Notification?: GlobalDefaults<NoticeProps>;
    OverflowList?: GlobalDefaults<OverflowListProps>;
    Pagination?: GlobalDefaults<PaginationProps>;
    PinCode?: GlobalDefaults<PinCodeProps>;
    Popconfirm?: GlobalDefaults<PopconfirmProps>;
    Popover?: GlobalDefaults<PopoverProps>;
    Progress?: GlobalDefaults<ProgressProps>;
    Radio?: GlobalDefaults<RadioProps>;
    RadioGroup?: GlobalDefaults<RadioGroupProps>;
    Rating?: GlobalDefaults<RatingProps>;
    Resizable?: GlobalDefaults<ResizableProps>;
    ResizeGroup?: GlobalDefaults<ResizeGroupProps>;
    ResizeHandler?: GlobalDefaults<ResizeHandlerProps>;
    ResizeItem?: GlobalDefaults<ResizeItemProps>;
    Row?: GlobalDefaults<RowProps>;
    SchemaField?: GlobalDefaults<SchemaFieldProps>;
    SchemaForm?: GlobalDefaults<SchemaFormProps>;
    ScrollItem?: GlobalDefaults<ScrollItemProps>;
    ScrollList?: GlobalDefaults<ScrollListProps>;
    Select?: GlobalDefaults<SelectProps>;
    SideSheet?: GlobalDefaults<SideSheetProps>;
    Skeleton?: GlobalDefaults<SkeletonProps>;
    Slider?: GlobalDefaults<SliderProps>;
    Space?: GlobalDefaults<SpaceProps>;
    Spin?: GlobalDefaults<SpinProps>;
    SplitButtonGroup?: GlobalDefaults<SplitButtonGroupProps>;
    SplitTagGroup?: GlobalDefaults<SplitTagGroupProps>;
    Steps?: GlobalDefaults<StepsProps>;
    Switch?: GlobalDefaults<SwitchProps>;
    Table?: GlobalDefaults<TableProps>;
    Tabs?: GlobalDefaults<TabsProps>;
    Tag?: GlobalDefaults<TagProps>;
    TagGroup?: GlobalDefaults<TagGroupProps>;
    TagInput?: GlobalDefaults<TagInputProps>;
    TextArea?: GlobalDefaults<TextAreaProps>;
    TimePicker?: GlobalDefaults<TimePickerProps>;
    Timeline?: GlobalDefaults<TimelineProps>;
    Toast?: GlobalDefaults<ToastProps>;
    Tooltip?: GlobalDefaults<TooltipProps>;
    Transfer?: GlobalDefaults<TransferProps>;
    Tree?: GlobalDefaults<TreeProps>;
    TreeSelect?: GlobalDefaults<TreeSelectProps>;
    Typography?: GlobalDefaults<TypographyProps>;
    Upload?: GlobalDefaults<UploadProps>;
    UserGuide?: GlobalDefaults<UserGuideProps>;
    VideoPlayer?: GlobalDefaults<VideoPlayerProps>;
}

interface SemiGlobalConfig {
    overrideDefaultProps?: OverrideDefaultProps;
}

class SemiGlobal {
    config: SemiGlobalConfig = {};
}

const semiGlobal = new SemiGlobal();
export default semiGlobal;

// The server renders JSX to strings, which every instance can share
const holdsNode = (value: unknown): boolean => (!isServer && value instanceof Node) || (Array.isArray(value) && value.some(holdsNode));

/**
 * The global defaults of one component without per-instance ids, which an untyped caller may still have set, and
 * without DOM nodes: a JSX default is one node that every instance would move into itself.
 */
export function readGlobalDefaults(name: keyof OverrideDefaultProps): Record<string, any> {
    return Object.fromEntries(
        Object.entries(omitInstanceIds(semiGlobal.config.overrideDefaultProps?.[name])).filter(([key, value]) => {
            const node = holdsNode(value);
            warning(node, `[Semi ${name}] The global default '${key}' is a DOM node, which every instance would move into itself, so it is ignored.`);
            return !node;
        })
    );
}
