import type { IconData } from '../types';

const IconSpin: IconData = {
    name: 'spin',
    attrs: { viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' },
    children: [
        [
            'g',
            { 'clip-path': 'url(#{uid}__clip_spin)' },
            [
                [
                    'path',
                    {
                        'fill-rule': 'evenodd',
                        'clip-rule': 'evenodd',
                        d: 'M14.2 3.79A8.5 8.5 0 0 0 5 16.81a1.5 1.5 0 1 1-2.48 1.7 11.5 11.5 0 1 1 20.6-3.53 1.5 1.5 0 0 1-2.91-.78A8.5 8.5 0 0 0 14.2 3.79',
                        fill: 'currentColor',
                    },
                ],
            ],
        ],
        [
            'defs',
            {},
            [
                [
                    'radialGradient',
                    {
                        cx: '0',
                        cy: '0',
                        r: '1',
                        gradientUnits: 'userSpaceOnUse',
                        gradientTransform: 'translate(12 12) rotate(15) scale(9.5 9.51825)',
                    },
                    [
                        ['stop', {}],
                        ['stop', { offset: '0.301257', 'stop-opacity': '0', 'stop-color': 'currentColor' }],
                        ['stop', { offset: '0.466753', 'stop-opacity': '1', 'stop-color': 'currentColor' }],
                    ],
                ],
                ['clipPath', { id: '{uid}__clip_spin' }, [['rect', { width: '24', height: '24', fill: 'currentColor' }]]],
            ],
        ],
    ],
};

export default IconSpin;
