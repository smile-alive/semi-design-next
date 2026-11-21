import { For, Show, createMemo, splitProps } from 'solid-js';
import clsx from 'clsx';
import { RATE_OPTIONS, cssClasses } from '@fibrae/semi-foundation/components/audio-player/constants';
import AudioPlayerFoundation, { type AudioPlayerAdapter, type AudioPlayerState } from '@fibrae/semi-foundation/components/audio-player/foundation';
import { getCurrentTrack } from '@fibrae/semi-foundation/components/audio-player/utils';
import { formatTime, formatTimeText } from '@fibrae/semi-foundation/components/video-player/utils';
import { formatLocale } from '@fibrae/semi-foundation/locale';
import { namedRole } from '@fibrae/semi-foundation/utils';
import '@fibrae/semi-foundation/components/audio-player/audio-player.scss';
import { IconAlertCircle, IconBackward, IconFastForward, IconPause, IconPlay, IconRefresh, IconRestart, IconVolume2, IconVolumnSilent } from '@fibrae/semi-icons-solid';
import { useDefaultProps, useFoundation } from '../../base/index';
import { mergeStyles } from '../../utils/index';
import Button from '../button';
import Dropdown from '../dropdown';
import Image from '../image';
import useLocale from '../locale/use-locale';
import Popover from '../popover';
import Tooltip from '../tooltip';
import AudioSlider from './audio-slider';
import type { AudioPlayerProps } from './interface';

type Foundation = AudioPlayerFoundation<AudioPlayerProps>;
type Adapter = AudioPlayerAdapter<AudioPlayerProps>;

const prefixCls = cssClasses.PREFIX;

const defaultProps = {
    autoPlay: false,
    showToolbar: true,
    skipDuration: 10,
    theme: 'dark',
} satisfies Partial<AudioPlayerProps>;

const iconClass = `${prefixCls}-control-button-icon`;
const circleStyle = { 'border-radius': '50%' };
const transparentStyle = { background: 'transparent' };

export default function AudioPlayer(rawProps: AudioPlayerProps) {
    const props = useDefaultProps('AudioPlayer', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['audioUrl', 'autoPlay', 'class', 'classNames', 'showToolbar', 'skipDuration', 'styles', 'theme']);

    const locale = useLocale('AudioPlayer');

    let audio: HTMLAudioElement | undefined;

    const { foundation, state } = useFoundation<Foundation, Adapter, AudioPlayerProps, AudioPlayerState>(
        AudioPlayerFoundation,
        props,
        (view) => AudioPlayerFoundation.getInitialState(view),
        () => ({ getAudioRef: () => audio ?? null })
    );

    const info = createMemo(() => getCurrentTrack(local.audioUrl, state().currentIndex));

    const text = () => locale().locale;

    const isList = () => Array.isArray(local.audioUrl);

    // the Tooltip text only describes the icon-only buttons, so the same text is also their name
    const backwardLabel = () => formatLocale(text().backward, { skipDuration: local.skipDuration });

    const forwardLabel = () => formatLocale(text().forward, { skipDuration: local.skipDuration });

    const refreshButton = () => <Button style={transparentStyle} aria-label={text().refresh} icon={<IconRefresh class={iconClass} style={{ transform: 'rotateY(180deg)' }} />} onClick={foundation.handleRefresh} />;

    const renderControl = () => (
        <div class={clsx(`${prefixCls}-control`, local.classNames?.controls)} style={local.styles?.controls}>
            <Show when={isList()}>
                <Tooltip autoAdjustOverflow content={text().prev} showArrow={false}>
                    {(getTriggerProps) => <Button {...getTriggerProps()} style={{ ...circleStyle, ...transparentStyle }} aria-label={text().prev} size="large" icon={<IconRestart class={iconClass} size="large" />} onClick={() => foundation.handleTrackChange('prev')} />}
                </Tooltip>
            </Show>
            <Button
                class={clsx(
                    `${prefixCls}-control-button-play`,
                    {
                        [`${prefixCls}-control-button-play-disabled`]: state().error,
                    },
                    local.classNames?.playButton
                )}
                style={mergeStyles(circleStyle, local.styles?.playButton)}
                aria-label={state().isPlaying ? text().pause : text().play}
                disabled={state().error}
                size="large"
                icon={state().isPlaying ? <IconPause size="large" /> : <IconPlay style={{ 'margin-left': '1px' }} size="large" />}
                onClick={foundation.handleStatusClick}
            />
            <Show when={isList()}>
                <Tooltip autoAdjustOverflow content={text().next} showArrow={false}>
                    {(getTriggerProps) => <Button {...getTriggerProps()} style={{ ...circleStyle, ...transparentStyle }} aria-label={text().next} size="large" icon={<IconRestart class={iconClass} rotate={180} size="large" />} onClick={() => foundation.handleTrackChange('next')} />}
                </Tooltip>
            </Show>
        </div>
    );

    const renderInfo = () => (
        <div class={`${prefixCls}-info-container`}>
            {/* decorative: the title beside it names the track, so it is no preview button either */}
            <Show when={info()?.cover}>{(cover) => <Image alt="" class={clsx(`${prefixCls}-cover`, local.classNames?.cover)} height={50} preview={false} src={cover()} style={local.styles?.cover} width={50} />}</Show>
            <div class={`${prefixCls}-info`}>
                {/* the error hides the time row, so a track without a title still needs this row for the error */}
                <Show when={info()?.title || state().error}>
                    <div class={clsx(`${prefixCls}-info-title`, local.classNames?.title)} style={local.styles?.title}>
                        {info()?.title}
                        <Show when={state().error}>
                            <div class={clsx(`${prefixCls}-error`, local.classNames?.error)} style={local.styles?.error} role="alert">
                                <IconAlertCircle size="large" />
                                {text().mediaError}
                            </div>
                        </Show>
                    </div>
                </Show>
                <Show when={!state().error}>
                    <div class={`${prefixCls}-info-time`}>
                        <span style={{ width: '38px' }}>{formatTime(state().currentTime)}</span>
                        <div class={`${prefixCls}-slider-container`}>
                            <AudioSlider
                                max={state().totalTime}
                                value={state().currentTime}
                                getValueText={(value) => `${formatTimeText(value, text())} / ${formatTimeText(state().totalTime, text())}`}
                                label={text().progress}
                                theme={local.theme}
                                classNames={local.classNames}
                                styles={local.styles}
                                onChange={foundation.handleTimeChange}
                            />
                        </div>
                        <span style={{ width: '38px' }}>{formatTime(state().totalTime)}</span>
                    </div>
                </Show>
            </div>
        </div>
    );

    const renderToolbar = () => (
        <div class={clsx(`${prefixCls}-control`, `${prefixCls}-toolbar`, local.classNames?.toolbar)} style={local.styles?.toolbar}>
            <Show when={!state().error}>
                {/* The Button is the Popover's own trigger: a Tooltip around it competes for the focus-opened popup */}
                <Popover
                    // the popup holds an interactive range, which a tooltip may not contain
                    aria-label={text().volume}
                    role="dialog"
                    autoAdjustOverflow
                    content={
                        <div class={clsx(`${prefixCls}-control-volume`, `${prefixCls}-control-volume-${local.theme}`, local.classNames?.volumeDropdown)} style={local.styles?.volumeDropdown}>
                            <div class={`${prefixCls}-control-volume-title`}>{state().volume}%</div>
                            <AudioSlider max={100} value={state().volume} getValueText={(value) => `${value}%`} height={120} label={text().volume} showTooltip={false} theme={local.theme} classNames={local.classNames} styles={local.styles} vertical onChange={foundation.handleVolumeChange} />
                        </div>
                    }
                >
                    {(getTriggerProps) => <Button {...getTriggerProps()} style={transparentStyle} aria-label={text().volume} icon={state().volume === 0 ? <IconVolumnSilent class={iconClass} /> : <IconVolume2 class={iconClass} />} onClick={foundation.handleVolumeSilent} />}
                </Popover>
                <Tooltip autoAdjustOverflow content={backwardLabel()} showArrow={false}>
                    {(getTriggerProps) => <Button {...getTriggerProps()} style={transparentStyle} aria-label={backwardLabel()} icon={<IconBackward class={iconClass} />} onClick={() => foundation.handleSeek(-1)} />}
                </Tooltip>
                <Tooltip autoAdjustOverflow content={forwardLabel()} showArrow={false}>
                    {(getTriggerProps) => <Button {...getTriggerProps()} style={transparentStyle} aria-label={forwardLabel()} icon={<IconFastForward class={iconClass} />} onClick={() => foundation.handleSeek(1)} />}
                </Tooltip>
                <Dropdown
                    class={clsx(`${prefixCls}-control-speed-menu`, `${prefixCls}-control-speed-menu-${local.theme}`)}
                    classNames={{ content: local.classNames?.speedDropdown }}
                    styles={{ content: local.styles?.speedDropdown }}
                    render={
                        <Dropdown.Menu>
                            <For each={RATE_OPTIONS}>
                                {(option) => (
                                    <Dropdown.Item class={`${prefixCls}-control-speed-menu-item`} active={option.value === state().currentRate.value} onClick={() => foundation.handleSpeedChange(option)}>
                                        {option.label}
                                    </Dropdown.Item>
                                )}
                            </For>
                        </Dropdown.Menu>
                    }
                    selectionMode="single"
                >
                    {(getTriggerProps) => (
                        // the visible rate alone does not say what the menu sets
                        <button {...getTriggerProps({ class: clsx(`${prefixCls}-control-speed`, local.classNames?.speed) })} style={local.styles?.speed} type="button" aria-label={[text().playbackRate, state().currentRate.label].join(' ')}>
                            <span>{state().currentRate.label}</span>
                        </button>
                    )}
                </Dropdown>
            </Show>
            {refreshButton()}
        </div>
    );

    return (
        <div {...rest} role={namedRole(rest)} class={clsx(prefixCls, local.class, `${prefixCls}-${local.theme}`)}>
            <audio ref={(node) => (audio = node)} autoplay={local.autoPlay} src={info()?.src} onPause={foundation.handleAudioPause} onPlay={foundation.handleAudioPlay} onTimeUpdate={foundation.handleTimeUpdate}>
                {/* satisfies media-has-caption; there is no captions file */}
                <track kind="captions" />
            </audio>
            {renderControl()}
            {renderInfo()}
            <Show when={local.showToolbar}>{renderToolbar()}</Show>
        </div>
    );
}
