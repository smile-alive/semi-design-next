<script lang="ts">
    import { Select } from '@fibrae/semi-ui-svelte';

    const asia = { key: 'asia', label: 'Asia' };
    const europe = { key: 'europe', label: 'Europe' };
    const southAmerica = { key: 'south-america', label: 'South America' };

    const optionList = [
        { value: 'a-1', label: 'China', group: asia },
        { value: 'a-2', label: 'Korea', group: asia },
        { value: 'b-1', label: 'Germany', group: europe },
        { value: 'b-2', label: 'France', group: europe },
        { value: 'c-1', label: 'Peru', group: southAmerica },
    ];
</script>

<Select aria-label="地区" filter {optionList} placeholder="" style="width: 180px" />
