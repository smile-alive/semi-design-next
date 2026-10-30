import type { IconData } from '../types';

const IconAILoading: IconData = {
    name: 'ai_loading',
    attrs: { viewBox: '0 0 16 16', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' },
    children: [
        ['path', { d: 'M15.1112 7.99978C15.1112 4.07242 11.9275 0.888672 8.00009 0.888672C5.18219 0.888672 2.74711 2.52771 1.59619 4.90445', stroke: 'url(#{uid}__semi-ai-loading)', 'stroke-width': '1.77778', 'stroke-linecap': 'round' }],
        [
            'defs',
            {},
            [
                [
                    'linearGradient',
                    { id: '{uid}__semi-ai-loading', x1: '16', y1: '8', x2: '2.68594', y2: '11.022', gradientUnits: 'userSpaceOnUse' },
                    [
                        ['stop', { 'stop-color': '{fill0}' }],
                        ['stop', { offset: '0.3', 'stop-color': '{fill1}' }],
                        ['stop', { offset: '0.6', 'stop-color': '{fill2}' }],
                        ['stop', { offset: '1', 'stop-color': '{fill3}', 'stop-opacity': '0' }],
                    ],
                ],
            ],
        ],
    ],
    fills: 4,
};

export default IconAILoading;
