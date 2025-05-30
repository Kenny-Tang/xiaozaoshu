<template>
	<div class="about">
		<MarkdownPreview :content="markdownContent"></MarkdownPreview>		 
	</div>
</template>

<script>
import MarkdownPreview from '../components/MarkdownPreview.vue';
import axios from 'axios';
import api from '@/api/index.js';

export default {
	props: {
		url: {
			type: String,
			required: true
		},
	},
	data() {
		return {
			markdownContent: '本文介绍目前被业界广泛采用的服务发布策略，包括蓝绿部署、A/B测试以及金丝雀发布。\n # 蓝绿部署\n 蓝绿部署需要对服务的新版本进行荣誉部署，一半新版本的实例规格和数量与旧版本保持一致，相当于该服务有两套完全相同的部署环境，' 
		}
	},
	watch: {
		url(newVal, oldVal) {
			console.log(`article 变化: ${oldVal} -> ${newVal}`);
			this.loadMarkdown();
      api.user.traceUserAction({'action': this.url});
		}
	},
	mounted() {
		this.loadMarkdown();
    api.user.traceUserAction({'action': this.url});
	},
	components: {
		MarkdownPreview
	},
	methods: {
		async loadMarkdown() {
			try {
				let responseA = await axios.get(this.url); // 从 public 目录加载
				this.markdownContent = await responseA.data;
			} catch (error) {
				console.error('加载 Markdown 文件失败:', error);
			}
		}
	}
}	
</script>

<style scoped>
	@media (min-width: 1024px) {
	  .about {
	    min-height: 100vh;
	    align-items: center;
	  }
	}
</style>