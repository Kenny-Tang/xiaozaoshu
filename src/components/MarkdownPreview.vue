<template>
  <div>
    <div v-html="innerHtml"></div>
  </div>
</template>

<script>
import MarkdownIt from "markdown-it";
import frontMatter from "markdown-it-front-matter";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import ClipboardJS from "clipboard";
import jsYaml from "js-yaml"; // 引入 js-yaml

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
      return this.md.render(this.content);
    }
  },
  mounted() {
    this.addCopyButton();
  },
  watch: {
    content(newContent) {
      this.$nextTick(() => {
        this.addCopyButton(); // 仅在 content 变化后更新按钮
      });
    }
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
blockquote {
  background: #e5e9e5;
  border-radius: 5px;
  overflow-x: auto;
  padding-left: 10px;
  margin-bottom: 1em;
}
pre {
  padding: 10px;
  background: #e5e9e5;
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

img {
  max-width: 100%;
  max-height: 100vh;
  object-fit: contain; /* 确保图片比例不变 */
}

table {
  border-collapse: collapse;
  width: 90%;
}

th, td {
  border: 1px solid #333; /* 加粗边框 */
  padding: 8px;
  text-align: left;
}

th {
  background-color: #444444ad; /* 让表头更明显 */
  color: rgb(6, 6, 6);
}


</style>
