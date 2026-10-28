import { useState } from 'react';
import { Select } from '@fibrae/semi-ui-react';

export default function SelectDemo() {
    const provinces = ['四川', '广东'];
    const maps: Record<string, string[]> = {
        四川: ['成都', '都江堰'],
        广东: ['广州', '深圳', '东莞'],
    };

    const [province, setProvince] = useState(provinces[0]);
    const citys = maps[province];
    const [city, setCity] = useState<string | undefined>(citys[0]);

    const provinceChange = (newProvince?: string) => {
        if (!newProvince) {
            return;
        }
        setProvince(newProvince);
        setCity(maps[newProvince][0]);
    };
    const cityChange = (newCity?: string) => setCity(newCity);

    return (
        <>
            <Select aria-label="省份" style={{ width: '150px', margin: '10px' }} onChange={provinceChange} value={province}>
                {provinces.map((pro) => (
                    <Select.Option value={pro} key={pro}>
                        {pro}
                    </Select.Option>
                ))}
            </Select>
            <Select aria-label="城市" style={{ width: '150px', margin: '10px' }} value={city} onChange={cityChange}>
                {citys.map((c) => (
                    <Select.Option value={c} key={c}>
                        {c}
                    </Select.Option>
                ))}
            </Select>
        </>
    );
}
