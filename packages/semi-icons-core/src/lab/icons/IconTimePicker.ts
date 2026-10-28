import type { IconData } from '../../types';

const IconTimePicker: IconData = {
    name: 'time-picker',
    attrs: { viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' },
    children: [
        ['circle', { cx: '12', cy: '12', r: '10.25', fill: 'white', stroke: '#AAB2BF', 'stroke-width': '1.5' }],
        [
            'path',
            {
                d: 'M14.5 6.5 12 12l5 5.5',
                stroke: '#6A6F7F',
                'stroke-width': '2.5',
                'stroke-linecap': 'round',
                'stroke-linejoin': 'round',
            },
        ],
        ['circle', { cx: '12', cy: '12', r: '2', fill: '#324350' }],
        ['path', { d: 'M13 11.63 12 12l-7 3', stroke: '#FBCD2C', 'stroke-linecap': 'round' }],
        ['circle', { cx: '12', cy: '12', r: '1', fill: '#FBCD2C' }],
    ],
};

export default IconTimePicker;
