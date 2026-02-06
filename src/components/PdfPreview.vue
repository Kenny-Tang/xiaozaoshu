<template>
    <vue-office-pdf 
        :src="pdfUrl"
        style="height: 100vh; width: 100%;"
        @rendered="renderedHandler"
        @error="errorHandler"
    />
</template>

<script>
import VueOfficePdf from "@vue-office/pdf";

export default {
    name: "PdfViewer",
    components: {
        VueOfficePdf
    },
    props: {
        pdfUrl: {
            type: String,
            required: true
        }
    },
    methods: {
        renderedHandler() {
            console.log("PDF 渲染完成");
        },
        errorHandler(err) {
            console.error("PDF 渲染失败", err);
        }
    }
};
</script>
