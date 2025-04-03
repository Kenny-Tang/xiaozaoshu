<template>
    <div>
        <PdfPreview :pdfUrl="url" />
    </div>
</template>

<script>
import PdfPreview from "@/components/PdfPreview.vue";

export default {
	props: {
		url: {
			type: String,
			required: true
		}
	},
	watch: {
		url(oldVal, newVal) {
			console.log(`article 变化: ${oldVal} -> ${newVal}`);
		}
	},
	mounted() {
		
	},
	components: {
		PdfPreview
	},
	methods: {
	}
}	
</script>

