<script lang="ts">
    // jsdom cannot decode an image, so the real Cropper never loads; the stub keeps the contract Upload relies on
    const props: { src: string; [key: string]: unknown } = $props();

    export function getCropperCanvas() {
        const canvas = document.createElement('canvas');
        canvas.toBlob = (callback, type) => callback(new Blob(['cropped'], { type }));
        return canvas;
    }
</script>

<img alt="" data-testid="cropper-stub" src={props.src} />
