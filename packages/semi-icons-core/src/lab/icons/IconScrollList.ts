import type { IconData } from '../../types';

const IconScrollList: IconData = {
    name: 'scroll-list',
    attrs: { viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' },
    children: [
        [
            'rect',
            {
                x: '2.75',
                y: '2.75',
                width: '18.5',
                height: '18.5',
                rx: '3',
                fill: 'white',
                stroke: '#AAB2BF',
                'stroke-width': '1.5',
            },
        ],
        ['path', { d: 'M16 2h3a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3h-3V2', fill: '#6A6F7F' }],
        ['rect', { x: '3.5', y: '7', width: '12.5', height: '5', fill: '#4CC3FA' }],
        ['path', { d: 'M3.5 17H16v3.5H5.5a2 2 0 0 1-2-2V17', fill: '#DDE3E8' }],
        ['path', { d: 'm19 4 1.3 2.25h-2.6L19 4', fill: '#AAB2BF' }],
        ['path', { d: 'M19 20.25 17.7 18h2.6L19 20.25', fill: '#AAB2BF' }],
        ['rect', { x: '18', y: '8', width: '2', height: '6', rx: '1', fill: '#DDE3E8' }],
    ],
};

export default IconScrollList;
