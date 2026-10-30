<script setup lang="ts">
    import { computed, useTemplateRef } from 'vue';
    import { DEFAULT_RATE, RATE_OPTIONS, cssClasses } from '@fibrae/semi-foundation/audio-player/constants';
    import AudioPlayerFoundation, { type AudioPlayerAdapter } from '@fibrae/semi-foundation/audio-player/foundation';
    import { getCurrentTrack } from '@fibrae/semi-foundation/audio-player/utils';
    import { formatTime, formatTimeText } from '@fibrae/semi-foundation/video-player/utils';
    import '@fibrae/semi-foundation/audio-player/audio-player.scss';
    import { IconAlertCircle, IconBackward, IconFastForward, IconPause, IconPlay, IconRefresh, IconRestart, IconVolume2, IconVolumnSilent } from '@fibrae/semi-icons-vue';
    import type { ElementProps } from '../_base/element-props';
    import { groupRole } from '../_base/group-role';
    import semiDefault from '../_base/semi-default';
    import useFoundation from '../_base/use-foundation';
    import Button from '../button';
    import Dropdown, { DropdownItem, DropdownMenu } from '../dropdown';
    import Image from '../image';
    import useLocale from '../locale/use-locale';
    import Popover from '../popover';
    import Tooltip from '../tooltip';
    import AudioSlider from './audio-slider.vue';
    import type { AudioPlayerProps, AudioPlayerState } from './interface';

    type Foundation = AudioPlayerFoundation<AudioPlayerProps, AudioPlayerState>;
    type Adapter = AudioPlayerAdapter<AudioPlayerProps, AudioPlayerState>;

    const props = withDefaults(defineProps<AudioPlayerProps & /* @vue-ignore */ ElementProps<'div', keyof AudioPlayerProps>>(), {
        autoPlay: () => semiDefault('AudioPlayer', 'autoPlay', false),
        showToolbar: () => semiDefault('AudioPlayer', 'showToolbar', true),
        skipDuration: () => semiDefault('AudioPlayer', 'skipDuration', 10),
        theme: () => semiDefault('AudioPlayer', 'theme', 'dark'),
    });

    const localeResult = useLocale('AudioPlayer');

    const audio = useTemplateRef('audio');

    const { foundation, state } = useFoundation<Foundation, Adapter, AudioPlayerProps, AudioPlayerState>(
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
        () => ({ getAudioRef: () => audio.value })
    );

    const prefix = cssClasses.PREFIX;
    const iconClass = `${prefix}-control-button-icon`;
    const circleStyle = { borderRadius: '50%' };
    const transparentStyle = { background: 'transparent' };
    const locale = computed(() => localeResult.value.locale);
    const isList = computed(() => Array.isArray(props.audioUrl));
    const info = computed(() => getCurrentTrack(props.audioUrl, state.value.currentIndex));

    // the Tooltip text only describes the icon-only button, so the same text is also its name
    const backwardLabel = computed(() => locale.value.backward.replace('${skipDuration}', String(props.skipDuration)));
    const forwardLabel = computed(() => locale.value.forward.replace('${skipDuration}', String(props.skipDuration)));

    // the visible rate alone does not say what the menu sets
    const speedLabel = computed(() => [locale.value.playbackRate, state.value.currentRate.label].join(' '));

    const changeTrack = (direction: 'next' | 'prev') => {
        if (Array.isArray(props.audioUrl) && props.audioUrl.length > 0) {
            foundation.handleTrackChange(direction);
        }
    };

    const progressText = (value: number) => `${formatTimeText(value, locale.value)} / ${formatTimeText(state.value.totalTime, locale.value)}`;

    const volumeText = (value: number) => `${value}%`;
</script>

<template>
    <div :class="[prefix, `${prefix}-${props.theme}`]" :role="groupRole($attrs)">
        <audio ref="audio" :autoplay="props.autoPlay" :src="info?.src" @pause="foundation.handleAudioPause" @play="foundation.handleAudioPlay" @timeupdate="foundation.handleTimeUpdate">
            <track kind="captions" />
        </audio>
        <div :class="`${prefix}-control`">
            <Tooltip v-if="isList" autoAdjustOverflow :showArrow="false">
                <Button :aria-label="locale.prev" size="large" :style="[circleStyle, transparentStyle]" @click="changeTrack('prev')">
                    <template #icon>
                        <IconRestart :class="iconClass" size="large" />
                    </template>
                </Button>
                <template #content>{{ locale.prev }}</template>
            </Tooltip>
            <Button :aria-label="state.isPlaying ? locale.pause : locale.play" :class="[`${prefix}-control-button-play`, { [`${prefix}-control-button-play-disabled`]: state.error }]" :disabled="state.error" size="large" :style="circleStyle" @click="foundation.handleStatusClick">
                <template #icon>
                    <IconPause v-if="state.isPlaying" size="large" />
                    <IconPlay v-else size="large" :style="{ marginLeft: '1px' }" />
                </template>
            </Button>
            <Tooltip v-if="isList" autoAdjustOverflow :showArrow="false">
                <Button :aria-label="locale.next" size="large" :style="[circleStyle, transparentStyle]" @click="changeTrack('next')">
                    <template #icon>
                        <IconRestart :class="iconClass" :rotate="180" size="large" />
                    </template>
                </Button>
                <template #content>{{ locale.next }}</template>
            </Tooltip>
        </div>
        <div :class="`${prefix}-info-container`">
            <!-- decorative: the title beside it names the track, so it is no preview button either -->
            <Image v-if="info?.cover" alt="" :height="50" :preview="false" :src="info.cover" :width="50" />
            <div :class="`${prefix}-info`">
                <!-- the error hides the time row, so a track without a title still needs this row for the error -->
                <div v-if="info?.title || state.error" :class="`${prefix}-info-title`">
                    {{ info?.title }}
                    <div v-if="state.error" :class="`${prefix}-error`" role="alert">
                        <IconAlertCircle size="large" />
                        {{ locale.mediaError }}
                    </div>
                </div>
                <div v-if="!state.error" :class="`${prefix}-info-time`">
                    <span style="width: 38px">{{ formatTime(state.currentTime) }}</span>
                    <div :class="`${prefix}-slider-container`">
                        <AudioSlider :getValueText="progressText" :label="locale.progress" :max="state.totalTime" :theme="props.theme" :value="state.currentTime" @change="foundation.handleTimeChange" />
                    </div>
                    <span style="width: 38px">{{ formatTime(state.totalTime) }}</span>
                </div>
            </div>
        </div>
        <div v-if="props.showToolbar" :class="`${prefix}-control`">
            <template v-if="!state.error">
                <Popover :ariaLabel="locale.volume" autoAdjustOverflow role="dialog">
                    <Button :aria-label="locale.volume" :style="transparentStyle" @click="foundation.handleVolumeSilent">
                        <template #icon>
                            <IconVolumnSilent v-if="state.volume === 0" :class="iconClass" />
                            <IconVolume2 v-else :class="iconClass" />
                        </template>
                    </Button>
                    <template #content>
                        <div :class="[`${prefix}-control-volume`, `${prefix}-control-volume-${props.theme}`]">
                            <div :class="`${prefix}-control-volume-title`">{{ state.volume }}%</div>
                            <AudioSlider :getValueText="volumeText" :height="120" :label="locale.volume" :max="100" :showTooltip="false" :theme="props.theme" :value="state.volume" vertical @change="foundation.handleVolumeChange" />
                        </div>
                    </template>
                </Popover>
                <Tooltip autoAdjustOverflow :showArrow="false">
                    <Button :aria-label="backwardLabel" :style="transparentStyle" @click="foundation.handleSeek(-1)">
                        <template #icon>
                            <IconBackward :class="iconClass" />
                        </template>
                    </Button>
                    <template #content>{{ backwardLabel }}</template>
                </Tooltip>
                <Tooltip autoAdjustOverflow :showArrow="false">
                    <Button :aria-label="forwardLabel" :style="transparentStyle" @click="foundation.handleSeek(1)">
                        <template #icon>
                            <IconFastForward :class="iconClass" />
                        </template>
                    </Button>
                    <template #content>{{ forwardLabel }}</template>
                </Tooltip>
                <Dropdown :class="[`${prefix}-control-speed-menu`, `${prefix}-control-speed-menu-${props.theme}`]" selectionMode="single">
                    <button :aria-label="speedLabel" :class="`${prefix}-control-speed`" type="button">
                        <span>{{ state.currentRate.label }}</span>
                    </button>
                    <template #content>
                        <DropdownMenu>
                            <DropdownItem v-for="option in RATE_OPTIONS" :key="option.value" :active="option.value === state.currentRate.value" :class="`${prefix}-control-speed-menu-item`" @click="foundation.handleSpeedChange(option)">
                                {{ option.label }}
                            </DropdownItem>
                        </DropdownMenu>
                    </template>
                </Dropdown>
            </template>
            <Button :aria-label="locale.refresh" :style="transparentStyle" @click="foundation.handleRefresh">
                <template #icon>
                    <IconRefresh :class="iconClass" :style="{ transform: 'rotateY(180deg)' }" />
                </template>
            </Button>
        </div>
    </div>
</template>
