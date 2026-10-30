<script lang="ts">
    import type { Snippet } from 'svelte';
    import { cssClasses } from '@fibrae/semi-foundation/calendar/constants';
    import useLocale from '../locale/use-locale.svelte.js';
    import type { CalendarTimeDisplayArgs } from './interface.js';

    interface Props {
        class?: string;
        timeDisplay?: Snippet<[CalendarTimeDisplayArgs]>;
    }

    let { class: className, timeDisplay }: Props = $props();

    const locale = useLocale('Calendar');

    const prefixCls = `${cssClasses.PREFIX}-time`;
    const hours = Array.from({ length: 24 }, (_, hour) => hour);

    const label = (hour: number) => (hour < 12 ? locale().locale.AM.replace('${time}', String(hour)) : locale().locale.PM.replace('${time}', String(hour === 12 ? hour : hour - 12)));
</script>

<div class={[prefixCls, className]} role="cell">
    <div class={`${prefixCls}-items`}>
        {#each hours as hour (hour)}
            <div class={`${prefixCls}-item`}>
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
