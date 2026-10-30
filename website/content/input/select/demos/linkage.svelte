<script lang="ts">
    import { Select, type SelectValue } from '@fibrae/semi-ui-svelte';

    const provinces = ['四川', '广东'];
    const maps: Record<string, string[]> = {
        四川: ['成都', '都江堰'],
        广东: ['广州', '深圳', '东莞'],
    };

    let province = $state(provinces[0]);
    let city = $state<string | undefined>(maps[provinces[0]][0]);

    const provinceList = provinces.map((item) => ({ value: item, label: item }));
    const cityList = $derived(maps[province].map((item) => ({ value: item, label: item })));

    const changeProvince = (next: SelectValue) => {
        if (typeof next !== 'string') {
            return;
        }
        province = next;
        city = maps[next][0];
    };
</script>

<Select aria-label="省份" onChange={changeProvince} optionList={provinceList} style="width: 150px; margin: 10px" value={province} />
<Select aria-label="城市" bind:value={city} optionList={cityList} style="width: 150px; margin: 10px" />
