import type { IconData } from '../../types';

const IconAvatar: IconData = {
    name: 'avatar',
    attrs: { viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' },
    children: [
        ['circle', { cx: '12', cy: '12', r: '11', fill: '#FBCD2C' }],
        ['mask', { id: '{uid}__mask0_1_3014', style: 'mask-type:alpha', maskUnits: 'userSpaceOnUse', x: '1', y: '1', width: '22', height: '22' }, [['circle', { cx: '12', cy: '12', r: '11', fill: '#A2845E' }]]],
        [
            'g',
            { mask: 'url(#{uid}__mask0_1_3014)' },
            [
                [
                    'path',
                    {
                        'fill-rule': 'evenodd',
                        'clip-rule': 'evenodd',
                        d: 'M12 17.8c1.72 0 3.25-1.44 4.09-3.6.52-.2 1.02-.86 1.24-1.7.3-1.1.24-2.09-.56-2.4-.08-3.83-1.6-5.31-4.77-5.31-3.18 0-4.69 1.48-4.77 5.32-.8.3-.86 1.28-.57 2.39.23.84.73 1.5 1.25 1.7.84 2.16 2.37 3.6 4.09 3.6m8.01 5.2c.33 0 .58-.3.46-.6-.86-2.14-4.33-3.74-8.47-3.74s-7.61 1.6-8.47 3.74c-.12.3.13.6.46.6H20',
                        fill: 'white',
                    },
                ],
            ],
        ],
    ],
};

export default IconAvatar;
