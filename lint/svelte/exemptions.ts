import type { Exemption } from '../framework.ts';

export interface SvelteExemption extends Exemption {
    // ESLint template rules (`svelte/*`), which oxlint does not know
    templateOff?: string[];
    // Svelte compiler warning codes (`a11y_*`, reported by svelte-check), dropped by compiler-warnings.ts
    compilerOff?: string[];
}

export const svelteExemptions: SvelteExemption[] = [
    // Named scrollable regions must take keyboard focus so the list can be scrolled without a pointer (axe scrollable-region-focusable)
    {
        files: ['website/content/show/list/demos/scroll-load.svelte', 'website/content/show/list/demos/virtualized.svelte'],
        off: [],
        compilerOff: ['a11y_no_noninteractive_tabindex'],
    },
    // A hand-drawn option row is driven by the combobox's aria-activedescendant: the row never takes focus and the keyboard
    // selects on the combobox, so the row has neither a tabindex nor its own key handler
    {
        files: ['website/content/input/select/demos/render-option-item.svelte'],
        off: [],
        compilerOff: ['a11y_interactive_supports_focus', 'a11y_click_events_have_key_events'],
    },
    // The root's tabindex is only ever -1, the programmatic focus target while blocked; the compiler cannot tell statically
    {
        files: ['packages/semi-ui-svelte/src/spin/spin.svelte'],
        off: [],
        compilerOff: ['a11y_no_noninteractive_tabindex'],
    },
    // The mask and resize handles are pointer-only drag surfaces; the crop box is a named group the keyboard moves with
    // arrow keys (see its aria-describedby help text), and its tabindex only appears once the image has loaded
    {
        files: ['packages/semi-ui-svelte/src/cropper/cropper.svelte'],
        off: [],
        compilerOff: ['a11y_no_static_element_interactions', 'a11y_no_noninteractive_tabindex', 'a11y_no_noninteractive_element_interactions'],
    },
    // The shown number starts at the first percent and animates from there, so only the initial value is captured on purpose
    {
        files: ['packages/semi-ui-svelte/src/progress/progress.svelte'],
        off: [],
        compilerOff: ['state_referenced_locally'],
    },
    // Host-contract probe: hands the props object to the host and exposes the foundation once at setup, as a component would
    {
        files: ['packages/semi-ui-svelte/src/_base/__tests__/contract-probe.svelte'],
        off: [],
        compilerOff: ['state_referenced_locally'],
    },
    // Registration probe for Y-H8: a tab pane registers its initial title once, which is the pattern being measured
    {
        files: ['vitest/svelte/__probes__/tab-pane.svelte'],
        off: [],
        compilerOff: ['state_referenced_locally'],
    },
    // The header row's click listener only catches clicks that bubble from the native toggle button (keyboard and assistive tech included) and from the row's other parts
    {
        files: ['packages/semi-ui-svelte/src/collapse/panel.svelte'],
        off: [],
        compilerOff: ['a11y_click_events_have_key_events', 'a11y_no_static_element_interactions'],
    },
    // The markup comes from Shiki, which escapes the code text; the markup is the component's whole output
    {
        files: ['packages/semi-ui-svelte/src/code-highlight/code-highlight.svelte'],
        off: [],
        templateOff: ['svelte/no-at-html-tags'],
    },
    // Hover only toggles the hover mask and notifies onMouseEnter and onMouseLeave; the avatar's own focus target is the clickable one
    {
        files: ['packages/semi-ui-svelte/src/avatar/avatar.svelte'],
        off: [],
        compilerOff: ['a11y_no_static_element_interactions'],
    },
    // A focusable separator is the WAI-ARIA window splitter: it takes focus and the arrow keys, but the compiler treats separator as non-interactive
    {
        files: ['packages/semi-ui-svelte/src/resizable/resize-handler.svelte'],
        off: [],
        compilerOff: ['a11y_no_noninteractive_tabindex', 'a11y_no_noninteractive_element_interactions'],
    },
    // The wrapper and the prefix and suffix are pointer conveniences that hand focus to the native input, the real keyboard target
    {
        files: ['packages/semi-ui-svelte/src/input/input.svelte', 'packages/semi-ui-svelte/src/input/textarea.svelte'],
        off: [],
        compilerOff: ['a11y_click_events_have_key_events', 'a11y_no_static_element_interactions'],
    },
    // The trigger wrapper span is the Tab stop that opens the tooltip by focus for a trigger that is not focusable itself (text, an icon)
    {
        files: ['packages/semi-ui-svelte/src/tooltip/tooltip.svelte'],
        off: [],
        compilerOff: ['a11y_no_noninteractive_tabindex'],
    },
    // The mask is an aria-hidden pointer-only surface; the keyboard closes the sheet with the close button and Escape
    {
        files: ['packages/semi-ui-svelte/src/side-sheet/side-sheet.svelte'],
        off: [],
        compilerOff: ['a11y_click_events_have_key_events', 'a11y_no_static_element_interactions'],
    },
    // The autofocus input is the fixture of the case that checks the sheet focuses an autofocus element on open
    {
        files: ['packages/semi-ui-svelte/src/side-sheet/__tests__/side-sheet-fixture.svelte'],
        off: [],
        compilerOff: ['a11y_autofocus'],
    },
    // The rail, track, mark dots and mark labels are pointer shortcuts; the keyboard moves the value through the native range inputs in the handles
    {
        files: ['packages/semi-ui-svelte/src/slider/slider.svelte'],
        off: [],
        compilerOff: ['a11y_click_events_have_key_events', 'a11y_no_static_element_interactions'],
    },
    // A step is a div that becomes a button (role and tabindex 0, Enter and Space switch it) only when its Steps or the step itself listens for clicks; the compiler cannot see that
    {
        files: ['packages/semi-ui-svelte/src/steps/step.svelte'],
        off: [],
        compilerOff: ['a11y_no_noninteractive_tabindex'],
    },
    // The li's click listener catches clicks that bubble from the native button inside it (keyboard and assistive tech included) and from the row's blank parts; the button is the keyboard target
    {
        files: ['packages/semi-ui-svelte/src/list/item.svelte'],
        off: [],
        compilerOff: ['a11y_click_events_have_key_events', 'a11y_no_noninteractive_element_interactions'],
    },
    // The step buttons are pointer-only press targets without role or tab stop; the keyboard steps with the input's arrow keys
    {
        files: ['packages/semi-ui-svelte/src/input-number/step-buttons.svelte'],
        off: [],
        compilerOff: ['a11y_no_static_element_interactions'],
    },
    // The list only watches the pointer and focus to pause the countdowns and expand a stack; the toasts' buttons are the interactive targets. It renders one store for its whole life, so the store prop is read once
    {
        files: ['packages/semi-ui-svelte/src/toast/toast-list.svelte'],
        off: [],
        compilerOff: ['a11y_no_static_element_interactions', 'state_referenced_locally'],
    },
    // The tag becomes a button (role and tabindex 0, Enter, Space, Backspace and Delete act) only when it listens for clicks or can close; the close icon is a pointer shortcut, the tag is the keyboard target
    {
        files: ['packages/semi-ui-svelte/src/tag/tag.svelte'],
        off: [],
        compilerOff: ['a11y_no_noninteractive_tabindex', 'a11y_click_events_have_key_events', 'a11y_no_static_element_interactions'],
    },
    // The item's role is dynamic (menuitem, menuitemcheckbox or menuitemradio) with the roving tabindex -1 the menu keyboard moves focus by
    {
        files: ['packages/semi-ui-svelte/src/dropdown/dropdown-item.svelte'],
        off: [],
        compilerOff: ['a11y_no_noninteractive_tabindex'],
    },
    // The trigger wrapper span is the Tab stop that opens the menu for a trigger that is not focusable itself (text, an icon)
    {
        files: ['packages/semi-ui-svelte/src/dropdown/dropdown.svelte'],
        off: [],
        compilerOff: ['a11y_no_noninteractive_tabindex'],
    },
    // The Dropdown creates its context object once and never replaces it, so the initial value is the value
    {
        files: ['packages/semi-ui-svelte/src/dropdown/dropdown-popup.svelte'],
        off: [],
        compilerOff: ['state_referenced_locally'],
    },
    // The position list only watches the pointer and focus to pause the countdowns and expand a stack; the notices' buttons are the interactive targets
    {
        files: ['packages/semi-ui-svelte/src/notification/notice-list.svelte'],
        off: [],
        compilerOff: ['a11y_no_static_element_interactions'],
    },
    // The list renders one store for its whole life, so the store prop is read once
    {
        files: ['packages/semi-ui-svelte/src/notification/notification-list.svelte'],
        off: [],
        compilerOff: ['state_referenced_locally'],
    },
    // The autofocus input is the fixture of the case that checks the dialog focuses an autofocus element on open
    {
        files: ['packages/semi-ui-svelte/src/modal/__tests__/modal-fixture.svelte'],
        off: [],
        compilerOff: ['a11y_autofocus'],
    },
    // The thumbnail root becomes a button (role and tabindex 0, Enter and Space open it) only when its preview can open; the compiler cannot see that
    {
        files: ['packages/semi-ui-svelte/src/image/image.svelte'],
        off: [],
        compilerOff: ['a11y_no_noninteractive_tabindex'],
    },
    // The trigger's combobox role arrives in a spread the compiler cannot read. The keyboard stays on the combobox
    // (aria-activedescendant), so option rows take no focus or keys, and the list wrapper and slot boxes only watch the
    // pointer to keep the focus on the combobox and reset the highlight
    {
        files: ['packages/semi-ui-svelte/src/select/select.svelte'],
        off: [],
        compilerOff: ['a11y_no_noninteractive_tabindex', 'a11y_interactive_supports_focus', 'a11y_click_events_have_key_events', 'a11y_no_static_element_interactions'],
    },
    // The trigger's combobox role arrives in a spread the compiler cannot read, and with a search input on the trigger the
    // root is a plain wrapper whose tabindex is -1. The keyboard stays on the combobox (aria-activedescendant), so tree
    // rows take no focus; the selected text beside the search input only hands the focus to it, and the dropdown box
    // only watches the pointer to keep the focus on the combobox
    {
        files: ['packages/semi-ui-svelte/src/tree-select/tree-select.svelte'],
        off: [],
        compilerOff: ['a11y_no_noninteractive_tabindex', 'a11y_click_events_have_key_events', 'a11y_no_static_element_interactions'],
    },
    // The root only wraps the combobox input (or a custom trigger): tabindex -1 keeps Tooltip's trigger tabindex 0 off it so the input is the one Tab stop, and its key and click handlers receive what bubbles up from the input
    {
        files: ['packages/semi-ui-svelte/src/auto-complete/auto-complete.svelte'],
        off: [],
        compilerOff: ['a11y_no_noninteractive_tabindex'],
    },
    // The close icon is a named button for the pointer and screen readers; the tab itself closes from the keyboard (Backspace, Delete), so the icon stays out of the Tab order
    {
        files: ['packages/semi-ui-svelte/src/tabs/tab-item.svelte'],
        off: [],
        compilerOff: ['a11y_interactive_supports_focus', 'a11y_click_events_have_key_events'],
    },
    // The time slots are pointer-only: a cell has no keyboard way to pick a half hour (every slot a button would add 48 Tab stops per column)
    {
        files: ['packages/semi-ui-svelte/src/calendar/day-col.svelte'],
        off: [],
        compilerOff: ['a11y_click_events_have_key_events', 'a11y_no_static_element_interactions'],
    },
    // The table scrolls and nothing inside it takes focus, so the keyboard can only scroll it through its root
    {
        files: ['packages/semi-ui-svelte/src/calendar/day-calendar.svelte', 'packages/semi-ui-svelte/src/calendar/time-grid.svelte'],
        off: [],
        compilerOff: ['a11y_no_noninteractive_tabindex'],
    },
    // A custom trigger's wrapper becomes a button (role and tabindex 0, Enter, Space and Down Arrow open the panel) only while the trigger has no focus target of its own, which is known once it mounts
    {
        files: ['packages/semi-ui-svelte/src/time-picker/time-picker.svelte'],
        off: [],
        compilerOff: ['a11y_no_noninteractive_tabindex'],
    },
    // The prefix and suffix are pointer conveniences that hand focus to the native input, the real keyboard target
    {
        files: ['packages/semi-ui-svelte/src/tag-input/tag-input.svelte'],
        off: [],
        compilerOff: ['a11y_click_events_have_key_events', 'a11y_no_static_element_interactions'],
    },
    // The lists are scroll containers that take a Tab stop only while the transfer is disabled, since the enabled one has focusable controls inside; the compiler cannot tell statically
    {
        files: ['packages/semi-ui-svelte/src/transfer/transfer.svelte'],
        off: [],
        compilerOff: ['a11y_no_noninteractive_tabindex'],
    },
    // The title is a span that becomes a role=link Tab stop only when a click handler exists and it has no href, which the compiler cannot tell statically
    {
        files: ['packages/semi-ui-svelte/src/breadcrumb/breadcrumb-item.svelte'],
        off: [],
        compilerOff: ['a11y_no_noninteractive_tabindex'],
    },
    // The drag surfaces take the pointer for sighted users; each hosts native range inputs that carry the role, name and keyboard. The props object is handed to the foundation host as a live view, not read once
    {
        files: ['packages/semi-ui-svelte/src/color-picker/alpha-slider.svelte', 'packages/semi-ui-svelte/src/color-picker/color-choose-area.svelte', 'packages/semi-ui-svelte/src/color-picker/color-slider.svelte'],
        off: [],
        compilerOff: ['a11y_no_static_element_interactions', 'state_referenced_locally'],
    },
    {
        files: ['packages/semi-ui-svelte/src/color-picker/data-part.svelte'],
        off: [],
        compilerOff: ['state_referenced_locally'],
    },
    // The add area is a div role="button" with tabindex 0 until the content holds a control of its own, then it drops both; the compiler cannot tell statically
    {
        files: ['packages/semi-ui-svelte/src/upload/add-area.svelte'],
        off: [],
        compilerOff: ['a11y_no_noninteractive_tabindex'],
    },
    // DOM methods go only to expect()/vi.mocked(), or are kept to run with .call(this); none is called unbound
    {
        files: ['packages/semi-ui-svelte/src/audio-player/__tests__/audio-player.test.ts', 'packages/semi-ui-svelte/src/audio-player/__tests__/audio-slider.test.ts', 'packages/semi-ui-svelte/src/video-player/__tests__/video-player.test.ts'],
        off: ['typescript/unbound-method'],
    },
    // A custom trigger's wrapper becomes a button (role and tabindex 0, Enter, Space and Down Arrow open the panel) only while the trigger has no focus target of its own, which is known once it mounts
    {
        files: ['packages/semi-ui-svelte/src/date-picker/date-picker.svelte'],
        off: [],
        compilerOff: ['a11y_no_noninteractive_tabindex'],
    },
    // The range wrappers, separator, label and suffix are pointer conveniences that hand focus to the native inputs, the real keyboard targets. The props object is handed to the foundation host as a live view, not read once
    {
        files: ['packages/semi-ui-svelte/src/date-picker/date-input.svelte'],
        off: [],
        compilerOff: ['a11y_click_events_have_key_events', 'a11y_no_static_element_interactions', 'state_referenced_locally'],
    },
    // APG grid with aria-activedescendant: the grid takes the focus and the keys, the day cells only take the pointer
    {
        files: ['packages/semi-ui-svelte/src/date-picker/month.svelte'],
        off: [],
        compilerOff: ['a11y_interactive_supports_focus', 'a11y_click_events_have_key_events'],
    },
    // The props object is handed to the foundation host as a live view, not read once
    {
        files: ['packages/semi-ui-svelte/src/date-picker/months-grid.svelte'],
        off: [],
        compilerOff: ['state_referenced_locally'],
    },
    // The column resize handle is a pointer-only drag surface (no keyboard resize, as in the other frameworks); its click only stops a drag's last click from sorting
    {
        files: ['packages/semi-ui-svelte/src/table/table-header-row.svelte'],
        off: [],
        compilerOff: ['a11y_click_events_have_key_events', 'a11y_no_static_element_interactions'],
    },
    // The scroll.y body is focusable so the keyboard can scroll it; mouseleave only clears the row-span hover highlight
    {
        files: ['packages/semi-ui-svelte/src/table/body/body.svelte'],
        off: [],
        compilerOff: ['a11y_no_noninteractive_tabindex', 'a11y_no_static_element_interactions'],
    },
    // The trigger's combobox role arrives in a spread the compiler cannot read, and the popup wrapper only watches the
    // pointer to keep the focus on the combobox. The keyboard stays on the combobox (aria-activedescendant)
    {
        files: ['packages/semi-ui-svelte/src/cascader/cascader.svelte'],
        off: [],
        compilerOff: ['a11y_no_noninteractive_tabindex', 'a11y_no_static_element_interactions'],
    },
    // The options take no focus or keys: the combobox points at the current one with aria-activedescendant
    {
        files: ['packages/semi-ui-svelte/src/cascader/item.svelte'],
        off: [],
        compilerOff: ['a11y_click_events_have_key_events'],
    },
];
