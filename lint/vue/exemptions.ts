import type { Exemption } from '../framework.ts';

export interface VueExemption extends Exemption {
    // ESLint template rules (`vue/*`, `vuejs-accessibility/*`), which oxlint does not know
    templateOff?: string[];
}

export const vueExemptions: VueExemption[] = [
    // The wrapper's click is the mouse shortcut for the keyboard-operable native input inside it.
    {
        files: ['packages/semi-ui-vue/src/checkbox/checkbox.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/click-events-have-key-events', 'vuejs-accessibility/no-static-element-interactions'],
    },
    // The native input is nested in the label, which the for/id check cannot see.
    {
        files: ['packages/semi-ui-vue/src/radio/radio.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/label-has-for'],
    },
    // The native radio is nested in the emoji label, which the for/id check cannot see.
    {
        files: ['packages/semi-ui-vue/src/feedback/feedback-content.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/label-has-for'],
    },
    // The row only collects clicks bubbling from the native toggle button, plus the clickHeaderToExpand shortcut.
    {
        files: ['packages/semi-ui-vue/src/collapse/panel.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/click-events-have-key-events', 'vuejs-accessibility/no-static-element-interactions'],
    },
    // The header is a button only when the step has actions to expand; the rule cannot see the conditional role.
    {
        files: ['packages/semi-ai-vue/src/ai-chat-dialogue/widgets/content-item/dialogue-step.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/no-static-element-interactions'],
    },
    // The click on non-focusable content is the behavior under test: Escape must still close the popup afterwards.
    {
        files: ['packages/semi-ui-vue/src/popconfirm/__tests__/fixtures/content-click.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/click-events-have-key-events', 'vuejs-accessibility/no-static-element-interactions'],
    },
    // The autofocus behavior itself is under test.
    {
        files: ['packages/semi-ui-vue/src/checkbox/__tests__/fixtures/late.vue', 'packages/semi-ui-vue/src/radio/__tests__/fixtures/late.vue', 'packages/semi-ui-vue/src/switch/__tests__/fixtures/late.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/no-autofocus'],
    },
    // The popup's dynamic tooltip/dialog role owns the container keyboard and focus handlers.
    {
        files: ['packages/semi-ui-vue/src/tooltip/tooltip.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/no-static-element-interactions'],
    },
    // Dynamic menuitem role the rules cannot read; the enclosing role="menu" keydown handler clicks it.
    {
        files: ['packages/semi-ui-vue/src/dropdown/dropdown-item.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/click-events-have-key-events', 'vuejs-accessibility/no-static-element-interactions'],
    },
    // Dropdown renders the wrapper Tooltip would (Tooltip makes it focusable), to attach the menu keyboard.
    {
        files: ['packages/semi-ui-vue/src/dropdown/dropdown.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/no-static-element-interactions'],
    },
    // APG menu: focus roves among items, so the list is not a focus stop; its keydown handles bubbled keys.
    {
        files: ['packages/semi-ui-vue/src/dropdown/dropdown-menu.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/interactive-supports-focus'],
    },
    // The item is keyboard-operable through the menu, which the rule cannot see on a component.
    {
        files: ['website/content/show/dropdown/demos/events.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/mouse-events-have-key-events'],
    },
    // The heading's text is rendered by Highlight, which the rule cannot see inside a component.
    {
        files: ['website/content/show/highlight/demos/basic.vue', 'website/content/show/highlight/demos/component.vue', 'website/content/show/highlight/demos/highlight-style.vue', 'website/content/show/highlight/demos/multi-style.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/heading-has-content'],
    },
    // Needs a plain div trigger whose keydown handler is the one Dropdown injects.
    {
        files: ['packages/semi-ui-vue/src/dropdown/__tests__/fixtures/focus-elsewhere.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/click-events-have-key-events', 'vuejs-accessibility/no-static-element-interactions'],
    },
    // The root's dynamic button role has keyboard handling; the hidden close target is a pointer shortcut.
    {
        files: ['packages/semi-ui-vue/src/tag/tag.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/no-static-element-interactions'],
    },
    // This event only notifies the caller; Popover independently provides focus and keyboard activation.
    {
        files: ['packages/semi-ui-vue/src/tag/group.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/mouse-events-have-key-events'],
    },
    // Hover only reveals the decorative hoverMask; a clickable avatar is a keyboard-operable button.
    {
        files: ['packages/semi-ui-vue/src/avatar/avatar.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/mouse-events-have-key-events', 'vuejs-accessibility/no-static-element-interactions'],
    },
    // Hover only re-checks overflow; keyboard users reach the tooltip through the overflowing text's tabindex.
    {
        files: ['packages/semi-ui-vue/src/typography/content.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/mouse-events-have-key-events', 'vuejs-accessibility/no-static-element-interactions'],
    },
    // A clickable step gets a bound button role and tabindex that the rule cannot read.
    {
        files: ['packages/semi-ui-vue/src/steps/step.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/no-static-element-interactions'],
    },
    // The li only collects the click bubbling from the content, which is a focusable role="button" owning Enter/Space.
    {
        files: ['packages/semi-ui-vue/src/timeline/timeline-item.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/click-events-have-key-events', 'vuejs-accessibility/no-static-element-interactions'],
    },
    // The caller's aria-label/aria-labelledby or an external label names the input through splitControlAttrs.
    {
        files: ['packages/semi-ui-vue/src/switch/switch.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/form-control-has-label'],
    },
    // Affix and counter clicks only focus the native control; the caller's label names it through splitControlAttrs.
    {
        files: ['packages/semi-ui-vue/src/input/input.vue', 'packages/semi-ui-vue/src/input/textarea.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/click-events-have-key-events', 'vuejs-accessibility/form-control-has-label', 'vuejs-accessibility/no-static-element-interactions'],
    },
    // Label wraps no control and uses `for` only when named; InputGroup's span is not labelable, so aria-labelledby.
    {
        files: ['packages/semi-ui-vue/src/form/label.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/label-has-for'],
    },
    // Handlers only pause countdowns and open the stack; the close buttons carry the keyboard.
    {
        files: ['packages/semi-ui-vue/src/toast/toast-list.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/no-static-element-interactions'],
    },
    // Handlers only pause countdowns and open the stack; the close buttons carry the keyboard.
    {
        files: ['packages/semi-ui-vue/src/notification/notice-list.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/no-static-element-interactions'],
    },
    // x-semi-prop marks DOM for the docs site in this exact spelling; a camelCase attribute on a component would land
    // on the element as xsemiprop.
    {
        files: ['packages/semi-ui-vue/src/toast/toast.vue'],
        off: [],
        templateOff: ['vue/attribute-hyphenation'],
    },
    // x-semi-prop marks DOM for the docs site in this exact spelling; a camelCase attribute on a component would land
    // on the element as xsemiprop.
    {
        files: ['packages/semi-ui-vue/src/empty/empty.vue'],
        off: [],
        templateOff: ['vue/attribute-hyphenation'],
    },
    // x-semi-prop marks DOM for the docs site in this exact spelling; a camelCase attribute on a component would land
    // on the element as xsemiprop.
    {
        files: ['packages/semi-ui-vue/src/banner/banner.vue', 'packages/semi-ui-vue/src/backtop/backtop.vue'],
        off: [],
        templateOff: ['vue/attribute-hyphenation'],
    },
    // x-semi-prop marks DOM for the docs site in this exact spelling; a camelCase attribute on a component would land
    // on the element as xsemiprop.
    {
        files: ['packages/semi-ui-vue/src/card/card.vue'],
        off: [],
        templateOff: ['vue/attribute-hyphenation'],
    },
    // The li only collects click and contextmenu bubbling from the native button inside a clickable item.
    {
        files: ['packages/semi-ui-vue/src/list/item-li.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/click-events-have-key-events', 'vuejs-accessibility/no-static-element-interactions'],
    },
    // Spans only track the pointer; each handle's native range input takes the keys and shows the tooltip on focus.
    {
        files: ['packages/semi-ui-vue/src/slider/slider.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/click-events-have-key-events', 'vuejs-accessibility/mouse-events-have-key-events', 'vuejs-accessibility/no-static-element-interactions'],
    },
    // Pointer only reveals innerButtons; focusing the spinbutton reveals them too and arrow keys replace them.
    {
        files: ['packages/semi-ui-vue/src/input-number/input-number.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/mouse-events-have-key-events', 'vuejs-accessibility/no-static-element-interactions'],
    },
    // The step spans are pointer-only (arrow keys on the input replace them); mousedown keeps focus in the input.
    {
        files: ['packages/semi-ui-vue/src/input-number/step-buttons.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/no-static-element-interactions'],
    },
    // The documented autofocus prop focuses the first digit.
    {
        files: ['packages/semi-ui-vue/src/pincode/pincode.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/no-autofocus'],
    },
    // Root opens the preview (role="button" when it can); the dialog div closes on mask click; img mouse events pan.
    {
        files: ['packages/semi-ui-vue/src/image/image.vue', 'packages/semi-ui-vue/src/image/preview-inner.vue', 'packages/semi-ui-vue/src/image/preview-image.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/no-static-element-interactions'],
    },
    // Pointer drag surface; the keyboard works on the visually hidden range input inside it
    {
        files: ['packages/semi-ui-vue/src/audio-player/audio-slider.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/mouse-events-have-key-events', 'vuejs-accessibility/no-static-element-interactions'],
    },
    // A click on the video is the mouse shortcut for the play button, which Space toggles while focus is in the player
    {
        files: ['packages/semi-ui-vue/src/video-player/video-player.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/click-events-have-key-events', 'vuejs-accessibility/no-static-element-interactions'],
    },
    // Hover only moves the time preview; the role="slider" bar takes the keyboard
    {
        files: ['packages/semi-ui-vue/src/video-player/video-progress.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/mouse-events-have-key-events', 'vuejs-accessibility/no-static-element-interactions'],
    },
    // DOM methods go only to expect()/vi.mocked(), or are kept to run with .call(this); none is called unbound
    {
        files: ['packages/semi-ui-vue/src/audio-player/__tests__/audio-player.test.tsx', 'packages/semi-ui-vue/src/audio-player/__tests__/audio-slider.test.ts', 'packages/semi-ui-vue/src/video-player/__tests__/video-player.test.tsx'],
        off: ['typescript/unbound-method'],
    },
    // Like Select's Option: focus stays on the input (aria-activedescendant); hover only moves the active option
    {
        files: ['website/content/input/select/demos/render-option-item.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/click-events-have-key-events', 'vuejs-accessibility/interactive-supports-focus', 'vuejs-accessibility/mouse-events-have-key-events'],
    },
    // Like Tree's row: the tree keeps focus and handles keys; treeitem role sits on the li Tree wraps around the slot
    {
        files: ['website/content/navigation/tree/demos/full-label-*.vue', 'website/content/navigation/tree/demos/draggable-full-label.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/click-events-have-key-events', 'vuejs-accessibility/no-static-element-interactions'],
    },
    // Search-result option: the combobox handles keys; the rules cannot see the option role Cascader binds on the root
    {
        files: ['website/content/input/cascader/demos/filter-render.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/click-events-have-key-events', 'vuejs-accessibility/interactive-supports-focus', 'vuejs-accessibility/no-static-element-interactions'],
    },
    // mousedown stops mask-release closing; the inner dialog element carries the role and keyboard handling
    {
        files: ['packages/semi-ui-vue/src/modal/modal-content.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/no-static-element-interactions'],
    },
    // x-semi-prop marks DOM for the docs site in this exact spelling; a camelCase attribute on a component would land
    // on the element as xsemiprop.
    {
        files: ['packages/semi-ui-vue/src/modal/modal-dialog.vue'],
        off: [],
        templateOff: ['vue/attribute-hyphenation'],
    },
    // Needs a user input that grabs focus as the dialog opens
    {
        files: ['packages/semi-ui-vue/src/modal/__tests__/fixtures/dialog-component.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/no-autofocus'],
    },
    // APG carousel region: pointer handlers pause rotation; hover tab switching is a shortcut for the tablist keys.
    {
        files: ['packages/semi-ui-vue/src/carousel/carousel.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/mouse-events-have-key-events', 'vuejs-accessibility/no-static-element-interactions'],
    },
    // APG window splitter: focusable role="separator" div; an hr cannot take the grip.
    {
        files: ['packages/semi-ui-vue/src/resizable/resize-handler.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/no-static-element-interactions'],
    },
    // Affix clicks only focus the input; focusin/focusout track entering and leaving the group; autofocus forwards the user's prop
    {
        files: ['packages/semi-ui-vue/src/tag-input/tag-input.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/click-events-have-key-events', 'vuejs-accessibility/no-autofocus', 'vuejs-accessibility/no-static-element-interactions'],
    },
    // role="option" divs never take focus (aria-activedescendant); hover only moves the highlight the arrow keys also
    // move; the root is the combobox or a click wrapper.
    {
        files: ['packages/semi-ui-vue/src/select/option.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/click-events-have-key-events', 'vuejs-accessibility/interactive-supports-focus', 'vuejs-accessibility/mouse-events-have-key-events'],
    },
    {
        files: ['packages/semi-ui-vue/src/select/select-body.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/click-events-have-key-events', 'vuejs-accessibility/interactive-supports-focus', 'vuejs-accessibility/mouse-events-have-key-events', 'vuejs-accessibility/no-static-element-interactions'],
    },
    // Fixtures pass the label through $attrs or omit it to test the locale fallback; typed.vue is never mounted.
    {
        files: [
            'packages/semi-ui-vue/src/select/__tests__/fixtures/basic.vue',
            'packages/semi-ui-vue/src/select/__tests__/fixtures/groups.vue',
            'packages/semi-ui-vue/src/select/__tests__/fixtures/mixed.vue',
            'packages/semi-ui-vue/src/select/__tests__/fixtures/template-options.vue',
            'packages/semi-ui-vue/src/select/__tests__/fixtures/typed.vue',
        ],
        off: [],
        templateOff: ['vuejs-accessibility/form-control-has-label'],
    },
    // Slot and day clicks are pointer shortcuts (keyboard event creation needs a grid, see component-issues).
    {
        files: ['packages/semi-ui-vue/src/calendar/day-col.vue', 'packages/semi-ui-vue/src/calendar/month-calendar.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/click-events-have-key-events', 'vuejs-accessibility/no-static-element-interactions'],
    },
    // Root click is a pointer shortcut; keydown handles keys bubbling from the input; option hover only moves the
    // arrow-key highlight; autofocus forwards.
    {
        files: ['packages/semi-ui-vue/src/auto-complete/auto-complete.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/mouse-events-have-key-events', 'vuejs-accessibility/no-autofocus', 'vuejs-accessibility/no-static-element-interactions'],
    },
    // Root click opens the panel from a #trigger that handles its own keyboard; autofocus forwards the user's prop.
    {
        files: ['packages/semi-ui-vue/src/time-picker/time-picker.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/click-events-have-key-events', 'vuejs-accessibility/no-autofocus', 'vuejs-accessibility/no-static-element-interactions'],
    },
    // APG tabs roving tabindex; the rule cannot evaluate a bound tabindex.
    {
        files: ['packages/semi-ui-vue/src/tabs/tab-item.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/interactive-supports-focus'],
    },
    // The trigger wrapper takes clicks while the search input is the combobox; the dropdown div catches keys once a
    // click inside has focused it
    {
        files: ['packages/semi-ui-vue/src/cascader/cascader.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/no-static-element-interactions'],
    },
    // APG treeitems/options: the combobox keeps focus (aria-activedescendant); treeitem hover expands as arrow keys do;
    // the rule misses the v-bind role.
    {
        files: ['packages/semi-ui-vue/src/cascader/item.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/click-events-have-key-events', 'vuejs-accessibility/interactive-supports-focus', 'vuejs-accessibility/mouse-events-have-key-events', 'vuejs-accessibility/no-static-element-interactions'],
    },
    // loadData mocks return a thenable on purpose, to check the component follows the Promise protocol
    {
        files: ['packages/semi-ui-vue/src/cascader/__tests__/cascader.test.tsx'],
        off: ['unicorn/no-thenable'],
    },
    // The fixture checks that kebab-case attributes in a template reach the camelCase props
    {
        files: ['packages/semi-ui-vue/src/cascader/__tests__/fixtures/kebab.vue'],
        off: [],
        templateOff: ['vue/attribute-hyphenation'],
    },
    // role="button" only for a custom trigger (bound role); else collects bubbled clicks and keys; autofocus forwards.
    {
        files: ['packages/semi-ui-vue/src/date-picker/date-picker.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/no-autofocus', 'vuejs-accessibility/no-static-element-interactions'],
    },
    // Affix and wrapper clicks only focus an input; autofocus forwards the user's prop.
    {
        files: ['packages/semi-ui-vue/src/date-picker/date-input.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/click-events-have-key-events', 'vuejs-accessibility/no-autofocus', 'vuejs-accessibility/no-static-element-interactions'],
    },
    // APG grid: the grid keeps focus (aria-activedescendant); hover only previews what the keyboard previews.
    {
        files: ['packages/semi-ui-vue/src/date-picker/month.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/click-events-have-key-events', 'vuejs-accessibility/interactive-supports-focus', 'vuejs-accessibility/mouse-events-have-key-events'],
    },
    // Tooltip and Modal focus the first [autofocus] element, which picks the guide's primary button (APG dialog).
    {
        files: ['packages/semi-ui-vue/src/user-guide/user-guide.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/no-autofocus'],
    },
    // role="button" div around block content, bound only while it has no inner control (the rule cannot see that).
    {
        files: ['packages/semi-ui-vue/src/upload/add-area.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/no-static-element-interactions'],
    },
    // The click is the pointer shortcut for the card's preview button.
    {
        files: ['packages/semi-ui-vue/src/upload/file-card.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/click-events-have-key-events', 'vuejs-accessibility/no-static-element-interactions'],
    },
    // Upload's file inputs are display: none and out of the Tab order; the add area is the named control.
    {
        files: ['packages/semi-ui-vue/src/upload/upload.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/form-control-has-label'],
    },
    // The tree is the Tab stop with a tabindex the user may override; the rule cannot evaluate a bound tabindex.
    {
        files: ['packages/semi-ui-vue/src/tree/tree.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/interactive-supports-focus'],
    },
    // APG treeitems: the tree keeps focus (aria-activedescendant); aria-selected comes via an attribute object the rule
    // cannot see.
    {
        files: ['packages/semi-ui-vue/src/tree/tree-node.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/click-events-have-key-events', 'vuejs-accessibility/interactive-supports-focus', 'vuejs-accessibility/role-has-required-aria-props'],
    },
    // The async load case returns a thenable on purpose, to check loadData's result is read by the Promise protocol
    {
        files: ['packages/semi-ui-vue/src/tree/__tests__/tree.test.tsx'],
        off: ['unicorn/no-thenable'],
    },
    // Mouse events drive the hover highlight and rowMouseEnter/Leave; row content keeps its own keyboard handling.
    {
        files: ['packages/semi-ui-vue/src/table/body/base-row.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/mouse-events-have-key-events'],
    },
    // mouseleave clears rowSpanHover, which a row removed from the DOM never clears itself; the body is not a control.
    {
        files: ['packages/semi-ui-vue/src/table/body/body.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/mouse-events-have-key-events', 'vuejs-accessibility/no-static-element-interactions'],
    },
    // Root is the combobox via a bound attribute object, or collects bubbled clicks/keys; search-text click focuses the
    // input, which handles keys; autofocus goes to TagInput.
    {
        files: ['packages/semi-ui-vue/src/tree-select/tree-select.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/click-events-have-key-events', 'vuejs-accessibility/no-autofocus', 'vuejs-accessibility/no-static-element-interactions'],
    },
    // The fixture checks that kebab-case attributes in a template reach the camelCase props
    {
        files: ['packages/semi-ui-vue/src/tree-select/__tests__/fixtures/kebab.vue'],
        off: [],
        templateOff: ['vue/attribute-hyphenation'],
    },
    // Drag-over only opens the drop area; the upload button is the keyboard counterpart
    {
        files: ['packages/semi-ai-vue/src/chat/chat.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/no-static-element-interactions'],
    },
    // Input area click only focuses the textarea
    {
        files: ['packages/semi-ai-vue/src/chat/input-box-layout.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/click-events-have-key-events', 'vuejs-accessibility/no-static-element-interactions'],
    },
    // The fixture checks that kebab-case attributes in a template reach the camelCase props
    {
        files: ['packages/semi-ai-vue/src/chat/__tests__/fixtures/kebab.vue'],
        off: [],
        templateOff: ['vue/attribute-hyphenation'],
    },
    // No label in the editor's prose; Select names its combobox from the locale when no aria-label is given.
    {
        files: ['packages/semi-ai-vue/src/ai-chat-input/extension/select-slot.vue'],
        off: [],
        templateOff: ['vuejs-accessibility/form-control-has-label'],
    },
    // Custom slot content forwards the scope's click/hover handlers and role="option" exactly as Select hands them over.
    {
        files: ['packages/semi-ui-vue/src/select/__tests__/select.test.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/no-static-element-interactions', 'jsx-a11y/interactive-supports-focus', 'jsx-a11y/prefer-tag-over-role', 'jsx-a11y/role-has-required-aria-props'],
    },
    // The tests pass an explicit role to check it overrides the component's default one.
    {
        files: ['packages/semi-ui-vue/src/resizable/__tests__/resize-group.test.tsx', 'packages/semi-ui-vue/src/tabs/__tests__/tabs.test.tsx'],
        off: ['jsx-a11y/prefer-tag-over-role'],
    },
    // `<label for>` names a component through its id; the rule only sees nesting or htmlFor, which Vue does not use.
    {
        files: ['packages/semi-ui-vue/src/pincode/__tests__/pincode.test.tsx', 'packages/semi-ui-vue/src/slider/__tests__/slider.test.tsx', 'packages/semi-ui-vue/src/slider/__tests__/slider.browser.test.tsx', 'packages/semi-ui-vue/src/auto-complete/__tests__/auto-complete.test.tsx'],
        off: ['jsx-a11y/label-has-associated-control'],
    },
    // A div role="button" trigger checks that a custom trigger keeps its own click and keydown handlers.
    {
        files: ['packages/semi-ui-vue/src/dropdown/__tests__/dropdown.test.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/prefer-tag-over-role'],
    },
    // The expandIcon and fullLabel slot elements carry the click callbacks under test.
    {
        files: ['packages/semi-ui-vue/src/tree/__tests__/tree-vue.test.tsx', 'packages/semi-ui-vue/src/tree/__tests__/tree-behavior.test.tsx'],
        off: ['jsx-a11y/click-events-have-key-events', 'jsx-a11y/no-static-element-interactions'],
    },
];
