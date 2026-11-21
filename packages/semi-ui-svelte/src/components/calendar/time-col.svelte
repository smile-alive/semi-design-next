<script lang="ts">
    import type { Snippet } from 'svelte';
    import { cssClasses } from '@fibrae/semi-foundation/components/calendar/constants';
    import { formatLocale } from '@fibrae/semi-foundation/locale';
    import useLocale from '../locale/use-locale.svelte.js';
    import type { CalendarProps, CalendarTimeDisplayArgs } from './interface.js';

    interface Props extends Pick<CalendarProps, 'classNames' | 'styles'> {
        class?: string;
        timeDisplay?: Snippet<[CalendarTimeDisplayArgs]>;
    }

    let { class: className, classNames, styles, timeDisplay }: Props = $props();

    const locale = useLocale('Calendar');

    const prefixCls = `${cssClasses.PREFIX}-time`;
    const hours = Array.from({ length: 24 }, (_, hour) => hour);

    const label = (hour: number) => formatLocale(hour < 12 ? locale().locale.AM : locale().locale.PM, { time: hour <= 12 ? hour : hour - 12 });
</script>

<div class={[prefixCls, className, classNames?.timeColumn]} role="cell" style={styles?.timeColumn}>
    <div class={`${prefixCls}-items`}>
        {#each hours as hour (hour)}
            <div class={[`${prefixCls}-item`, classNames?.timeLabel]} style={styles?.timeLabel}>
                <!-- the grid starts at 00:00, which has no label -->
                {#if hour === 0}
                    <span></span>
                {:else}
                    <span>
                        {#if timeDisplay}
                            {@render timeDisplay({ time: hour })}
                        {:else}
                            {label(hour)}
                        {/if}
                    </span>
                {/if}
            </div>
        {/each}
    </div>
</div>
