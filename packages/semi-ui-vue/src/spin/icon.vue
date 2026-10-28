<script setup lang="ts">
    import { useId } from 'vue';

    const gradientId = `linearGradient-${useId()}`;
</script>

<template>
    <svg aria-hidden="true" data-icon="spin" height="48" version="1.1" viewBox="0 0 36 36" width="48" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient :id="gradientId" x1="0%" x2="100%" y1="100%" y2="100%">
                <stop offset="0%" stop-color="currentColor" stop-opacity="0" />
                <stop offset="39.9430698%" stop-color="currentColor" stop-opacity="0.50" />
                <stop offset="100%" stop-color="currentColor" />
            </linearGradient>
        </defs>
        <g fill="none" fill-rule="evenodd" stroke="none" stroke-width="1">
            <rect fill="none" fill-opacity="0.01" height="36" width="36" x="0" y="0" />
            <path d="M34,18 C34,9.163444 26.836556,2 18,2 C11.6597233,2 6.18078805,5.68784135 3.59122325,11.0354951" :stroke="`url(#${gradientId})`" stroke-linecap="round" stroke-width="4" />
        </g>
    </svg>
</template>
