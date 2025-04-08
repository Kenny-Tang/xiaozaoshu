<template>
  <div class="markdown-container">
    <div class="content">
      <div v-html="innerHtml"></div>
    </div>
    <div class="toc">
      <h3>文档目录</h3>
      <ul>
        <li v-for="(item, index) in toc" :key="index" :style="{ marginLeft: (item.level - 1) * 15 + 'px' }">
          <a :href="'#' + item.id">{{ item.title }}</a>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import MarkdownIt from "markdown-it";
import frontMatter from "markdown-it-front-matter";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import ClipboardJS from "clipboard";
import jsYaml from "js-yaml"; // 引入 js-yaml
import plantumlEncoder from "plantuml-encoder";


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
      }),
      toc: [] // 存放目录项
    };
  },
  computed: {
    innerHtml() {
      const html = this.md.render(this.content);
      // this.generateTOC();  // 在渲染内容时生成目录
      return html;
    }
  },
  mounted() {
    this.addCopyButton();
  },
  watch: {
    content(newContent) {
      this.$nextTick(() => {
        this.addCopyButton(); // 仅在 content 变化后更新按钮
        this.generateTOC();  // 在渲染内容时生成目录
      });
    }
  },
  methods: {
    addCopyButton() {
      const codeBlocks = document.querySelectorAll("pre code");
      codeBlocks.forEach((block) => {
        if (block.parentElement.querySelector('.copy-btn')) return; // 避免重复添加按钮

        if (block.textContent.trim().startsWith("@startuml")) {
          const encoded = plantumlEncoder.encode(block.textContent);
          const img = document.createElement("img");
          img.src = `https://www.plantuml.com/plantuml/svg/${encoded}`;
          block.parentElement.prepend(img);
          block.parentElement.style.background = 'unset'; // 隐藏代码块
          block.style.display = 'none'; // 隐藏代码块
          return;
        } else {
          const button = document.createElement("button");
          button.className = "copy-btn";
          button.innerText = "复制";

          block.parentElement.style.position = 'relative';
          block.parentElement.prepend(button);

          const clipboard = new ClipboardJS(button, {
            text: () => block.textContent
          });


          clipboard.on("success", () => {
            button.innerText = "已复制";
          });

          clipboard.on("error", () => {
            console.error("复制失败！");
          });
        }
       
      });
    },
    parseYaml(fm) {
      try {
        return jsYaml.load(fm);
      } catch (e) {
        console.error("YAML 解析失败:", e);
        return {};
      }
    },
    generateTOC() {
      const headings = document.querySelectorAll('.content h1, .content h2, .content h3, .content h4, .content h5, .content h6');
      this.toc = []; // 重置目录
      headings.forEach((heading) => {
        const level = parseInt(heading.tagName[1]);
        const id = heading.id || heading.textContent.trim().toLowerCase().replace(/\s+/g, '-');
        heading.id = id; // 设置 ID 方便跳转

        this.toc.push({
          title: heading.textContent.trim(),
          id: id,
          level: level
        });
      });
    }
  }
};
</script>

<style>
.markdown-container {
  display: flex;
  justify-content: space-between;
  padding: 20px;
}

.content {
  width: 80%;
}

.toc {
  position: fixed;
  right: 20px; /* 距离页面右边的距离 */
  width: 200px; /* 宽度固定一下 */
  max-height: 95vh; /* 限高防止超出屏幕 */
  overflow-y: auto;
  background: #fff;
  border-left: 1px solid #ddd;
  padding: 10px;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.05);
}

.toc ul {
  list-style: none;
  padding-left: 0;
}

.toc ul li {
  margin-bottom: 10px;
}

.toc ul li a {
  text-decoration: none;
  color: #0077cc;
}

.toc ul li a:hover {
  text-decoration: underline;
}

blockquote {
  background: #e5e9e5;
  border-radius: 5px;
  overflow-x: auto;
  padding-left: 10px;
  margin-bottom: 1em;
  margin-inline-start: 0px;
  margin-inline-end: 0px;
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
