import type { IconData } from '../types';

const IconDesktop: IconData = {
    name: 'desktop',
    attrs: { viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' },
    children: [
        [
            'path',
            {
                d: 'M2.5 14.5v-9c0-1.1.9-2 2-2h15a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2Z',
                stroke: 'currentColor',
                'stroke-width': '3',
            },
        ],
        ['path', { d: 'M7.5 21.5h9', stroke: 'currentColor', 'stroke-width': '3', 'stroke-linecap': 'round' }],
        ['path', { d: 'M12 15.5v5', stroke: 'currentColor', 'stroke-width': '4' }],
    ],
};

export default IconDesktop;
