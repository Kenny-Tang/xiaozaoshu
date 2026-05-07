<template>
    <vue-office-docx
        :src="docxUrl"
        style="height: 100vh; width: 100%;"
        @rendered="renderedHandler"
        @error="errorHandler"
    />
</template>

<script>
import VueOfficeDocx from "@vue-office/docx";
import "@vue-office/docx/lib/index.css";

export default {
    name: "DocxPreview",
    components: {
        VueOfficeDocx
    },
    props: {
        docxUrl: {
            type: String,
            required: true
        }
    },
    methods: {
        renderedHandler() {
            console.log("Docx 渲染完成");
        },
        errorHandler(err) {
            console.error("Docx 渲染失败", err);
        }
    }
};
</script>
