<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/date-picker/constants';
    import type { PresetType } from '@fibrae/semi-foundation/date-picker/foundation';
    import { Button } from '../button/index.js';
    import { TypographyText } from '../typography/index.js';
    import type { QuickControlProps } from './internal.js';

    let { locale, type, presets = [], presetPosition = 'bottom', insetInput = false, onPresetClick }: QuickControlProps = $props();

    const prefix = cssClasses.PREFIX;
    const base = $derived(`${prefix}-quick-control-${presetPosition}`);
    const isPanelTopAndBottom = $derived(presetPosition === 'top' || presetPosition === 'bottom');
    const items = $derived<PresetType[]>(presets.map((item) => (typeof item === 'function' ? item() : item)));

    const partClass = (suffix: string) => {
        const range = isPanelTopAndBottom && (type === 'dateRange' || type === 'dateTimeRange');
        const month = isPanelTopAndBottom && (type === 'month' || type === 'year');
        return {
            [`${base}-content${suffix}`]: !range && !month,
            [`${base}-range-content${suffix}`]: range,
            [`${base}-month-content${suffix}`]: month,
        };
    };
</script>

{#if items.length}
    <div {...{ 'x-insetinput': insetInput ? 'true' : 'false' }} class={[`${prefix}-quick-control`, base, { [`${prefix}-quick-control-${type}`]: type }]}>
        {#if !isPanelTopAndBottom}
            <div class={`${prefix}-quick-control-header`}>{locale.presets}</div>
        {/if}
        <div class={`${base}-content-wrapper`}>
            <div class={partClass('')}>
                {#each items as preset, index (index)}
                    <Button size="small" type="primary" onclick={(event) => onPresetClick(preset, event)}>
                        <!-- a button takes phrasing content only -->
                        <span class={partClass('-item')}>
                            <TypographyText class={partClass('-item-ellipsis')} ellipsis={{ showTooltip: true }}>{preset.text}</TypographyText>
                        </span>
                    </Button>
                {/each}
            </div>
        </div>
    </div>
{/if}
