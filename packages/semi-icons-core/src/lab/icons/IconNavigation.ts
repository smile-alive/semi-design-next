import type { IconData } from '../../types';

const IconNavigation: IconData = {
    name: 'navigation',
    attrs: { viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' },
    children: [
        [
            'g',
            { 'clip-path': 'url(#{uid}__clip0_1_3057)' },
            [
                ['circle', { cx: '12', cy: '12', r: '11', transform: 'rotate(-45 12 12)', fill: '#DDE3E8' }],
                ['path', { d: 'm4.95 12.24 11.87-5.32-4.58 12.17-1.73-5.46-5.56-1.4', fill: '#324350' }],
            ],
        ],
        ['defs', {}, [['clipPath', { id: '{uid}__clip0_1_3057' }, [['rect', { width: '24', height: '24', fill: 'white' }]]]]],
    ],
};

export default IconNavigation;
