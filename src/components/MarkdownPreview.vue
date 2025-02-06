<template>
  <div>
    <div v-html="innerHtml"></div>
  </div>
</template>

<script>
import MarkdownIt from "markdown-it";
import frontMatter from "markdown-it-front-matter";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";
import ClipboardJS from "clipboard"; // 引入 clipboard.js

export default {
  name: "MarkdownPreview",
  props: {
    content: String
  },
  data() {
    return {
      metadata: {}, // 存放解析的 YAML 数据
      md: new MarkdownIt({
        html: true,
        breaks: true,
        typographer: true,
        linkify: true,
        highlight: (code, lang) => {
          const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
          return `<pre class="hljs"><code>${hljs.highlight(code, { language }).value}</code></pre>`;
        }
      }).use(frontMatter, (fm) => {
        this.metadata = this.parseYaml(fm);
      })
    };
  },
  computed: {
    innerHtml() {
			console.log(this.content)
      return this.md.render(this.content);
    }
  },
  watch: {
    content() {
      this.$nextTick(() => {
        this.addCopyButton();
      });
    }
  },
  mounted() {
    this.addCopyButton();
  },
  methods: {
    addCopyButton() {
      const codeBlocks = document.querySelectorAll("pre code");
      codeBlocks.forEach((block) => {
        if (block.parentElement.querySelector('.copy-btn')) return; // 避免重复添加按钮

        const button = document.createElement("button");
        button.className = "copy-btn";
        button.innerText = "复制";

        block.parentElement.style.position = 'relative';
        block.parentElement.prepend(button);

        const clipboard = new ClipboardJS(button, {
          text: () => block.textContent
        });

        clipboard.on("success", () => {
          console.log("复制成功！");
        });

        clipboard.on("error", () => {
          console.error("复制失败！");
        });
      });
    },
    parseYaml(fm) {
      try {
        return jsYaml.load(fm);
      } catch (e) {
        console.error("YAML 解析失败:", e);
        return {};
      }
    }
  }
};
</script>

<style>
pre {
  padding: 10px;
  background: #f6f8fa;
  border-radius: 5px;
  overflow-x: auto;
  position: relative;
}

.copy-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 14px;
  border-radius: 5px;
  position: absolute;
  top: 10px;
  right: 10px;
}

.copy-btn:hover {
  background-color: #45a049;
}
p {
    margin-bottom: 1em; /* 确保段落之间有间距 */
}
</style>