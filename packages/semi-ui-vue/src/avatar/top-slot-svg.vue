<script setup lang="ts">
    import { useId } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/avatar/constants';

    const props = defineProps<{ gradientStart: string; gradientEnd: string }>();

    const id = `${cssClasses.PREFIX}-top-slot${useId()}`;
    const filterId = `${id}-filter`;
</script>

<template>
    <svg fill="none" height="52" viewBox="0 0 51 52" width="51" xmlns="http://www.w3.org/2000/svg">
        <g :filter="`url(#${filterId})`">
            <path d="M40.4918 46.5592C44.6795 43.176 46.261 34.1333 47.5301 25.6141C49.5854 11.8168 39.6662 1 25.8097 1C11.2857 1 3 11.4279 3 25.3518C3 33.7866 6.29361 43.8947 10.4602 46.5592C12.5868 47.9192 12.5868 47.9051 25.8097 47.9192C38.3651 47.9282 38.5352 48.14 40.4918 46.5592Z" :fill="`url(#${id})`" />
        </g>
        <defs>
            <filter :id="filterId" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse" height="51.3549" width="49.2216" x="0.789215" y="0.447304">
                <feFlood flood-opacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                <feOffset dy="1.65809" />
                <feGaussianBlur stdDeviation="1.10539" />
                <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.3 0" />
                <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_6_2" />
                <feBlend in="SourceGraphic" in2="effect1_dropShadow_6_2" mode="normal" result="shape" />
            </filter>
            <linearGradient :id="id" gradientUnits="userSpaceOnUse" x1="17.671" x2="17.671" y1="31.7392" y2="47.9333">
                <stop :stop-color="props.gradientStart" />
                <stop offset="1" :stop-color="props.gradientEnd" />
            </linearGradient>
        </defs>
    </svg>
</template>
