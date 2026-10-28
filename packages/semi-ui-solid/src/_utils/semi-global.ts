import { isServer } from 'solid-js/web';
import { omitInstanceIds, type GlobalDefaults } from '@fibrae/semi-foundation/base/constants';
import warning from '@fibrae/semi-foundation/utils/warning';
import type { AnchorProps } from '../anchor';
import type { AudioPlayerProps } from '../audio-player';
import type { AutoCompleteProps } from '../auto-complete';
import type { AvatarGroupProps, AvatarProps } from '../avatar';
import type { BackTopProps } from '../backtop';
import type { BadgeProps } from '../badge';
import type { BannerProps } from '../banner';
import type { BreadcrumbProps } from '../breadcrumb';
import type { ButtonGroupProps, ButtonProps, SplitButtonGroupProps } from '../button';
import type { CalendarProps } from '../calendar';
import type { CardGroupProps, CardProps } from '../card';
import type { CarouselProps } from '../carousel';
import type { CascaderProps } from '../cascader';
import type { CheckboxGroupProps, CheckboxProps } from '../checkbox';
import type { CodeHighlightProps } from '../code-highlight';
import type { CollapseProps } from '../collapse';
import type { CollapsibleProps } from '../collapsible';
import type { ColorPickerProps } from '../color-picker';
import type { CropperProps } from '../cropper';
import type { DatePickerProps } from '../date-picker';
import type { DescriptionsProps } from '../descriptions';
import type { DividerProps } from '../divider';
import type { DragMoveProps } from '../drag-move';
import type { DropdownProps } from '../dropdown';
import type { EmptyProps } from '../empty';
import type { FeedbackProps } from '../feedback';
import type { FloatButtonGroupProps, FloatButtonProps } from '../float-button';
import type { ArrayFieldProps, FormProps } from '../form';
import type { ColProps, RowProps } from '../grid';
import type { HighlightProps } from '../highlight';
import type { HotKeysProps } from '../hot-keys';
import type { IconButtonProps } from '../icon-button';
import type { ImageProps, PreviewProps as ImagePreviewComponentProps } from '../image';
import type { InputGroupProps, InputProps, TextAreaProps } from '../input';
import type { InputNumberProps } from '../input-number';
import type { JsonViewerProps } from '../json-viewer';
import type { LayoutProps } from '../layout';
import type { ListProps } from '../list';
import type { LottieProps } from '../lottie';
import type { MarkdownRenderProps } from '../markdown-render';
import type { ModalProps } from '../modal';
import type { NavProps } from '../navigation';
import type { NoticeProps } from '../notification';
import type { OverflowListProps } from '../overflow-list';
import type { PaginationProps } from '../pagination';
import type { PinCodeProps } from '../pincode';
import type { PopconfirmProps } from '../popconfirm';
import type { PopoverProps } from '../popover';
import type { ProgressProps } from '../progress';
import type { RadioGroupProps, RadioProps } from '../radio';
import type { RatingProps } from '../rating';
import type { ResizableProps, ResizeGroupProps, ResizeHandlerProps, ResizeItemProps } from '../resizable';
import type { ScrollItemProps, ScrollListProps } from '../scroll-list';
import type { SelectProps } from '../select';
import type { SideSheetProps } from '../side-sheet';
import type { SkeletonProps } from '../skeleton';
import type { SliderProps } from '../slider';
import type { SpaceProps } from '../space';
import type { SpinProps } from '../spin';
import type { StepsProps } from '../steps';
import type { SwitchProps } from '../switch';
import type { TableProps } from '../table/interface';
import type { TabsProps } from '../tabs';
import type { SplitTagGroupProps, TagGroupProps, TagProps } from '../tag';
import type { TagInputProps } from '../tag-input';
import type { TimePickerProps } from '../time-picker';
import type { TimelineProps } from '../timeline';
import type { ToastProps } from '../toast';
import type { TooltipProps } from '../tooltip';
import type { TransferProps } from '../transfer';
import type { TreeProps } from '../tree';
import type { TreeSelectProps } from '../tree-select';
import type { TypographyProps } from '../typography';
import type { UploadProps } from '../upload';
import type { UserGuideProps } from '../user-guide';
import type { VideoPlayerProps } from '../video-player';

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
