<template>
	<div class="about">
		<MarkdownPreview :content="markdownContent"></MarkdownPreview>		 
	</div>
</template>

<script>
import MarkdownPreview from '../components/MarkdownPreview.vue';
import axios from 'axios';

export default {
	props: {
		url: {
			type: String,
			required: true
		}
	},
	data() {
		return {
			markdownContent: '本文介绍目前被业界广泛采用的服务发布策略，包括蓝绿部署、A/B测试以及金丝雀发布。\n # 蓝绿部署\n 蓝绿部署需要对服务的新版本进行荣誉部署，一半新版本的实例规格和数量与旧版本保持一致，相当于该服务有两套完全相同的部署环境，只不过此时只有旧版本的在对外提供服务，新版本作为热备。当服务进行版本升级时，只需要将流量全部切换到新版本即可，旧版本作为热备。由于冗余部署的缘故，所以不必担心新版白的资源不够，如果新版本上线后出现严重的问题，那么只需要将流量全部切回旧版本，大大缩短恢复故障的时间。待新版本完成问题修复并重新部署之后，再将旧版本的流量切换到新版本。\n 蓝绿部署通过使用额外的实例资源来解决服务发布期间的不可用问题，当服务新版本出现故障时，也可以快速将流量切回旧版本。\n 如下图所示，某服务旧版本为v1，对新版本v2进行荣誉部署。版本升级时，将现有流量全部切换为新版本v2。\n <img src="./images/670326044217298955.png" alt="蓝绿发布1"> ' 
		}
	},
	watch: {
		url(oldVal, newVal) {
			console.log(`article 变化: ${oldVal} -> ${newVal}`);
			this.loadMarkdown();
		}
	},
	mounted() {
		this.loadMarkdown();
	},
	components: {
		MarkdownPreview
	},
	methods: {
		async loadMarkdown() {
			try {
				// console.log(this.url+" s")
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