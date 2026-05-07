<template>
    <div>
        <DocxPreview :docxUrl="url" />
    </div>
</template>

<script>
import DocxPreview from "@/components/DocxPreview.vue";

export default {
    props: {
        url: {
            type: String,
            required: true
        }
    },
    components: {
        DocxPreview
    }
}
</script>
