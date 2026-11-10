import type { Exemption } from '../framework.ts';

// Icons whose onClick is a pointer shortcut for a keyboard path elsewhere, or whose role and tabIndex arrive by spread
export const reactIconOnClickExemptions: Record<string, string | string[]> = {
    // APG Tabs: Delete on the focused tab closes it, so the close icon stays out of the Tab order
    'packages/semi-ui-react/src/components/tabs/tab-item.tsx': 'IconClose',
    // the click is a pointer shortcut; the treeitem expands and collapses with ArrowRight and ArrowLeft
    'packages/semi-ui-react/src/components/tree/tree-node.tsx': 'IconTreeTriangleDown',
    // copyProps spreads role="button", tabIndex and onKeyDown onto the icon
    'packages/semi-ui-react/src/components/typography/copyable.tsx': 'IconCopy',
    // the click is a pointer shortcut; the treeitem expands and collapses with ArrowRight and ArrowLeft
    'website/content/navigation/tree/demos/custom-expand-icon.react.tsx': ['IconMinus', 'IconPlus'],
};

export const reactExemptions: Exemption[] = [
    // useVirtualizer's mutable instance is read during render, so the component opts out of React Compiler
    {
        files: ['packages/semi-ui-react/src/internal/virtual-list.tsx', 'website/content/show/list/demos/virtualized.react.tsx'],
        off: ['react/incompatible-library'],
    },
    // role="button" divs hold block content; a file card's action cannot be a button inside the card's <a>
    {
        files: ['packages/semi-ai-react/src/components/ai-chat-dialogue/dialogue/dialogue-hint.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role'],
    },
    {
        files: ['packages/semi-ai-react/src/components/ai-chat-dialogue/dialogue/content-item/annotation.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role'],
    },
    {
        files: ['packages/semi-ai-react/src/components/ai-chat-dialogue/dialogue/dialogue-content.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role'],
    },
    // Root click only focuses the editor, where the keys are handled; the skill and suggestion lists are textbox-driven
    // listboxes of rich options, which a native select or datalist cannot render
    {
        files: ['packages/semi-ai-react/src/components/ai-chat-input/ai-chat-input.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/no-static-element-interactions', 'jsx-a11y/prefer-tag-over-role'],
    },
    {
        files: ['packages/semi-ai-react/src/components/ai-chat-input/skill-item.tsx', 'packages/semi-ai-react/src/components/ai-chat-input/suggestion-item.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/interactive-supports-focus', 'jsx-a11y/prefer-tag-over-role'],
    },
    // Links are role="link" divs because an <a href> would write the hash
    {
        files: ['packages/semi-ui-react/src/components/anchor/anchor.tsx', 'packages/semi-ui-react/src/components/anchor/link.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role'],
    },
    // The track is a pointer drag surface; the keyboard works on the visually hidden range input
    {
        files: ['packages/semi-ui-react/src/components/audio-player/audio-slider.tsx'],
        off: ['jsx-a11y/no-static-element-interactions'],
    },
    // A text Avatar is a role="img" span holding initials; AvatarGroup is a role="list" div of role="listitem" spans
    {
        files: ['packages/semi-ui-react/src/components/avatar/avatar.tsx', 'packages/semi-ui-react/src/components/avatar/avatar-group.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role'],
    },
    // Callbacks only leave rest props or are called plainly; method-signature Props accept narrower handlers (F6)
    {
        files: ['packages/semi-ui-react/src/components/banner/banner.tsx', 'packages/semi-ui-react/src/components/navigation/item.tsx', 'packages/semi-ui-react/src/components/navigation/collapse-button.tsx'],
        off: ['typescript/unbound-method'],
    },
    // The collapsed "more" trigger is a role="button" span
    {
        files: ['packages/semi-ui-react/src/components/breadcrumb/breadcrumb.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role'],
    },
    // Keyboard target is the role="button" div around block content; the li only receives the bubbled click, and the
    // extra div only marks its clicks so the li can tell them apart
    {
        files: ['packages/semi-ui-react/src/components/timeline/item.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/no-noninteractive-element-interactions', 'jsx-a11y/no-static-element-interactions', 'jsx-a11y/prefer-tag-over-role'],
    },
    // Without href the span is role="link" only when onClick exists; the rule cannot read the conditional role
    {
        files: ['packages/semi-ui-react/src/components/breadcrumb/item.tsx'],
        off: ['jsx-a11y/no-static-element-interactions'],
    },
    // Stops clicks inside a disabled button from reaching ancestors (React skips only the button's own onClick)
    {
        files: ['packages/semi-ui-react/src/components/button/base-button.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/no-static-element-interactions'],
    },
    // role="group" divs: a fieldset brings its own border and padding
    {
        files: [
            'packages/semi-ui-react/src/components/button/button-group.tsx',
            'packages/semi-ui-react/src/components/button/split-button-group.tsx',
            'packages/semi-ui-react/src/components/float-button/float-button-group.tsx',
            'packages/semi-ui-react/src/components/tag/split-tag-group.tsx',
            'packages/semi-ui-react/src/components/tag-input/tag-input.tsx',
        ],
        off: ['jsx-a11y/prefer-tag-over-role'],
    },
    // ARIA table of divs (a native table would redesign layout and styles); slot/day onClick is a pointer shortcut
    {
        files: ['packages/semi-ui-react/src/components/calendar/month-calendar.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role'],
    },
    {
        files: ['packages/semi-ui-react/src/components/calendar/day-col.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role', 'jsx-a11y/click-events-have-key-events', 'jsx-a11y/no-static-element-interactions'],
    },
    // Scroll views are Tab stops so the keyboard can scroll them
    {
        files: ['packages/semi-ui-react/src/components/calendar/day-calendar.tsx', 'packages/semi-ui-react/src/components/calendar/time-grid.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role', 'jsx-a11y/no-noninteractive-tabindex'],
    },
    {
        files: ['packages/semi-ui-react/src/components/calendar/time-col.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role'],
    },
    // Trigger wrapper takes clicks while the search input is the combobox; the dropdown div catches keys after a click
    {
        files: ['packages/semi-ui-react/src/components/cascader/cascader.tsx'],
        off: ['jsx-a11y/no-static-element-interactions'],
    },
    // APG carousel region: an unnamed <section> is generic and disallows aria-roledescription; handlers pause rotation
    {
        files: ['packages/semi-ui-react/src/components/carousel/carousel.tsx'],
        off: ['jsx-a11y/no-noninteractive-element-interactions', 'jsx-a11y/prefer-tag-over-role'],
    },
    // APG treeitems/options: the combobox keeps focus (aria-activedescendant) and handles their keys
    {
        files: ['packages/semi-ui-react/src/components/cascader/item.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/prefer-tag-over-role'],
    },
    // The root span is a click area around label and extra; semantics and keys live on the native input
    {
        files: ['packages/semi-ui-react/src/components/checkbox/checkbox.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/no-static-element-interactions'],
    },
    // The label only forwards the owner's onClick for clicks that reach the native input, which carries the keys
    {
        files: ['packages/semi-ui-react/src/components/radio/radio.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/no-noninteractive-element-interactions'],
    },
    // role="group" div; the root collects focusout so Form's blur validation runs once when focus leaves the group
    {
        files: ['packages/semi-ui-react/src/components/checkbox/checkbox-group.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role', 'jsx-a11y/no-noninteractive-element-interactions'],
    },
    // The input area click only hands focus to the textarea
    {
        files: ['packages/semi-ai-react/src/components/chat/input-box.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/no-static-element-interactions'],
    },
    // role="heading" div because host pages style h3 outside Semi's layers; the row click is a pointer shortcut
    {
        files: ['packages/semi-ui-react/src/components/collapse/item.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role', 'jsx-a11y/click-events-have-key-events', 'jsx-a11y/no-static-element-interactions'],
    },
    // Focusable role="group" div (fieldset adds border and padding); arrow keys move and resize, mouse-down drags
    {
        files: ['packages/semi-ui-react/src/components/cropper/cropper.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role', 'jsx-a11y/no-noninteractive-tabindex', 'jsx-a11y/no-noninteractive-element-interactions'],
    },
    // role="button" div only for a custom trigger, else it collects bubbled clicks/keys; affix clicks focus an input
    {
        files: ['packages/semi-ui-react/src/components/date-picker/date-picker.tsx'],
        off: ['jsx-a11y/no-static-element-interactions'],
    },
    {
        files: ['packages/semi-ui-react/src/components/date-picker/date-input.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/no-static-element-interactions'],
    },
    // APG grid: the grid keeps focus (aria-activedescendant) and handles day-cell keys
    {
        files: ['packages/semi-ui-react/src/components/date-picker/month.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/control-has-associated-label', 'jsx-a11y/interactive-supports-focus', 'jsx-a11y/prefer-tag-over-role'],
    },
    // The role is computed (menuitem, or menuitemcheckbox with showTick), both interactive; the rule cannot see it
    {
        files: ['packages/semi-ui-react/src/components/dropdown/dropdown-item.tsx'],
        off: ['jsx-a11y/no-noninteractive-element-interactions'],
    },
    // Child of the menu ul (li only), so li role="separator", not focusable unlike the rule's interactive separator
    {
        files: ['packages/semi-ui-react/src/components/dropdown/dropdown-divider.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role', 'jsx-a11y/no-noninteractive-element-to-interactive-role'],
    },
    // An unmounting focused notice fires no blur; document.activeElement is external state reconciled each commit
    {
        files: ['packages/semi-ui-react/src/components/notification/notification-list.tsx'],
        off: ['react/set-state-in-effect'],
    },
    // Whether the page cancelled the animation is known only from the DOM (getAnimations) after the class is applied
    {
        files: ['packages/semi-ui-react/src/internal/css-animation/index.ts'],
        off: ['react/set-state-in-effect'],
    },
    // Rows rebuild when the foundation's updateKey moves; it has no subscription, so the check runs each commit
    {
        files: ['packages/semi-ui-react/src/components/form/array-field.tsx'],
        off: ['react/set-state-in-effect'],
    },
    // role="group" div: a fieldset would bring its default border, padding and min-width into the field layout
    {
        files: ['packages/semi-ui-react/src/components/form/group.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role'],
    },
    // Root click opens the preview (role="dialog" div); mask handlers close it and tolerate drags; img mouse events pan
    {
        files: ['packages/semi-ui-react/src/components/image/image.tsx'],
        off: ['jsx-a11y/no-static-element-interactions'],
    },
    {
        files: ['packages/semi-ui-react/src/components/image/preview/preview-inner.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role', 'jsx-a11y/no-noninteractive-element-interactions'],
    },
    {
        files: ['packages/semi-ui-react/src/components/image/preview/preview-image.tsx'],
        off: ['jsx-a11y/no-noninteractive-element-interactions'],
    },
    // Prefix, suffix and wrapper clicks only focus the native input, which owns the keyboard
    {
        files: ['packages/semi-ui-react/src/components/input/input.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/no-static-element-interactions'],
    },
    // Root click toggles the panel (keyboard is on the input); the role="listbox" div never takes focus and only
    // cancels the focus-stealing mousedown
    {
        files: ['packages/semi-ui-react/src/components/auto-complete/auto-complete.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role', 'jsx-a11y/no-static-element-interactions', 'jsx-a11y/interactive-supports-focus'],
    },
    // Root, prefix and suffix clicks only focus the input; focus/blur handlers track entering and leaving the group
    {
        files: ['packages/semi-ui-react/src/components/tag-input/tag-input.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/no-noninteractive-element-interactions', 'jsx-a11y/no-static-element-interactions'],
    },
    // Counter and wrapper clicks only focus the native textarea, which also receives the documented autoFocus
    {
        files: ['packages/semi-ui-react/src/components/input/textarea.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/no-static-element-interactions', 'jsx-a11y/no-autofocus'],
    },
    // role="group" span (fieldset adds border and padding) carrying the documented onFocus and onBlur
    {
        files: ['packages/semi-ui-react/src/components/input/input-group.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role', 'jsx-a11y/no-noninteractive-element-interactions'],
    },
    // role="spinbutton" because type="number" would change parsing and formatting.
    // The step spans are pointer-only (the keyboard uses the input's arrow keys) and their mousedown keeps focus in the input
    {
        files: ['packages/semi-ui-react/src/components/input-number/input-number.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role', 'jsx-a11y/no-static-element-interactions'],
    },
    // List.Item: li gets onClick/onRightClick bubbled from the inner button; the div marks inner clicks the row skips.
    // Notice: root role (alert or status) is not a literal; it carries onClick and the timer-pausing hover handlers
    {
        files: ['packages/semi-ui-react/src/components/list/item.tsx', 'packages/semi-ui-react/src/components/notification/notice.tsx'],
        off: ['jsx-a11y/no-static-element-interactions'],
    },
    {
        files: ['packages/semi-ui-react/src/components/list/item.tsx', 'packages/semi-ui-react/src/components/notification/notice.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/no-noninteractive-element-interactions'],
    },
    // A native modal <dialog> would make body-portaled popups and toasts inert; onMouseDown stops mask-release closing
    {
        files: ['packages/semi-ui-react/src/components/modal/modal-content.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role', 'jsx-a11y/no-static-element-interactions'],
    },
    // The root div carries the documented onClick
    {
        files: ['packages/semi-ui-react/src/components/navigation/footer.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/no-static-element-interactions'],
    },
    // The li carries the documented hover handlers
    {
        files: ['packages/semi-ui-react/src/components/navigation/item.tsx'],
        off: ['jsx-a11y/no-noninteractive-element-interactions'],
    },
    // A popup-menu title is a role="menuitem" div; the enclosing Dropdown handles its keys
    {
        files: ['packages/semi-ui-react/src/components/navigation/sub-nav.tsx'],
        off: ['jsx-a11y/click-events-have-key-events'],
    },
    // role="group" div (fieldset adds border and padding); blur forwards only the focusout leaving the group
    {
        files: ['packages/semi-ui-react/src/components/pincode/pincode.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role', 'jsx-a11y/no-noninteractive-element-interactions'],
    },
    // Only stops the click reaching an outer popup's document listener; its browser test needs a clickable div
    {
        files: ['packages/semi-ui-react/src/components/popconfirm/popconfirm.tsx', 'packages/semi-ui-react/src/components/popconfirm/__tests__/popconfirm.browser.test.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/no-static-element-interactions'],
    },
    // A native <progress> cannot draw the track or SVG ring
    {
        files: ['packages/semi-ui-react/src/components/progress/progress.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role'],
    },
    // The documented autoFocus goes to the native input
    {
        files: ['packages/semi-ui-react/src/components/checkbox/checkbox-inner.tsx'],
        off: ['jsx-a11y/no-autofocus'],
    },
    // The documented autoFocus goes to the native input
    {
        files: ['packages/semi-ui-react/src/components/radio/radio-inner.tsx'],
        off: ['jsx-a11y/no-autofocus'],
    },
    // Stars are ARIA radios over arbitrary character content with half-star clipping
    {
        files: ['packages/semi-ui-react/src/components/rating/item.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role'],
    },
    // APG window splitter: a focusable role="separator" div, since an hr cannot hold the grip or take focus
    {
        files: ['packages/semi-ui-react/src/components/resizable/resize-handler.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role'],
    },
    // A native <select> cannot draw the wheel column; keyboard picking would be a redesign
    {
        files: ['packages/semi-ui-react/src/components/scroll-list/scroll-item.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role', 'jsx-a11y/click-events-have-key-events'],
    },
    // role="option" divs never take focus (aria-activedescendant) and a native <option> cannot live outside <select>;
    // the root is the combobox or a click wrapper
    {
        files: ['packages/semi-ui-react/src/components/select/option.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/interactive-supports-focus', 'jsx-a11y/prefer-tag-over-role'],
    },
    {
        files: ['packages/semi-ui-react/src/components/select/select.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/interactive-supports-focus', 'jsx-a11y/prefer-tag-over-role', 'jsx-a11y/no-static-element-interactions'],
    },
    // role="dialog" div for the same reason as Modal; the title is any ReactNode and may hold block content, which an <hN> does not allow
    {
        files: ['packages/semi-ui-react/src/components/side-sheet/side-sheet-content.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role'],
    },
    // Rail, track, dots and marks are pointer shortcuts; the keyboard works on the handle inputs.
    // The documented autoFocus goes to the first native handle input
    {
        files: ['packages/semi-ui-react/src/components/slider/slider.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/no-static-element-interactions', 'jsx-a11y/no-autofocus'],
    },
    // Native checkbox with role="switch"; a duplicate aria-checked could contradict the native checked.
    // The documented autoFocus goes to the native input
    {
        files: ['packages/semi-ui-react/src/components/switch/switch.tsx'],
        off: ['jsx-a11y/role-has-required-aria-props', 'jsx-a11y/no-autofocus'],
    },
    // The role is the consumer's or else "button", computed at render; the rule cannot resolve it
    {
        files: ['packages/semi-ui-react/src/components/steps/basic-step.tsx', 'packages/semi-ui-react/src/components/steps/fill-step.tsx', 'packages/semi-ui-react/src/components/steps/nav-step.tsx'],
        off: ['jsx-a11y/no-static-element-interactions'],
    },
    // Table elements are replaceable `components` and become divs when virtualized, so they state their roles
    {
        files: ['packages/semi-ui-react/src/components/table/table-header/table-header-row.tsx', 'packages/semi-ui-react/src/components/table/table-cell.tsx', 'packages/semi-ui-react/src/components/table/body/base-row.tsx', 'packages/semi-ui-react/src/components/table/body/body.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role'],
    },
    // A scrolling body may hold no focusable cell, so its scroll container is the Tab stop
    {
        files: ['packages/semi-ui-react/src/components/table/body/body.tsx'],
        off: ['jsx-a11y/no-noninteractive-tabindex'],
    },
    // Pointer-only resize handle, no role (keyboard resizing is out of scope, see the Table section of docs/decisions.md); click stops sorting
    {
        files: ['packages/semi-ui-react/src/components/table/table-header/resizable-header-cell.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/no-static-element-interactions'],
    },
    // The close icon is a role="button" span (the keyboard closes the tab with Backspace or Delete)
    {
        files: ['packages/semi-ui-react/src/components/tabs/tab-item.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role'],
    },
    // A clickable Tag holds block content, so it is a role="button" div
    {
        files: ['packages/semi-ui-react/src/components/tag/tag.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role'],
    },
    // APG combobox input that opens the panel of time lists
    {
        files: ['packages/semi-ui-react/src/components/time-picker/time-picker.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role'],
    },
    // The popup's role is the `role` prop (tooltip or dialog), which jsx-a11y only accepts as a literal; its click only
    // applies clickToHide, and its keys (Escape, the guardFocus Tab trap) are listeners the foundation adds
    {
        files: ['packages/semi-ui-react/src/components/tooltip/tooltip.tsx'],
        off: ['jsx-a11y/no-static-element-interactions', 'jsx-a11y/click-events-have-key-events'],
    },
    // role="list" divs (items are Checkbox spans, virtual rows or dnd-kit wrappers, not li); a disabled Transfer has no
    // focusable item, so each scrolling list is the Tab stop
    {
        files: ['packages/semi-ui-react/src/components/transfer/transfer.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role', 'jsx-a11y/no-noninteractive-tabindex'],
    },
    // APG treeitem: the tree keeps focus (aria-activedescendant) and handles row keys, including checking
    {
        files: ['packages/semi-ui-react/src/components/tree/tree-node.tsx'],
        off: ['jsx-a11y/click-events-have-key-events'],
    },
    // Trigger wrapper takes clicks while the search input is the combobox; placeholder click only focuses the input Tab
    // already reaches; the dropdown div catches Esc
    {
        files: ['packages/semi-ui-react/src/components/tree-select/tree-select.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/no-static-element-interactions'],
    },
    // Add areas are role="button" divs around block content; with an inner control the role drops, the click bubbles
    {
        files: ['packages/semi-ui-react/src/components/upload/upload.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role', 'jsx-a11y/click-events-have-key-events', 'jsx-a11y/no-static-element-interactions'],
    },
    // A file card's click is the pointer shortcut for its preview button
    {
        files: ['packages/semi-ui-react/src/components/upload/file-card.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role', 'jsx-a11y/click-events-have-key-events', 'jsx-a11y/no-noninteractive-element-interactions'],
    },
    // A native range input has no chapter segments
    {
        files: ['packages/semi-ui-react/src/components/video-player/video-progress.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role'],
    },
    // role="dialog" is Popover's role prop (no tag to swap) and holds a range a tooltip may not; role="status" stays a
    // div because form.reset() empties <output>
    {
        files: ['packages/semi-ui-react/src/components/audio-player/audio-player.tsx', 'packages/semi-ui-react/src/components/video-player/video-player.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role'],
    },
    // Like Select's Option: aria-activedescendant keeps focus on the input; native <option> needs <select>
    {
        files: ['website/content/input/select/demos/render-option-item.react.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/interactive-supports-focus', 'jsx-a11y/prefer-tag-over-role'],
    },
    // Like Tree's own row: the tree keeps focus and handles the keys of the row aria-activedescendant points at
    {
        files: ['website/content/navigation/tree/demos/full-label-*.react.tsx', 'website/content/navigation/tree/demos/draggable-full-label.react.tsx'],
        off: ['jsx-a11y/click-events-have-key-events'],
    },
    // Search-result option: the combobox keeps focus and handles its keys
    {
        files: ['website/content/input/cascader/demos/filter-render.react.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/prefer-tag-over-role'],
    },
    // Imports files the src/ alias and package exports cannot reach (package.json, svgs/meta.json)
    {
        files: ['website/content/basic/icon/figures/icon-list.react.tsx'],
        off: ['no-restricted-imports'],
    },
    // Tests render consumer-side option divs, tag spans and click-catching parents; custom options never take focus
    {
        files: ['packages/semi-ui-react/src/components/select/__tests__/*.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/no-static-element-interactions', 'jsx-a11y/interactive-supports-focus', 'jsx-a11y/prefer-tag-over-role'],
    },
    {
        files: ['packages/semi-ui-react/src/components/tree-select/__tests__/*.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/no-static-element-interactions'],
    },
    // Fakes data arriving after mount, or a router redirect in an effect producing two renders in a row
    {
        files: ['packages/semi-ui-react/src/components/table/__tests__/table.browser.test.tsx', 'packages/semi-ui-react/src/components/navigation/__tests__/navigation.browser.test.tsx'],
        off: ['react/set-state-in-effect'],
    },
    // A click-catching parent checks that stopPropagation keeps the popup's clicks from React ancestors
    {
        files: ['packages/semi-ui-react/src/components/tooltip/__tests__/tooltip.test.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/no-static-element-interactions'],
    },
    // Needs a plain div trigger whose keydown handler is the one Dropdown injects
    {
        files: ['packages/semi-ui-react/src/components/dropdown/__tests__/dropdown.browser.test.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/no-static-element-interactions', 'jsx-a11y/no-noninteractive-tabindex'],
    },
    // Needs a user input that grabs focus as the dialog opens
    {
        files: ['packages/semi-ui-react/src/components/modal/__tests__/modal.browser.test.tsx'],
        off: ['jsx-a11y/no-autofocus'],
    },
    // Needs a native autoFocus input inside the container to check StrictMode's simulated unmount leaves focus there
    {
        files: ['packages/semi-ai-react/src/components/sidebar/__tests__/sidebar.test.tsx'],
        off: ['jsx-a11y/no-autofocus'],
    },
    // DOM methods go only to expect()/vi.mocked(), or are kept to restore or run with .call(this); none runs unbound
    {
        files: [
            'packages/semi-ui-react/src/components/audio-player/__tests__/audio-player.test.tsx',
            'packages/semi-ui-react/src/components/dropdown/__tests__/dropdown.test.tsx',
            'packages/semi-ui-react/src/components/navigation/__tests__/navigation.test.tsx',
            'packages/semi-ui-react/src/components/tabs/__tests__/tabs.test.tsx',
            'packages/semi-ui-react/src/components/tag-input/__tests__/tag-input.test.tsx',
            'packages/semi-ui-react/src/components/typography/__tests__/typography.test.tsx',
            'packages/semi-ui-react/src/components/video-player/__tests__/video-player.test.tsx',
        ],
        off: ['typescript/unbound-method'],
    },
    // loadData mocks return a thenable on purpose, to check the component follows the Promise protocol
    {
        files: ['packages/semi-ui-react/src/components/cascader/__tests__/cascader.test.tsx', 'packages/semi-ui-react/src/components/tree/__tests__/tree.test.tsx'],
        off: ['unicorn/no-thenable'],
    },
];
