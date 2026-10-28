export function getRandomNumber(end = 100, start = 0) {
    const number = Math.ceil(Math.random() * (end - start)) + start;
    return number;
}

export function getData(total = 25) {
    const _data = [];
    for (let i = 0; i < total; i++) {
        let age = (i * 1000) % 149;
        let name = `Edward King ${i}`;
        _data.push({
            key: String(i),
            name,
            age,
            address: `London, Park Lane no. ${i} Lake Park`,
            description: `My name is ${name}, I am ${age} years old, living in New York No. ${i + 1} Lake Park.`,
        });
    }
    return _data;
}

export function getGroupData() {
    const data = [
        { city: 'Beijing', job: 'FE', department: 'IES' },
        { city: 'Beijing', job: 'BE', department: 'IES' },
        { city: 'Shanghai', job: 'Android', department: 'IES' },
        { city: 'Tokyo', job: 'Android', department: 'IES' },
        { city: 'Shanghai', job: 'IOS', department: 'EE' },
        { city: 'LA', job: 'SE', department: 'EE' },
        { city: 'Beijing', job: 'Android', department: 'EE' },
        { city: 'Tokyo', job: 'IOS', department: 'EE' },
        { city: 'Tokyo', job: 'SE', department: 'DATA' },
        { city: 'Shanghai', job: 'BE', department: 'DATA' },
        { city: 'LA', job: 'Android', department: 'DATA' },
        { city: 'LA', job: 'IOS', department: 'DATA' },
    ];
    return data;
}

export function getNestData(total = 25) {
    const data = [];
    for (let i = 0; i < total; i++) {
        let age = (i * 1000) % 149;
        let name = `Edward King ${i}`;
        data.push({
            key: String(i),
            company: {
                name: 'ByteDance',
                address: 'No. 48, Zhichun Road',
            },
            name,
            age,
            address: `No ${i + 1}, Zhongguancun Street`,
            description: `My name is ${name}, I am ${age} years old, living in No ${i + 1}, Zhongguancun Street`,
        });
    }
    return data;
}

export function getTreeData() {
    const childrenData = [
        {
            key: 1,
            name: 'ZhangSan',
            age: 30,
            address: 'bytedance 1',
            children: [
                {
                    key: 11,
                    name: 'LiSi',
                    age: 40,
                    address: 'bytedance 2',
                },
                {
                    key: 12,
                    name: 'WangWu',
                    age: 30,
                    address: 'bytedance 2',
                    children: [
                        {
                            key: 121,
                            name: 'XiaoMing',
                            age: 50,
                            address: 'bytedance 3',
                        },
                    ],
                },
                {
                    key: 13,
                    name: 'XiaoZhang',
                    age: 60,
                    address: 'bytedance 4',
                    children: [
                        {
                            key: 131,
                            name: 'XiaoLi',
                            age: 50,
                            address: 'bytedance 5',
                            children: [
                                {
                                    key: 1311,
                                    name: 'XiaoGuo',
                                    age: 40,
                                    address: 'bytedance 6',
                                },
                                {
                                    key: 1312,
                                    name: 'XiaoHong',
                                    age: 30,
                                    address: 'bytedance 7',
                                },
                            ],
                        },
                    ],
                },
            ],
        },
        {
            key: 2,
            name: 'XiaoGang',
            age: 80,
            address: 'bytedance 8',
        },
    ];
    return childrenData;
}
