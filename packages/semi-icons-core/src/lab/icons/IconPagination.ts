import type { IconData } from '../../types';

const IconPagination: IconData = {
    name: 'pagination',
    attrs: { viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' },
    children: [
        ['path', { d: 'M1 8a3 3 0 0 1 3-3h8v14H4a3 3 0 0 1-3-3V8', fill: '#6A6F7F' }],
        [
            'path',
            {
                d: 'm8 9-3 3 3 3',
                stroke: 'white',
                'stroke-width': '2',
                'stroke-linecap': 'round',
                'stroke-linejoin': 'round',
            },
        ],
        ['path', { d: 'M12 5h8a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-8V5', fill: '#DDE3E8' }],
        [
            'path',
            {
                d: 'm16 9 3 3-3 3',
                stroke: '#AAB2BF',
                'stroke-width': '2',
                'stroke-linecap': 'round',
                'stroke-linejoin': 'round',
            },
        ],
    ],
};

export default IconPagination;
