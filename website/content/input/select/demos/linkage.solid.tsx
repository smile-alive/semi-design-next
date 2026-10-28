import { For, createSignal } from 'solid-js';
import { Select } from '@fibrae/semi-ui-solid';

const provinces = ['四川', '广东'];
const maps: Record<string, string[]> = {
    四川: ['成都', '都江堰'],
    广东: ['广州', '深圳', '东莞'],
};

export default function SelectDemo() {
    const [province, setProvince] = createSignal(provinces[0]);
    const citys = () => maps[province()];
    const [city, setCity] = createSignal<string | undefined>(citys()[0]);

    const provinceChange = (newProvince?: string) => {
        if (!newProvince) {
            return;
        }
        setProvince(newProvince);
        setCity(maps[newProvince][0]);
    };

    return (
        <>
            <Select aria-label="省份" style={{ width: '150px', margin: '10px' }} onChange={provinceChange} value={province()}>
                <For each={provinces}>{(pro) => <Select.Option value={pro}>{pro}</Select.Option>}</For>
            </Select>
            <Select aria-label="城市" style={{ width: '150px', margin: '10px' }} value={city()} onChange={(v) => setCity(v)}>
                <For each={citys()}>{(c) => <Select.Option value={c}>{c}</Select.Option>}</For>
            </Select>
        </>
    );
}
