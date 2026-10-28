import type { IconData } from '../../types';

const IconCheckbox: IconData = {
    name: 'checkbox',
    attrs: { viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' },
    children: [
        [
            'rect',
            {
                x: '1.009',
                y: '3.1',
                width: '20',
                height: '20',
                rx: '3',
                transform: 'rotate(-6 1.00949 3.10003)',
                fill: '#4CC3FA',
            },
        ],
        [
            'path',
            {
                d: 'm8.07 12.92 3.35 3.16 4.24-7.48',
                stroke: 'white',
                'stroke-width': '3',
                'stroke-linecap': 'round',
                'stroke-linejoin': 'round',
            },
        ],
    ],
};

export default IconCheckbox;
