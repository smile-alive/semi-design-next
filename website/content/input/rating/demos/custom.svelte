<script lang="ts">
    import { IconLikeHeart } from '@fibrae/semi-icons-svelte';
    import { Rating } from '@fibrae/semi-ui-svelte';
</script>

<div>
    <Rating style="color: red" value={3}>
        {#snippet character()}
            <IconLikeHeart size="extra-large" />
        {/snippet}
    </Rating>
    <br />
    <br />
    <Rating allowHalf size={48} style="color: red" value={3}>
        {#snippet character()}
            <IconLikeHeart style="font-size: 48px" />
        {/snippet}
    </Rating>
    <br />
    <br />
    <Rating character="赞" size={18} value={3} />
    <br />
    <br />
    <Rating count={10} value={6} />
</div>
