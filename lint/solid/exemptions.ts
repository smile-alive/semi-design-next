import type { Exemption } from '../framework.ts';

// Icons whose onClick is a pointer shortcut for a keyboard path elsewhere, or whose role and tabIndex arrive by spread
export const solidIconOnClickExemptions: Record<string, string | string[]> = {
    // APG Tabs: Delete on the focused tab closes it, so the close icon stays out of the Tab order
    'packages/semi-ui-solid/src/tabs/tab-item.tsx': 'IconClose',
    // The click is a pointer shortcut; the treeitem expands and collapses with ArrowRight and ArrowLeft
    'packages/semi-ui-solid/src/tree/node-arrow.tsx': 'IconTreeTriangleDown',
    // The click is a pointer shortcut; the treeitem expands and collapses with ArrowRight and ArrowLeft
    'website/content/navigation/tree/demos/custom-expand-icon.solid.tsx': ['IconMinus', 'IconPlus'],
};

export const solidExemptions: Exemption[] = [
    // role="group" divs: a fieldset brings its own border and padding
    {
        files: ['packages/semi-ui-solid/src/button/button-group.tsx', 'packages/semi-ui-solid/src/button/split-button-group.tsx', 'packages/semi-ui-solid/src/float-button/float-button-group.tsx', 'packages/semi-ui-solid/src/tag/split-tag-group.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role'],
    },
    // Native checkbox with role="switch"; a duplicate aria-checked could contradict the native checked
    {
        files: ['packages/semi-ui-solid/src/switch/switch.tsx'],
        off: ['jsx-a11y/role-has-required-aria-props'],
    },
    // The close icon is a role="button" span (the keyboard closes the tab with Backspace or Delete)
    {
        files: ['packages/semi-ui-solid/src/tabs/tab-item.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role'],
    },
    // The popup's role is the `role` prop (tooltip or dialog), which jsx-a11y only accepts as a literal
    {
        files: ['packages/semi-ui-solid/src/tooltip/tooltip.tsx'],
        off: ['jsx-a11y/no-static-element-interactions'],
    },
    // A text Avatar is a role="img" span holding initials; AvatarGroup is a role="list" div of role="listitem" spans
    {
        files: ['packages/semi-ui-solid/src/avatar/avatar.tsx', 'packages/semi-ui-solid/src/avatar/avatar-group.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role'],
    },
    // The role is the consumer's or else "button", computed at render; the rule cannot resolve it
    {
        files: ['packages/semi-ui-solid/src/steps/basic-step.tsx', 'packages/semi-ui-solid/src/steps/fill-step.tsx', 'packages/semi-ui-solid/src/steps/nav-step.tsx'],
        off: ['jsx-a11y/no-static-element-interactions'],
    },
    // role="heading" div because host pages style h3 outside Semi's layers, role="region" div that must not be a
    // section; the row click is a pointer shortcut for the header button
    {
        files: ['packages/semi-ui-solid/src/collapse/panel.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role', 'jsx-a11y/click-events-have-key-events', 'jsx-a11y/no-static-element-interactions'],
    },
    // APG carousel region: an unnamed <section> is generic and disallows aria-roledescription; handlers pause rotation
    {
        files: ['packages/semi-ui-solid/src/carousel/carousel.tsx'],
        off: ['jsx-a11y/no-noninteractive-element-interactions', 'jsx-a11y/prefer-tag-over-role'],
    },
    // A native <progress> cannot draw the track or SVG ring
    {
        files: ['packages/semi-ui-solid/src/progress/progress.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role'],
    },
    // Keyboard target is the role="button" div around block content; the li only receives the bubbled click, and the
    // extra div only marks its clicks so the li can tell them apart
    {
        files: ['packages/semi-ui-solid/src/timeline/item-view.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/no-noninteractive-element-interactions', 'jsx-a11y/no-static-element-interactions', 'jsx-a11y/prefer-tag-over-role'],
    },
    // Only hides an in-card click from document listeners; the buttons inside take the keyboard
    {
        files: ['packages/semi-ui-solid/src/popconfirm/popconfirm.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/no-static-element-interactions'],
    },
    // The role is computed (menuitem, menuitemcheckbox or menuitemradio), all interactive; the rule cannot see it
    {
        files: ['packages/semi-ui-solid/src/dropdown/dropdown-item.tsx'],
        off: ['jsx-a11y/no-noninteractive-element-interactions'],
    },
    // Child of the menu ul (li only), so li role="separator", not focusable unlike the rule's interactive separator
    {
        files: ['packages/semi-ui-solid/src/dropdown/dropdown-divider.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role', 'jsx-a11y/no-noninteractive-element-to-interactive-role'],
    },
    // Needs a plain div trigger whose keydown handler is the one Dropdown injects
    {
        files: ['packages/semi-ui-solid/src/dropdown/__tests__/dropdown.browser.test.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/prefer-tag-over-role'],
    },
    // A clickable or closable Tag gets role="button", computed at render; the rule cannot resolve it
    {
        files: ['packages/semi-ui-solid/src/tag/tag.tsx'],
        off: ['jsx-a11y/no-static-element-interactions'],
    },
    // Prefix, suffix, counter and wrapper clicks only focus the native input or textarea, which owns the keyboard
    {
        files: ['packages/semi-ui-solid/src/input/input.tsx', 'packages/semi-ui-solid/src/input/textarea.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/no-static-element-interactions'],
    },
    // InputGroup is a role="group" span: a fieldset brings its own border and padding
    {
        files: ['packages/semi-ui-solid/src/input/input-group.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role'],
    },
    // role="spinbutton" text input: type="number" would change parsing and formatting; the step spans are pointer-only
    // (the keyboard uses the input's arrow keys)
    {
        files: ['packages/semi-ui-solid/src/input-number/input-number.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role', 'jsx-a11y/no-static-element-interactions'],
    },
    // PinCode is a role="group" div of inputs: a fieldset brings its own border and padding
    {
        files: ['packages/semi-ui-solid/src/pincode/pincode.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role'],
    },
    // The root span is a click area around label and extra; semantics and keys live on the native input
    {
        files: ['packages/semi-ui-solid/src/checkbox/checkbox.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/no-static-element-interactions'],
    },
    // CheckboxGroup is a role="group" div: a fieldset brings its own border and padding
    {
        files: ['packages/semi-ui-solid/src/checkbox/checkbox-group.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role'],
    },
    // The label only forwards the owner's onClick for clicks that reach the native input, which carries the keys
    {
        files: ['packages/semi-ui-solid/src/radio/radio.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/no-noninteractive-element-interactions'],
    },
    // Stars are ARIA radios over arbitrary character content with half-star clipping
    {
        files: ['packages/semi-ui-solid/src/rating/item.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role'],
    },
    // Rail, track, dots and labels are pointer shortcuts and the handle's mouseover only shows its tooltip; the keyboard
    // uses the handle inputs
    {
        files: ['packages/semi-ui-solid/src/slider/slider.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/no-static-element-interactions', 'jsx-a11y/mouse-events-have-key-events'],
    },
    // `<label for>` names the slider through its id; the rule only sees nesting or htmlFor, which Solid does not use
    {
        files: ['packages/semi-ui-solid/src/slider/__tests__/slider.test.tsx', 'packages/semi-ui-solid/src/slider/__tests__/slider.browser.test.tsx'],
        off: ['jsx-a11y/label-has-associated-control'],
    },
    // The ancestor div's onKeyDown checks that handle keys bubble
    {
        files: ['packages/semi-ui-solid/src/slider/__tests__/slider.test.tsx'],
        off: ['jsx-a11y/no-static-element-interactions'],
    },
    // List.Item: the li gets onClick and onRightClick bubbled from the inner button, which carries the keys; the extra
    // div only marks inner clicks the row skips
    {
        files: ['packages/semi-ui-solid/src/list/item.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/no-noninteractive-element-interactions', 'jsx-a11y/no-static-element-interactions'],
    },
    // Anchor links are role="link" divs because an <a href> would write the hash; the link's name comes from the
    // Typography child, which the rule cannot see
    {
        files: ['packages/semi-ui-solid/src/anchor/anchor.tsx', 'packages/semi-ui-solid/src/anchor/link-item.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role'],
    },
    // Anchor link name from the Typography child
    {
        files: ['packages/semi-ui-solid/src/anchor/link-item.tsx'],
        off: ['jsx-a11y/control-has-associated-label'],
    },
    // Anchor test passes a string style on purpose to cover string merging
    {
        files: ['packages/semi-ui-solid/src/anchor/__tests__/anchor.test.tsx'],
        off: ['solid/style-prop'],
    },
    // Calendar month view: ARIA table of divs (a native table would redesign layout and styles); the more card's
    // onMouseDown only marks presses inside the card for click-outside
    {
        files: ['packages/semi-ui-solid/src/calendar/month-calendar.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role', 'jsx-a11y/no-static-element-interactions'],
    },
    // Calendar time slots: ARIA cells whose onClick is a pointer shortcut
    {
        files: ['packages/semi-ui-solid/src/calendar/day-col.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role', 'jsx-a11y/click-events-have-key-events', 'jsx-a11y/no-static-element-interactions'],
    },
    // Calendar scroll views are Tab stops so the keyboard can scroll them
    {
        files: ['packages/semi-ui-solid/src/calendar/day-calendar.tsx', 'packages/semi-ui-solid/src/calendar/time-grid.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role', 'jsx-a11y/no-noninteractive-tabindex'],
    },
    // Calendar time column: ARIA row headers of divs
    {
        files: ['packages/semi-ui-solid/src/calendar/time-col.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role'],
    },
    // Calendar test passes a string style on purpose to cover string merging
    {
        files: ['packages/semi-ui-solid/src/calendar/__tests__/calendar.test.tsx'],
        off: ['solid/style-prop'],
    },
    // Breadcrumb: the collapsed "more" trigger is a role="button" span
    {
        files: ['packages/semi-ui-solid/src/breadcrumb/breadcrumb.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role'],
    },
    // Breadcrumb item without href is role="link" only when onClick exists; the rule cannot read the conditional role
    {
        files: ['packages/semi-ui-solid/src/breadcrumb/item.tsx'],
        off: ['jsx-a11y/no-static-element-interactions'],
    },
    // A native modal <dialog> would make body-portaled popups and toasts inert; the title is any JSX.Element and may hold
    // block content, which an <hN> does not allow
    {
        files: ['packages/semi-ui-solid/src/side-sheet/side-sheet-content.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role'],
    },
    // onMouseDown on the .semi-modal box only records that a press began inside, so releasing it on the mask does not close
    {
        files: ['packages/semi-ui-solid/src/modal/modal-content.tsx'],
        off: ['jsx-a11y/no-static-element-interactions'],
    },
    // A native <select> cannot draw the wheel column; keyboard picking would be a redesign
    {
        files: ['packages/semi-ui-solid/src/scroll-list/scroll-item.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role', 'jsx-a11y/click-events-have-key-events'],
    },
    // role="group" div: a fieldset brings its own border and padding. Root, prefix and suffix clicks only focus the
    // input; focusin/focusout track entering and leaving the group
    {
        files: ['packages/semi-ui-solid/src/tag-input/tag-input.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role', 'jsx-a11y/click-events-have-key-events', 'jsx-a11y/no-static-element-interactions', 'jsx-a11y/no-noninteractive-element-interactions'],
    },
    // role="option" divs never take focus (aria-activedescendant) and a native <option> cannot live outside <select>
    {
        files: ['packages/semi-ui-solid/src/select/option.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/interactive-supports-focus', 'jsx-a11y/prefer-tag-over-role'],
    },
    // Like Option for the custom create row; the listbox and its role="group" runs are ARIA for the same reason; the
    // slot wrappers' onMouseEnter only clears the highlight the arrow keys also move
    {
        files: ['packages/semi-ui-solid/src/select/select.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/interactive-supports-focus', 'jsx-a11y/prefer-tag-over-role', 'jsx-a11y/no-static-element-interactions'],
    },
    // Select tests render consumer-side option divs and click-catching wrappers; custom options never take focus
    {
        files: ['packages/semi-ui-solid/src/select/__tests__/select.test.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/no-static-element-interactions', 'jsx-a11y/interactive-supports-focus', 'jsx-a11y/prefer-tag-over-role'],
    },
    // Select browser tests use click-catching wrappers around the trigger
    {
        files: ['packages/semi-ui-solid/src/select/__tests__/select.browser.test.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/no-static-element-interactions'],
    },
    // APG window splitter: a focusable role="separator" div, since an hr cannot hold the grip or take focus
    {
        files: ['packages/semi-ui-solid/src/resizable/resize-handler.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role'],
    },
    // APG combobox: the input opens the panel of time lists and carries its state; onMouseDown on the root and the
    // panel only marks a press as inside for the click-outside check
    {
        files: ['packages/semi-ui-solid/src/time-picker/time-picker.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role', 'jsx-a11y/no-static-element-interactions'],
    },
    // Root click opens the preview (role="dialog" div); mask handlers close it and tolerate drags; img mouse events pan
    {
        files: ['packages/semi-ui-solid/src/image/image.tsx'],
        off: ['jsx-a11y/no-static-element-interactions'],
    },
    {
        files: ['packages/semi-ui-solid/src/image/preview-inner.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role', 'jsx-a11y/no-noninteractive-element-interactions'],
    },
    {
        files: ['packages/semi-ui-solid/src/image/preview-image.tsx'],
        off: ['jsx-a11y/no-noninteractive-element-interactions'],
    },
    // Focusable role="group" div (fieldset adds border and padding); arrow keys move and resize, pointer-down drags
    {
        files: ['packages/semi-ui-solid/src/cropper/cropper.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role', 'jsx-a11y/no-noninteractive-tabindex', 'jsx-a11y/no-noninteractive-element-interactions'],
    },
    // The file list is a role="list" div: picture cards and the add button share one wrapping row, which ul/li margins break
    {
        files: ['packages/semi-ui-solid/src/upload/upload.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role'],
    },
    // A file card is a role="listitem" div; its click is the pointer shortcut for its preview button
    {
        files: ['packages/semi-ui-solid/src/upload/file-card.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role', 'jsx-a11y/click-events-have-key-events', 'jsx-a11y/no-noninteractive-element-interactions'],
    },
    // The add area is a role="button" div around block content; with an inner control the role drops and the click bubbles
    {
        files: ['packages/semi-ui-solid/src/upload/add-area.tsx'],
        off: ['jsx-a11y/no-static-element-interactions'],
    },
    // APG treeitem: the tree keeps focus (aria-activedescendant) and handles row keys, including checking
    {
        files: ['packages/semi-ui-solid/src/tree/tree-node.tsx'],
        off: ['jsx-a11y/click-events-have-key-events'],
    },
    // loadData mocks return a thenable on purpose, to check the component follows the Promise protocol
    {
        files: ['packages/semi-ui-solid/src/tree/__tests__/tree.test.tsx'],
        off: ['unicorn/no-thenable'],
    },
    // The track is a pointer drag surface; the keyboard works on the visually hidden range input
    {
        files: ['packages/semi-ui-solid/src/audio-player/audio-slider.tsx'],
        off: ['jsx-a11y/no-static-element-interactions'],
    },
    // role="dialog" is Popover's role prop (no tag to swap) and holds a range a tooltip may not; role="status" stays a
    // div because form.reset() empties <output>
    {
        files: ['packages/semi-ui-solid/src/audio-player/audio-player.tsx', 'packages/semi-ui-solid/src/video-player/video-player.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role'],
    },
    // A native range input has no chapter segments
    {
        files: ['packages/semi-ui-solid/src/video-player/video-progress.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role'],
    },
    // APG combobox like Select: the input carries role="combobox" and the popup is a role="listbox" div that never
    // takes focus; options are reached through aria-activedescendant
    {
        files: ['packages/semi-ui-solid/src/auto-complete/auto-complete.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role', 'jsx-a11y/interactive-supports-focus'],
    },
    // `<label for>` names the combobox through the input id; the rule only sees nesting or htmlFor
    {
        files: ['packages/semi-ui-solid/src/auto-complete/__tests__/auto-complete.test.tsx'],
        off: ['jsx-a11y/label-has-associated-control'],
    },
    // role="list" divs (items are Checkbox spans, virtual rows or dnd-kit wrappers, not li); a disabled Transfer has no
    // focusable item, so each scrolling list is the Tab stop
    {
        files: ['packages/semi-ui-solid/src/transfer/transfer.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role', 'jsx-a11y/no-noninteractive-tabindex'],
    },
    // The dropdown container catches the option keys after a click inside it and marks presses there for
    // click-outside; the combobox keeps focus
    {
        files: ['packages/semi-ui-solid/src/cascader/cascader.tsx'],
        off: ['jsx-a11y/no-static-element-interactions'],
    },
    // APG treeitems and options: the combobox keeps focus (aria-activedescendant) and handles their keys
    {
        files: ['packages/semi-ui-solid/src/cascader/item.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/prefer-tag-over-role'],
    },
    // loadData mocks return a thenable on purpose, to check the component follows the Promise protocol
    {
        files: ['packages/semi-ui-solid/src/cascader/__tests__/cascader.test.tsx'],
        off: ['unicorn/no-thenable'],
    },
    // The skill and suggestion lists are textbox-driven listboxes of rich options, which a native select or datalist
    // cannot render
    {
        files: ['packages/semi-ai-solid/src/ai-chat-input/ai-chat-input.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role'],
    },
    // Options stay out of the Tab order: the textbox owns focus and moves the active option through
    // aria-activedescendant, so a click is a pointer shortcut
    {
        files: ['packages/semi-ai-solid/src/ai-chat-input/skill-item.tsx', 'packages/semi-ai-solid/src/ai-chat-input/suggestion-item.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/interactive-supports-focus', 'jsx-a11y/prefer-tag-over-role'],
    },
    // The editor host relays focusin, focusout, keydown and paste from the Tiptap contenteditable inside it, which holds
    // the textbox role
    {
        files: ['packages/semi-ai-solid/src/ai-chat-input/rich-text-input.tsx'],
        off: ['jsx-a11y/no-static-element-interactions'],
    },
    // The input area click only hands focus to the textarea
    {
        files: ['packages/semi-ai-solid/src/chat/input-box.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/no-static-element-interactions'],
    },
    // role="button" divs hold block content; a file card's reference action cannot be a native button inside the
    // card's <a>
    {
        files: ['packages/semi-ai-solid/src/ai-chat-dialogue/widgets/dialogue-hint.tsx', 'packages/semi-ai-solid/src/ai-chat-dialogue/widgets/content-item/annotation.tsx', 'packages/semi-ai-solid/src/ai-chat-dialogue/widgets/dialogue-content.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role'],
    },
    // The step header takes role="button", tabIndex and its handlers only when it has actions to expand; the rule
    // cannot see the conditional role
    {
        files: ['packages/semi-ai-solid/src/ai-chat-dialogue/widgets/content-item/dialogue-step.tsx'],
        off: ['jsx-a11y/no-static-element-interactions'],
    },
    // The single-selection text beside the trigger search input only focuses that input on click; the dropdown div
    // catches Esc and presses for the click-outside check while focus stays on the combobox
    {
        files: ['packages/semi-ui-solid/src/tree-select/tree-select.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/no-static-element-interactions'],
    },
    // TreeSelect tests use click-catching wrapper divs to check stopPropagation
    {
        files: ['packages/semi-ui-solid/src/tree-select/__tests__/tree-select.test.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/no-static-element-interactions'],
    },
    // role="button" div only for a custom trigger, else it collects bubbled clicks/keys; the root and the panel mark
    // presses inside for click outside
    {
        files: ['packages/semi-ui-solid/src/date-picker/date-picker.tsx'],
        off: ['jsx-a11y/no-static-element-interactions'],
    },
    // Affix clicks focus an input
    {
        files: ['packages/semi-ui-solid/src/date-picker/date-input.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/no-static-element-interactions'],
    },
    // APG grid: the grid keeps focus (aria-activedescendant) and handles day-cell keys
    {
        files: ['packages/semi-ui-solid/src/date-picker/month.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/control-has-associated-label', 'jsx-a11y/interactive-supports-focus', 'jsx-a11y/prefer-tag-over-role'],
    },
    // Table elements are replaceable `components` and become divs when virtualized, so they state their roles
    {
        files: ['packages/semi-ui-solid/src/table/table-header-row.tsx', 'packages/semi-ui-solid/src/table/table-cell.tsx', 'packages/semi-ui-solid/src/table/body/base-row.tsx', 'packages/semi-ui-solid/src/table/body/index.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role'],
    },
    // A scrolling body may hold no focusable cell, so its scroll container is the Tab stop
    {
        files: ['packages/semi-ui-solid/src/table/body/index.tsx'],
        off: ['jsx-a11y/no-noninteractive-tabindex'],
    },
    // Pointer-only resize handle, no role (keyboard resizing is out of scope, see the Table section of
    // docs/component-issues.md); click stops sorting
    {
        files: ['packages/semi-ui-solid/src/table/resizable-header-cell.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/no-static-element-interactions'],
    },

    // Demos

    // Like Select's Option: aria-activedescendant keeps focus on the input; native <option> needs <select>
    {
        files: ['website/content/input/select/demos/render-option-item.solid.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/interactive-supports-focus', 'jsx-a11y/prefer-tag-over-role'],
    },
    // Search-result option: the combobox keeps focus and handles its keys
    {
        files: ['website/content/input/cascader/demos/filter-render.solid.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/prefer-tag-over-role'],
    },
    // Content of a Tree row: the treeitem around it keeps focus and handles the keys, so the content takes the pointer only
    {
        files: ['website/content/navigation/tree/demos/full-label-*.solid.tsx', 'website/content/navigation/tree/demos/draggable-full-label.solid.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/no-static-element-interactions'],
    },
];
