import type React from 'react';
import { useRef } from 'react';
import clsx from 'clsx';
import { DEFAULT_RATE, RATE_OPTIONS, cssClasses } from '@fibrae/semi-foundation/audio-player/constants';
import AudioPlayerFoundation, { type AudioPlayerAdapter } from '@fibrae/semi-foundation/audio-player/foundation';
import { getCurrentTrack } from '@fibrae/semi-foundation/audio-player/utils';
import { formatTime, formatTimeText } from '@fibrae/semi-foundation/video-player/utils';
import '@fibrae/semi-foundation/audio-player/audio-player.scss';
import { IconAlertCircle, IconBackward, IconFastForward, IconPause, IconPlay, IconRefresh, IconRestart, IconVolume2, IconVolumnSilent } from '@fibrae/semi-icons-react';
import type { ElementProps } from '../_base/base';
import type { MediaEventKeys } from '../_base/media-event-keys';
import { namedRole } from '../_base/named-role';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import Button from '../button';
import Dropdown from '../dropdown';
import Image from '../image';
import useLocale from '../locale/use-locale';
import Popover from '../popover';
import Tooltip from '../tooltip';
import AudioSlider from './audio-slider';

export interface AudioInfo {
    title?: string;
    cover?: string;
    src: string;
}

export type AudioUrl = string | AudioInfo | (AudioInfo | string)[];

export type AudioPlayerTheme = 'dark' | 'light';

export interface AudioPlayerProps extends ElementProps<'div', MediaEventKeys> {
    audioUrl: AudioUrl;
    autoPlay?: boolean;
    showToolbar?: boolean;
    skipDuration?: number;
    theme?: AudioPlayerTheme;
    className?: string;
    style?: React.CSSProperties;
    /** Attached to the root div */
    ref?: React.Ref<HTMLDivElement>;
}

export interface AudioPlayerState {
    isPlaying: boolean;
    currentIndex: number;
    totalTime: number;
    currentTime: number;
    currentRate: { label: string; value: number };
    volume: number;
    error: boolean;
}

const prefixCls = cssClasses.PREFIX;

const defaultProps = {
    autoPlay: false,
    showToolbar: true,
    skipDuration: 10,
    theme: 'dark',
} satisfies Partial<AudioPlayerProps>;

const iconClass = `${prefixCls}-control-button-icon`;
const circleStyle = { borderRadius: '50%' };
const transparentStyle = { background: 'transparent' };

export default function AudioPlayer(rawProps: AudioPlayerProps) {
    const props = useDefaultProps('AudioPlayer', rawProps, defaultProps);
    const { ref, audioUrl, autoPlay, showToolbar, skipDuration, theme, className, style, ...rest } = props;

    const { locale } = useLocale('AudioPlayer');

    const audioRef = useRef<HTMLAudioElement>(null);

    const [foundation, state] = useFoundation<AudioPlayerFoundation<AudioPlayerProps, AudioPlayerState>, AudioPlayerAdapter<AudioPlayerProps, AudioPlayerState>, AudioPlayerProps, AudioPlayerState>(
        AudioPlayerFoundation,
        props,
        () => ({
            isPlaying: false,
            currentIndex: 0,
            totalTime: 0,
            currentTime: 0,
            currentRate: DEFAULT_RATE,
            volume: 100,
            error: false,
        }),
        () => ({ getAudioRef: () => audioRef.current })
    );

    const { isPlaying, currentIndex, totalTime, currentTime, currentRate, volume, error } = state;
    const { src, title: audioTitle, cover: audioCover } = getCurrentTrack(audioUrl, currentIndex) ?? {};
    const isAudioUrlArray = Array.isArray(audioUrl);

    // the Tooltip text only describes the icon-only buttons, so the same text is also their name
    const backwardLabel = locale.backward.replace('${skipDuration}', String(skipDuration));
    const forwardLabel = locale.forward.replace('${skipDuration}', String(skipDuration));
    const refreshButton = <Button style={transparentStyle} aria-label={locale.refresh} icon={<IconRefresh className={iconClass} style={{ transform: 'rotateY(180deg)' }} />} onClick={foundation.handleRefresh} />;

    const renderControl = () => (
        <div className={`${prefixCls}-control`}>
            {isAudioUrlArray && (
                <Tooltip autoAdjustOverflow content={locale.prev} showArrow={false}>
                    <Button style={{ ...circleStyle, ...transparentStyle }} aria-label={locale.prev} size="large" icon={<IconRestart className={iconClass} size="large" />} onClick={() => foundation.handleTrackChange('prev')} />
                </Tooltip>
            )}
            <Button
                className={clsx(`${prefixCls}-control-button-play`, {
                    [`${prefixCls}-control-button-play-disabled`]: error,
                })}
                style={circleStyle}
                aria-label={isPlaying ? locale.pause : locale.play}
                disabled={error}
                size="large"
                icon={isPlaying ? <IconPause size="large" /> : <IconPlay style={{ marginLeft: '1px' }} size="large" />}
                onClick={foundation.handleStatusClick}
            />
            {isAudioUrlArray && (
                <Tooltip autoAdjustOverflow content={locale.next} showArrow={false}>
                    <Button style={{ ...circleStyle, ...transparentStyle }} aria-label={locale.next} size="large" icon={<IconRestart className={iconClass} rotate={180} size="large" />} onClick={() => foundation.handleTrackChange('next')} />
                </Tooltip>
            )}
        </div>
    );

    const renderInfo = () => (
        <div className={`${prefixCls}-info-container`}>
            {/* decorative: the title beside it names the track, so it is no preview button either */}
            {audioCover && <Image alt="" height={50} preview={false} src={audioCover} width={50} />}
            <div className={`${prefixCls}-info`}>
                {(audioTitle || error) && (
                    <div className={`${prefixCls}-info-title`}>
                        {audioTitle}
                        {error && (
                            <div className={`${prefixCls}-error`} role="alert">
                                <IconAlertCircle size="large" />
                                {locale.mediaError}
                            </div>
                        )}
                    </div>
                )}
                {!error && (
                    <div className={`${prefixCls}-info-time`}>
                        <span style={{ width: '38px' }}>{formatTime(currentTime)}</span>
                        <div className={`${prefixCls}-slider-container`}>
                            <AudioSlider max={totalTime} value={currentTime} getValueText={(value) => `${formatTimeText(value, locale)} / ${formatTimeText(totalTime, locale)}`} label={locale.progress} theme={theme} onChange={foundation.handleTimeChange} />
                        </div>
                        <span style={{ width: '38px' }}>{formatTime(totalTime)}</span>
                    </div>
                )}
            </div>
        </div>
    );

    const renderToolbar = () =>
        error ? (
            <div className={`${prefixCls}-control`}>{refreshButton}</div>
        ) : (
            <div className={`${prefixCls}-control`}>
                {/* The Button is the Popover's own trigger: a Tooltip around it competes for the focus-opened popup */}
                <Popover
                    // the popup holds an interactive range, which a tooltip may not contain
                    aria-label={locale.volume}
                    role="dialog"
                    autoAdjustOverflow
                    content={
                        <div className={clsx(`${prefixCls}-control-volume`, `${prefixCls}-control-volume-${theme}`)}>
                            <div className={`${prefixCls}-control-volume-title`}>{volume}%</div>
                            <AudioSlider max={100} value={volume} getValueText={(value) => `${value}%`} height={120} label={locale.volume} showTooltip={false} theme={theme} vertical onChange={foundation.handleVolumeChange} />
                        </div>
                    }
                >
                    <Button style={transparentStyle} aria-label={locale.volume} icon={volume === 0 ? <IconVolumnSilent className={iconClass} /> : <IconVolume2 className={iconClass} />} onClick={foundation.handleVolumeSilent} />
                </Popover>
                <Tooltip autoAdjustOverflow content={backwardLabel} showArrow={false}>
                    <Button style={transparentStyle} aria-label={backwardLabel} icon={<IconBackward className={iconClass} />} onClick={() => foundation.handleSeek(-1)} />
                </Tooltip>
                <Tooltip autoAdjustOverflow content={forwardLabel} showArrow={false}>
                    <Button style={transparentStyle} aria-label={forwardLabel} icon={<IconFastForward className={iconClass} />} onClick={() => foundation.handleSeek(1)} />
                </Tooltip>
                <Dropdown
                    className={clsx(`${prefixCls}-control-speed-menu`, `${prefixCls}-control-speed-menu-${theme}`)}
                    render={
                        <Dropdown.Menu>
                            {RATE_OPTIONS.map((option) => (
                                <Dropdown.Item key={option.value} className={`${prefixCls}-control-speed-menu-item`} active={option.value === currentRate.value} onClick={() => foundation.handleSpeedChange(option)}>
                                    {option.label}
                                </Dropdown.Item>
                            ))}
                        </Dropdown.Menu>
                    }
                    selectionMode="single"
                >
                    <button
                        type="button"
                        className={`${prefixCls}-control-speed`}
                        // the visible rate alone does not say what the menu sets
                        aria-label={[locale.playbackRate, currentRate.label].join(' ')}
                    >
                        <span>{currentRate.label}</span>
                    </button>
                </Dropdown>
                {refreshButton}
            </div>
        );

    return (
        <div role={namedRole(rest)} {...rest} ref={ref} className={clsx(prefixCls, className, `${prefixCls}-${theme}`)} style={style}>
            <audio ref={audioRef} autoPlay={autoPlay} src={src} onPause={foundation.handleAudioPause} onPlay={foundation.handleAudioPlay} onTimeUpdate={foundation.handleTimeUpdate}>
                {/* satisfies media-has-caption; there is no captions file */}
                <track kind="captions" />
            </audio>
            {renderControl()}
            {renderInfo()}
            {showToolbar && renderToolbar()}
        </div>
    );
}
