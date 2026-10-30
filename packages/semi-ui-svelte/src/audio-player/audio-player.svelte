<script lang="ts">
    import { DEFAULT_RATE, RATE_OPTIONS, cssClasses } from '@fibrae/semi-foundation/audio-player/constants';
    import AudioPlayerFoundation, { type AudioPlayerAdapter, type AudioPlayerBaseProps, type AudioPlayerBaseState } from '@fibrae/semi-foundation/audio-player/foundation';
    import { getCurrentTrack } from '@fibrae/semi-foundation/audio-player/utils';
    import { formatTime, formatTimeText } from '@fibrae/semi-foundation/video-player/utils';
    import '@fibrae/semi-foundation/audio-player/audio-player.scss';
    import { IconAlertCircle, IconBackward, IconFastForward, IconPause, IconPlay, IconRefresh, IconRestart, IconVolume2, IconVolumnSilent } from '@fibrae/semi-icons-svelte';
    import { groupRole } from '../_base/group-role.js';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import { Button } from '../button/index.js';
    import { Dropdown, DropdownItem, DropdownMenu, type DropdownTriggerProps } from '../dropdown/index.js';
    import { Image } from '../image/index.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import { Popover } from '../popover/index.js';
    import { Tooltip, type TooltipTriggerProps } from '../tooltip/index.js';
    import AudioSlider from './audio-slider.svelte';
    import type { AudioPlayerProps } from './interface.js';

    type Foundation = AudioPlayerFoundation<AudioPlayerBaseProps, AudioPlayerBaseState>;
    type Adapter = AudioPlayerAdapter<AudioPlayerBaseProps, AudioPlayerBaseState>;

    const defaults = useDefaultProps('AudioPlayer');
    let { audioUrl, autoPlay = defaults('autoPlay', false), showToolbar = defaults('showToolbar', true), skipDuration = defaults('skipDuration', 10), theme = defaults('theme', 'dark'), ...rest }: AudioPlayerProps = $props();

    const locale = useLocale('AudioPlayer');

    let audio = $state<HTMLAudioElement>();

    const foundationProps: AudioPlayerBaseProps = {
        get audioUrl() {
            return audioUrl;
        },
        get skipDuration() {
            return skipDuration;
        },
    };

    const { foundation, states } = useFoundation<Foundation, Adapter, AudioPlayerBaseProps, AudioPlayerBaseState>(
        AudioPlayerFoundation,
        foundationProps,
        () => ({
            isPlaying: false,
            currentIndex: 0,
            totalTime: 0,
            currentTime: 0,
            currentRate: DEFAULT_RATE,
            volume: 100,
            error: false,
        }),
        () => ({ getAudioRef: () => audio ?? null })
    );

    const prefix = cssClasses.PREFIX;
    const iconClass = `${prefix}-control-button-icon`;
    const circleStyle = 'border-radius: 50%';
    const transparentStyle = 'background: transparent';
    const texts = $derived(locale().locale);
    const isList = $derived(Array.isArray(audioUrl));
    const info = $derived(getCurrentTrack(audioUrl, states().currentIndex));

    // the Tooltip text only describes the icon-only button, so the same text is also its name
    const backwardLabel = $derived(texts.backward.replace('${skipDuration}', String(skipDuration)));
    const forwardLabel = $derived(texts.forward.replace('${skipDuration}', String(skipDuration)));

    // the visible rate alone does not say what the menu sets
    const speedLabel = $derived([texts.playbackRate, states().currentRate.label].join(' '));

    const changeTrack = (direction: 'next' | 'prev') => {
        if (Array.isArray(audioUrl) && audioUrl.length > 0) {
            foundation.handleTrackChange(direction);
        }
    };

    const progressText = (value: number) => `${formatTimeText(value, texts)} / ${formatTimeText(states().totalTime, texts)}`;

    const volumeText = (value: number) => `${value}%`;
</script>

{#snippet trackButton(direction: 'next' | 'prev', triggerProps: TooltipTriggerProps)}
    <Button {...triggerProps} aria-label={texts[direction]} size="large" style={`${circleStyle}; ${transparentStyle}`} onclick={() => changeTrack(direction)}>
        {#snippet icon()}
            <IconRestart class={iconClass} rotate={direction === 'next' ? 180 : undefined} size="large" />
        {/snippet}
    </Button>
{/snippet}

{#snippet skipButton(direction: -1 | 1, label: string, triggerProps: TooltipTriggerProps)}
    <Button {...triggerProps} aria-label={label} style={transparentStyle} onclick={() => foundation.handleSeek(direction)}>
        {#snippet icon()}
            {#if direction === -1}
                <IconBackward class={iconClass} />
            {:else}
                <IconFastForward class={iconClass} />
            {/if}
        {/snippet}
    </Button>
{/snippet}

{#snippet speedTrigger({ props }: { props: DropdownTriggerProps })}
    <button {...props} aria-label={speedLabel} class={[props.class, `${prefix}-control-speed`]} type="button">
        <span>{states().currentRate.label}</span>
    </button>
{/snippet}

<div {...rest} class={[prefix, rest.class, `${prefix}-${theme}`]} role={groupRole(rest)}>
    <audio autoplay={autoPlay} bind:this={audio} src={info?.src} onpause={foundation.handleAudioPause} onplay={foundation.handleAudioPlay} ontimeupdate={foundation.handleTimeUpdate}>
        <track kind="captions" />
    </audio>
    <div class={`${prefix}-control`}>
        {#if isList}
            <Tooltip autoAdjustOverflow showArrow={false}>
                {#snippet child({ props })}
                    {@render trackButton('prev', props)}
                {/snippet}
                {#snippet content()}
                    {texts.prev}
                {/snippet}
            </Tooltip>
        {/if}
        <Button aria-label={states().isPlaying ? texts.pause : texts.play} class={[`${prefix}-control-button-play`, { [`${prefix}-control-button-play-disabled`]: states().error }]} disabled={states().error} size="large" style={circleStyle} onclick={foundation.handleStatusClick}>
            {#snippet icon()}
                {#if states().isPlaying}
                    <IconPause size="large" />
                {:else}
                    <IconPlay size="large" style="margin-left: 1px" />
                {/if}
            {/snippet}
        </Button>
        {#if isList}
            <Tooltip autoAdjustOverflow showArrow={false}>
                {#snippet child({ props })}
                    {@render trackButton('next', props)}
                {/snippet}
                {#snippet content()}
                    {texts.next}
                {/snippet}
            </Tooltip>
        {/if}
    </div>
    <div class={`${prefix}-info-container`}>
        <!-- decorative: the title beside it names the track, so it is no preview button either -->
        {#if info?.cover}
            <Image alt="" height={50} preview={false} src={info.cover} width={50} />
        {/if}
        <div class={`${prefix}-info`}>
            <!-- the error hides the time row, so a track without a title still needs this row for the error -->
            {#if info?.title || states().error}
                <div class={`${prefix}-info-title`}>
                    {info?.title}
                    {#if states().error}
                        <div class={`${prefix}-error`} role="alert">
                            <IconAlertCircle size="large" />
                            {texts.mediaError}
                        </div>
                    {/if}
                </div>
            {/if}
            {#if !states().error}
                <div class={`${prefix}-info-time`}>
                    <span style="width: 38px">{formatTime(states().currentTime)}</span>
                    <div class={`${prefix}-slider-container`}>
                        <AudioSlider getValueText={progressText} label={texts.progress} max={states().totalTime} onChange={foundation.handleTimeChange} {theme} value={states().currentTime} />
                    </div>
                    <span style="width: 38px">{formatTime(states().totalTime)}</span>
                </div>
            {/if}
        </div>
    </div>
    {#if showToolbar}
        <div class={`${prefix}-control`}>
            {#if !states().error}
                <Popover aria-label={texts.volume} autoAdjustOverflow role="dialog">
                    {#snippet child({ props })}
                        <Button {...props} aria-label={texts.volume} style={transparentStyle} onclick={foundation.handleVolumeSilent}>
                            {#snippet icon()}
                                {#if states().volume === 0}
                                    <IconVolumnSilent class={iconClass} />
                                {:else}
                                    <IconVolume2 class={iconClass} />
                                {/if}
                            {/snippet}
                        </Button>
                    {/snippet}
                    {#snippet content()}
                        <div class={[`${prefix}-control-volume`, `${prefix}-control-volume-${theme}`]}>
                            <div class={`${prefix}-control-volume-title`}>{states().volume}%</div>
                            <AudioSlider getValueText={volumeText} height={120} label={texts.volume} max={100} onChange={foundation.handleVolumeChange} showTooltip={false} {theme} value={states().volume} vertical />
                        </div>
                    {/snippet}
                </Popover>
                <Tooltip autoAdjustOverflow showArrow={false}>
                    {#snippet child({ props })}
                        {@render skipButton(-1, backwardLabel, props)}
                    {/snippet}
                    {#snippet content()}
                        {backwardLabel}
                    {/snippet}
                </Tooltip>
                <Tooltip autoAdjustOverflow showArrow={false}>
                    {#snippet child({ props })}
                        {@render skipButton(1, forwardLabel, props)}
                    {/snippet}
                    {#snippet content()}
                        {forwardLabel}
                    {/snippet}
                </Tooltip>
                <Dropdown child={speedTrigger} class={`${prefix}-control-speed-menu ${prefix}-control-speed-menu-${theme}`} selectionMode="single">
                    {#snippet content()}
                        <DropdownMenu>
                            {#each RATE_OPTIONS as option (option.value)}
                                <DropdownItem active={option.value === states().currentRate.value} class={`${prefix}-control-speed-menu-item`} onclick={() => foundation.handleSpeedChange(option)}>
                                    {option.label}
                                </DropdownItem>
                            {/each}
                        </DropdownMenu>
                    {/snippet}
                </Dropdown>
            {/if}
            <Button aria-label={texts.refresh} style={transparentStyle} onclick={foundation.handleRefresh}>
                {#snippet icon()}
                    <IconRefresh class={iconClass} style="transform: rotateY(180deg)" />
                {/snippet}
            </Button>
        </div>
    {/if}
</div>
