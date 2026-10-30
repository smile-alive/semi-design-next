<script lang="ts">
    import { cssClasses, strings } from '@fibrae/semi-foundation/date-picker/constants';
    import { IconChevronLeft, IconChevronRight, IconDoubleChevronLeft, IconDoubleChevronRight } from '@fibrae/semi-icons-svelte';
    import { Button } from '../button/index.js';
    import { IconButton } from '../icon-button/index.js';
    import type { NavigationProps } from './internal.js';

    let { locale, monthText = '', density, shouldBimonthSwitch = false, panelType, titleId, onPrevYear, onPrevMonth, onNextMonth, onNextYear, onMonthClick }: NavigationProps = $props();

    const prefix = cssClasses.NAVIGATION;
    const iconSize = $derived(density === 'compact' ? 'default' : 'large');
    const buttonSize = $derived(density === 'compact' ? 'small' : 'default');

    // `visibility: hidden` keeps the icons in position
    const hidden = (side: string) => {
        return shouldBimonthSwitch && panelType === side ? 'visibility: hidden' : undefined;
    };
</script>

<div class={prefix}>
    <IconButton aria-label={locale.prevYear} noHorizontalPadding size={buttonSize} style={hidden(strings.PANEL_TYPE_RIGHT)} theme="borderless" onclick={() => onPrevYear()}>
        {#snippet icon()}<IconDoubleChevronLeft size={iconSize} />{/snippet}
    </IconButton>
    <IconButton aria-label={locale.prevMonth} noHorizontalPadding size={buttonSize} style={hidden(strings.PANEL_TYPE_RIGHT)} theme="borderless" onclick={() => onPrevMonth()}>
        {#snippet icon()}<IconChevronLeft size={iconSize} />{/snippet}
    </IconButton>
    <div class={`${prefix}-month`}>
        <!-- names the month grid below (APG date picker dialog) -->
        <Button id={titleId} size={buttonSize} theme="borderless" onclick={() => onMonthClick()}>
            <span>{monthText}</span>
        </Button>
    </div>
    <IconButton aria-label={locale.nextMonth} noHorizontalPadding size={buttonSize} style={hidden(strings.PANEL_TYPE_LEFT)} theme="borderless" onclick={() => onNextMonth()}>
        {#snippet icon()}<IconChevronRight size={iconSize} />{/snippet}
    </IconButton>
    <IconButton aria-label={locale.nextYear} noHorizontalPadding size={buttonSize} style={hidden(strings.PANEL_TYPE_LEFT)} theme="borderless" onclick={() => onNextYear()}>
        {#snippet icon()}<IconDoubleChevronRight size={iconSize} />{/snippet}
    </IconButton>
</div>
