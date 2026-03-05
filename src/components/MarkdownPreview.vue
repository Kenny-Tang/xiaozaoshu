<template>
  <div class="markdown-container">
    <div class="content" ref="contentRef">
      <div v-html="innerHtml"></div>
    </div>
    <div class="toc">
      <h3>文档目录</h3>
      <ul>
        <li v-for="(item, index) in toc" :key="index" :class="'level-' + item.level">
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
import jsYaml from "js-yaml";
import encode from "plantuml-encoder";
import mermaid from "mermaid"; // 引入 mermaid

// HTML 转义
function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}

export default {
  name: "MarkdownPreview",
  props: {
    content: String
  },
  data() {
    const md = new MarkdownIt({
      html: true,
      breaks: true,
      typographer: true,
      linkify: true,
      highlight: (code, lang) => {
        const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
        return `<pre class="hljs"><code>${hljs.highlight(code, { language }).value}</code></pre>`;
      }
    });

    // 自定义 fence 渲染规则，拦截 plantuml 和 mermaid 代码块
    const defaultFence = md.renderer.rules.fence.bind(md.renderer.rules);
    md.renderer.rules.fence = (tokens, idx, options, env, self) => {
      const token = tokens[idx];
      const lang = token.info.trim().toLowerCase();

      // 检测 PlantUML 代码块
      if (lang === 'plantuml' || lang === 'puml') {
        const plantUmlCode = token.content;
        const encoded = encode.encode(plantUmlCode);
        const imageUrl = `https://www.plantuml.com/plantuml/svg/${encoded}`;

        return `<div class="uml-diagram">
          <img src="${imageUrl}" alt="PlantUML Diagram" loading="lazy" />
        </div>`;
      }

      // 检测 Mermaid 代码块
      if (lang === 'mermaid') {
        const mermaidCode = token.content;
        // 生成唯一 ID
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

        return `<div class="mermaid-diagram" data-mermaid-id="${id}">
          <pre class="mermaid-code">${escapeHtml(mermaidCode)}</pre>
        </div>`;
      }

      // 其他代码块使用默认渲染
      return defaultFence(tokens, idx, options, env, self);
    };

    // 添加 front-matter 支持
    md.use(frontMatter, (fm) => {
      this.metadata = this.parseYaml(fm);
    });

    return {
      metadata: {},
      md: md,
      toc: [],
      clipboardInstances: [],
      mermaidInitialized: false
    };
  },
  computed: {
    innerHtml() {
      const html = this.md.render(this.content);
      return html;
    }
  },
  mounted() {
    this.initMermaid();
    this.$nextTick(() => {
      this.generateTOC();
      this.addCopyButton();
      this.renderMermaid();
    });
  },
  watch: {
    content(newContent) {
      this.$nextTick(() => {
        this.generateTOC();
        this.addCopyButton();
        this.renderMermaid();
        // ✅ 列表长时 nextTick 可能不够，加一层 setTimeout 兜底
        setTimeout(() => this.renderMermaid(), 100);
      });
    }
  },
  beforeUnmount() {
    // 清理所有 clipboard 实例，防止内存泄漏
    this.clipboardInstances.forEach(clipboard => {
      clipboard.destroy();
    });
    this.clipboardInstances = [];
  },
  methods: {
    // 初始化 Mermaid 配置
    initMermaid() {
      if (this.mermaidInitialized) return;

      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
          curve: 'basis'
        },
        sequence: {
          useMaxWidth: true
        },
        gantt: {
          useMaxWidth: true
        }
      });

      this.mermaidInitialized = true;
    },

    // 渲染所有 Mermaid 图表
    async renderMermaid() {
      const mermaidDiagrams = this.$refs.contentRef?.querySelectorAll('.mermaid-diagram') || [];

      for (const diagram of mermaidDiagrams) {
        // ✅ 关键：先清理 Mermaid 注入到 document.body 的残留 SVG 元素
        const oldId = diagram.getAttribute('data-mermaid-id');
        const orphanSvg = document.getElementById(oldId);
        if (orphanSvg) orphanSvg.remove();
        // ✅ 每次渲染前生成新 id，避免 "id already exists" 错误
        const newId = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        diagram.setAttribute('data-mermaid-id', newId);

        const codeElement = diagram.querySelector('.mermaid-code');
        if (!codeElement) continue;

        const mermaidCode = codeElement.textContent;
        try {
          const { svg } = await mermaid.render(newId, mermaidCode);
          diagram.innerHTML = `<div class="mermaid-rendered">${svg}</div>`;
        } catch (error) {
          console.error('Mermaid 渲染失败:', error);
          diagram.innerHTML = `<div class="mermaid-error">
            <p>❌ Mermaid 图表渲染失败</p>
            <pre>${escapeHtml(error.message)}</pre>
            <details>
              <summary>查看源码</summary>
              <pre>${escapeHtml(mermaidCode)}</pre>
            </details>
          </div>`;
        }
      }
    },

    addCopyButton() {
      // 先清理旧的 clipboard 实例
      this.clipboardInstances.forEach(clipboard => {
        clipboard.destroy();
      });
      this.clipboardInstances = [];

      const codeBlocks = this.$refs.contentRef?.querySelectorAll("pre code") || [];

      codeBlocks.forEach((block) => {
        const pre = block.parentElement;

        // 跳过 UML 图表和 Mermaid 的代码块
        if (pre.closest('.uml-diagram') || pre.closest('.mermaid-diagram')) return;

        // 避免重复添加按钮
        if (pre.querySelector('.copy-btn')) return;

        const button = document.createElement("button");
        button.className = "copy-btn";
        button.innerText = "复制";

        pre.style.position = 'relative';
        pre.prepend(button);

        const clipboard = new ClipboardJS(button, {
          text: () => block.textContent
        });

        clipboard.on("success", (e) => {
          e.trigger.innerText = "已复制";
          setTimeout(() => {
            e.trigger.innerText = "复制";
          }, 1500);
        });

        clipboard.on("error", () => {
          console.error("复制失败！");
        });

        // 保存实例用于后续清理
        this.clipboardInstances.push(clipboard);
      });
    },

    parseYaml(fm) {
      try {
        return jsYaml.load(fm) || {};
      } catch (e) {
        console.error("YAML 解析失败:", e);
        return {};
      }
    },

    generateTOC() {
      const headings = this.$refs.contentRef?.querySelectorAll('h1, h2, h3, h4, h5, h6') || [];
      this.toc = [];

      headings.forEach((heading, idx) => {
        const level = parseInt(heading.tagName[1]);
        const title = heading.textContent.trim();

        // 生成唯一 ID，支持中文
        const id = heading.id || `heading-${idx}-${title.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-')}`;
        heading.id = id;

        this.toc.push({
          title: title,
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
  gap: 20px;
}

.content {
  flex: 1;
  min-width: 0;
}

.toc {
  width: 200px;
  position: sticky;
  top: 20px;
  max-height: 90vh;
  overflow-y: auto;
  padding-left: 20px;
}

.toc ul {
  list-style: none;
  padding-left: 0;
}

.toc ul li {
  margin-bottom: 10px;
}

/* 目录层级缩进 */
.toc ul li.level-1 {
  font-weight: bold;
}

.toc ul li.level-2 {
  padding-left: 15px;
}

.toc ul li.level-3 {
  padding-left: 30px;
}

.toc ul li.level-4 {
  padding-left: 45px;
}

.toc ul li a {
  text-decoration: none;
  color: #0077cc;
}

.toc ul li a:hover {
  text-decoration: underline;
}

blockquote {
  background: #f5f5f5;
  border-left: 4px solid #ccc;
  border-radius: 5px;
  padding: 10px 15px;
  margin: 1em 0;
}

pre {
  padding: 10px;
  background: #1e1e1e;
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
  font-size: 12px;
  border-radius: 5px;
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  transition: background-color 0.2s;
}

.copy-btn:hover {
  background-color: #45a049;
}

/* PlantUML 图表样式 */
.uml-diagram {
  text-align: center;
  margin: 20px 0;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.uml-diagram img {
  max-width: 100%;
  height: auto;
  display: inline-block;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Mermaid 图表样式 */
.mermaid-diagram {
  margin: 20px 0;
  padding: 20px;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  overflow-x: auto;
}

.mermaid-code {
  display: none; /* 隐藏原始代码 */
}

.mermaid-rendered {
  text-align: center;
}

.mermaid-rendered svg {
  max-width: 100%;
  height: auto;
}

/* Mermaid 错误提示样式 */
.mermaid-error {
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 5px;
  padding: 15px;
  color: #856404;
}

.mermaid-error p {
  margin: 0 0 10px 0;
  font-weight: bold;
}

.mermaid-error pre {
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
}

.mermaid-error details {
  margin-top: 10px;
}

.mermaid-error summary {
  cursor: pointer;
  font-weight: bold;
  color: #0077cc;
}

.mermaid-error summary:hover {
  text-decoration: underline;
}

img {
  max-width: 100%;
  object-fit: contain;
}

table {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
}

th, td {
  border: 1px solid #333;
  padding: 8px;
  text-align: left;
}

th {
  background-color: #444444ad;
  color: rgb(6, 6, 6);
  font-weight: bold;
}
</style>