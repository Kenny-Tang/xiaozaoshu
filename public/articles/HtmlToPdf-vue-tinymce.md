在线富文本编辑器，富文本内容需要生成PDF文件，后端使用SpringBoot，前端使用VUE+TinyMCE，使用HtmlToPdf工具将富文本内容转换为PDF文件。

富文本中包含较多图片时，**HTML 转 PDF** 的处理会复杂不少，主要关注以下几个关键点：

---


### 使用 Headless Chrome (Playwright / Puppeteer) 生成 PDF

Playwright / Puppeteer 基于浏览器渲染，**对图片、CSS、字体、表格等的支持最好**

---

###  Playwright / Puppeteer（更强大，支持 Java）

如果允许接入 Node.js 环境或使用 Java Playwright，可以自动化浏览器生成 PDF：

```javascript
// Node.js 示例（可用于 CLI 供 Spring Boot 调用）
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle' });  // 等待图片加载
  await page.pdf({ path: 'output.pdf', format: 'A4' });
  await browser.close();
})();
```

> 可以从 Spring Boot 调用 Node.js 脚本，完成 HTML 到 PDF 的生成。

---


前端富文本编辑器推荐使用 **TinyMCE**

---

## ✅ 推荐顺序

| 编辑器              | 适合程度  | 说明                               |
| ---------------- | ----- | -------------------------------- |
| 🥇 **TinyMCE**   | ⭐⭐⭐⭐⭐ | 功能最全，图片处理强，支持 HTML 导出，商用免费版够用    |
| 🥈 **Quill**     | ⭐⭐⭐⭐  | 简洁轻量，适合基础富文本（支持 base64 图片），可扩展   |

---

## ✅ 为什么选 TinyMCE？

| 优势           | 说明                              |
| ------------ | ------------------------------- |
| 图片支持强        | 支持上传图片、粘贴图片、base64 内嵌、本地上传、远程链接 |
| 输出标准 HTML    | 直接用于 PDF 渲染，无需额外转换              |
| 插件丰富         | 表格、分页符、自定义样式、代码块、文件上传、导出等       |
| WYSIWYG 编辑体验 | 和 Word 类似，用户使用门槛低               |
| 国际化完善        | 支持中文语言包，文档齐全                    |

---


## ✅ TinyMCE 安装 & Vue 集成（简要）

```bash
npm install @tinymce/tinymce-vue tinymce
```

```vue
<template>
  <editor
    v-model="content"
    :init="{
      height: 500,
      menubar: true,
      plugins: 'image link table lists code',
      toolbar: 'undo redo | bold italic | alignleft aligncenter alignright | image link code',
      images_upload_handler: imageUploadHandler
    }"
  />
  <button @click="submit">生成 PDF</button>
</template>

<script>
import { Editor } from '@tinymce/tinymce-vue'

export default {
  components: { Editor },
  data() {
    return {
      content: ''
    }
  },
  methods: {
    imageUploadHandler(blobInfo, success, failure) {
      // 可上传至 OSS、SpringBoot，也可转 base64
      const reader = new FileReader()
      reader.readAsDataURL(blobInfo.blob())
      reader.onload = () => success(reader.result)
    },
    submit() {
      this.$axios.post('/api/pdf/generate', {
        htmlContent: this.content
      }, { responseType: 'blob' }).then(res => {
        const blob = new Blob([res.data], { type: 'application/pdf' });
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = 'output.pdf'
        link.click()
      })
    }
  }
}
</script>
```

---

## ✅ 图片处理选项

| 模式        | 推荐程度 | 说明                              |
| --------- | ---- | ------------------------------- |
| base64 内嵌 | ✅✅✅  | 简单方便，适合嵌入 PDF，适用于小图             |
| 上传服务器     | ✅✅✅✅ | 图片放 OSS 或 SpringBoot 提供地址，更适合大图 |

---

## ✅ 总结建议

| 场景        | 建议选择                   |
| --------- | ---------------------- |
| 商业可控、自定义强 | **TinyMCE**，专业级        |
| 简洁、开源轻量   | **Quill**，入门快          |

---


下面是一份基于 **Vue + TinyMCE** 和 **Spring Boot + Playwright（Node.js）** 的完整示例结构和代码，快速搭建支持富文本（含图片）在线编辑并生成 PDF 的项目骨架。

---

# 一、项目结构示例

```
my-richtext-pdf/
├── backend/               # Spring Boot 后端
│   ├── src/main/java/...
│   ├── pom.xml
│   └── node-scripts/
│       └── render-pdf.js  # Playwright PDF 生成脚本
├── frontend/              # Vue 前端
│   ├── src/
│   │   ├── App.vue
│   │   └── main.js
│   ├── package.json
│   └── ...
└── README.md
```

---

# 二、后端（Spring Boot）代码示例

### 1. `render-pdf.js` （放 `backend/node-scripts/`）

```js
// backend/node-scripts/render-pdf.js
const { chromium } = require('playwright');
const fs = require('fs');

const [,, htmlFilePath, outputPdfPath] = process.argv;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const htmlContent = fs.readFileSync(htmlFilePath, 'utf-8');
  await page.setContent(htmlContent, { waitUntil: 'networkidle' });

  await page.pdf({
    path: outputPdfPath,
    format: 'A4',
    printBackground: true
  });

  await browser.close();
})();
```

---

### 2. Spring Boot Controller

```java
@RestController
@RequestMapping("/api/pdf")
public class PdfController {

    @PostMapping("/generate")
    public void generatePdf(@RequestBody Map<String, String> body, HttpServletResponse response) throws IOException, InterruptedException {
        String htmlContent = body.get("htmlContent");

        Path htmlPath = Files.createTempFile("input-", ".html");
        Files.write(htmlPath, htmlContent.getBytes(StandardCharsets.UTF_8));

        Path pdfPath = Files.createTempFile("output-", ".pdf");

        ProcessBuilder pb = new ProcessBuilder("node", "render-pdf.js",
                htmlPath.toAbsolutePath().toString(),
                pdfPath.toAbsolutePath().toString()
        );
        pb.directory(new File("node-scripts")); // 你的 render-pdf.js 所在目录（相对于项目根）
        Process process = pb.start();

        int exitCode = process.waitFor();
        if (exitCode != 0) {
            String error = new String(process.getErrorStream().readAllBytes(), StandardCharsets.UTF_8);
            throw new RuntimeException("PDF 生成失败: " + error);
        }

        response.setContentType("application/pdf");
        response.setHeader("Content-Disposition", "attachment; filename=output.pdf");
        Files.copy(pdfPath, response.getOutputStream());

        Files.deleteIfExists(htmlPath);
        Files.deleteIfExists(pdfPath);
    }
}
```

---

# 三、前端（Vue + TinyMCE）代码示例

### 1. 安装依赖

```bash
cd frontend
npm install @tinymce/tinymce-vue tinymce axios
```

---

### 2. `App.vue`

```vue
<template>
  <div>
    <editor
      v-model="content"
      :init="{
        height: 500,
        menubar: true,
        plugins: 'image link table lists code',
        toolbar: 'undo redo | bold italic | alignleft aligncenter alignright | image link code',
        images_upload_handler: imageUploadHandler
      }"
    />
    <button @click="submit">生成 PDF</button>
  </div>
</template>

<script>
import { Editor } from '@tinymce/tinymce-vue'
import axios from 'axios'

export default {
  components: { Editor },
  data() {
    return { content: '' }
  },
  methods: {
    imageUploadHandler(blobInfo, success, failure) {
      const reader = new FileReader()
      reader.readAsDataURL(blobInfo.blob())
      reader.onload = () => success(reader.result)
      reader.onerror = () => failure('读取图片失败')
    },
    submit() {
      axios.post('/api/pdf/generate', {
        htmlContent: this.content
      }, { responseType: 'blob' }).then(res => {
        const blob = new Blob([res.data], { type: 'application/pdf' });
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = 'output.pdf'
        link.click()
      }).catch(err => {
        alert('PDF 生成失败')
        console.error(err)
      })
    }
  }
}
</script>

<style>
/* 可根据需要定制样式 */
</style>
```

---

# 四、运行步骤

1. **启动 Node 环境**
   确保你已安装 Node.js，且 `render-pdf.js` 及 `node_modules` 在 `backend/node-scripts` 目录下。

   ```bash
   cd backend/node-scripts
   npm init -y
   npm install playwright
   npx playwright install
   ```

2. **启动 Spring Boot 后端**

3. **启动 Vue 前端**

4. **打开浏览器访问 Vue 项目，编辑内容，点击“生成 PDF”**

---

# 五、注意事项

* **Playwright 运行时需要安装 Chromium 浏览器，首次安装较大（百兆级别）**
* **确保后端有权限执行 Node 命令**
* **可根据生产环境调整临时文件路径和清理策略**
* **图片较多时，生成 PDF 速度受网络和机器性能影响**
* **前端图片上传为 base64，若文件过大可改为上传到服务器再插入 URL**

---


## 为PDF添加书签和目录

## ✅ 推荐解决方案（可选两种）

---

### ✅ 方法一：标题中添加特殊前缀标识（最简单稳妥 ✅）

例如，在 HTML 中将标题写成：

```html
<h1>§ 第一章 项目概述</h1>
<h2>§ 1.1 背景介绍</h2>
```

你依然保留视觉上的「第一章」，但通过 **不可见的前缀**（比如 `§`、`🔖`、`>>`）让标题在 PDF 中具有唯一性：

* 不会在正文中自然出现
* PDFBox 可以安全匹配 `text.contains("§ 第一章 项目概述")`

#### 📌 如果你不希望读者看到这个前缀：

用 CSS 隐藏：

```html
<h1><span class="toc-mark">§</span> 第一章 项目概述</h1>

<style>
.toc-mark {
  visibility: hidden;
}
</style>
```

⚠️ 但 `visibility: hidden` 依然会被 Playwright 渲染进 PDF（是好事！）

---

### ✅ 方法二：标题后附加唯一标记（如 UUID 或 ID）

如果你用 Vue/TinyMCE 生成标题，可添加唯一标识（推荐用于大型文档）：

```html
<h1>第一章 项目概述 ⸺#toc-1</h1>
```

你在 PDFBox 中就能精准查找 `#toc-1` 这类唯一标记。

然后：

* 查找页码时匹配：`text.contains("#toc-1")`
* 添加书签时显示为：`第一章 项目概述`（去除标记）

---

## ✅ Java 示例增强：只匹配带有特殊前缀的标题

```java
int findPageOfTitle(PDDocument doc, String marker) throws IOException {
    PDFTextStripper stripper = new PDFTextStripper();
    int pageCount = doc.getNumberOfPages();

    for (int i = 1; i <= pageCount; i++) {
        stripper.setStartPage(i);
        stripper.setEndPage(i);
        String text = stripper.getText(doc);
        if (text.contains(marker)) {
            return i - 1;
        }
    }
    return -1;
}
```

---

## ✅ 总结建议

| 方法                        | 是否推荐  | 优点              | 缺点             |
| ------------------------- | ----- | --------------- | -------------- |
| `§` 前缀                    | ✅ 推荐  | 简单、安全，兼容 PDFBox | 需轻微调整 HTML/CSS |
| `#toc-uuid` 后缀            | ✅ 推荐  | 精准匹配，唯一性强       | 需要后处理去掉显示      |
| 直接 `text.contains(title)` | ❌ 不推荐 | 易错匹配，风险大        | 无法区分正文/标题文本    |


你想将这个富文本编辑器系统 **打包为桌面应用并安装到客户电脑**，这是一个很常见的企业场景（本地化、安全、离线 PDF 生成），下面是完整、可落地的 **打包方案**：

---

## ✅ 目标方案架构

你将构建一个基于 **Electron + Vue + TinyMCE** 前端界面，调用本地集成的 **Spring Boot + Playwright（Node.js）服务**，最终形成一个可安装在客户电脑（Windows/macOS）的程序。

---

## ✅ 总体结构

```
project/
├── electron-app/           # Electron 宿主壳 + 前端 UI（Vue 打包产物）
│   ├── main.js             # Electron 启动入口
│   ├── preload.js
│   ├── public/
│   └── dist/               # Vue 打包后文件
├── vue-app/                # Vue + TinyMCE 富文本编辑器
├── backend/                # Spring Boot 后端（PDF 转换服务）
│   └── node-scripts/       # Playwright HTML to PDF 脚本
├── package.json            # Electron 应用打包配置
└── README.md
```

---

## ✅ 实现步骤

---

### 🥇 第一步：整合本地服务（Spring Boot + Playwright）

#### 📦 后端打包为 Jar

* 将 Spring Boot 项目打成一个 fat jar，例如：

```bash
mvn clean package -DskipTests
# 得到 backend/target/pdf-backend.jar
```

#### 📦 Playwright node 脚本在本地执行

* 保证 Electron 打包时 Playwright 的 `node_modules` 也包含进去。
* 或使用 [playwright-core + browser download path override](https://playwright.dev/docs/browsers#managing-browsers)

---

### 🥈 第二步：Vue 前端打包嵌入 Electron

#### 📦 构建 Vue 应用（TinyMCE 编辑器）

```bash
cd vue-app
npm install
npm run build
# 输出 dist/ 复制到 electron-app/dist/
```

---

### 🧠 第三步：Electron 主进程控制逻辑

#### `electron-app/main.js` 示例：

```js
const { app, BrowserWindow } = require('electron')
const path = require('path')
const { spawn } = require('child_process')

let springProcess = null

function createWindow () {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  win.loadFile('dist/index.html')
}

app.whenReady().then(() => {
  // 启动 Spring Boot 后端服务
  springProcess = spawn('java', ['-jar', 'pdf-backend.jar'], {
    cwd: path.join(__dirname, '../backend/target'), // 确保路径正确
    stdio: 'inherit'
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

app.on('quit', function () {
  if (springProcess) {
    springProcess.kill()
  }
})
```

---

### 🛠️ preload.js（可为空）

```js
// electron-app/preload.js
window.addEventListener('DOMContentLoaded', () => {
  // 可扩展 Node 与 Web 通信
})
```

---

### 🎁 第四步：打包为可执行文件（使用 electron-builder）

```bash
npm install electron electron-builder --save-dev
```

#### `package.json` 示例（根目录）

```json
{
  "name": "richtext-pdf-app",
  "version": "1.0.0",
  "main": "electron-app/main.js",
  "scripts": {
    "build": "electron-builder"
  },
  "build": {
    "appId": "com.example.richtextpdf",
    "directories": {
      "buildResources": "assets",
      "output": "dist_electron"
    },
    "files": [
      "electron-app/**",
      "backend/target/pdf-backend.jar",
      "backend/node-scripts/**"
    ],
    "mac": {
      "target": "dmg"
    },
    "win": {
      "target": "nsis"
    }
  },
  "devDependencies": {
    "electron": "^27.0.0",
    "electron-builder": "^24.0.0"
  }
}
```

---

## ✅ 优势

* 完整打包为桌面软件（Windows 或 macOS）
* 客户端不依赖外部网络，即可完成富文本编辑和 PDF 导出
* Spring Boot 后端、Node.js PDF 转换流程一体封装
* 可离线运行，适合文档编辑类企业系统

---

## ✅ 安装部署

打包后会生成 `.exe` / `.dmg` 安装文件，客户即可像普通软件一样安装。

---

## ✅ 可选优化项

| 功能        | 说明                                    |
| --------- | ------------------------------------- |
| 自动更新      | 可集成 electron-updater + S3 / GitHub 发布 |
| UI 样式优化   | 使用 Tailwind / Element Plus 优化界面体验     |
| 字体打包      | 将 SimSun/MSYH 字体打包到资源中，防止中文乱码         |
| 加密 PDF    | 可扩展为带密码、带水印的 PDF 导出功能                 |
| 使用 SQLite | 可持久化富文本草稿记录等本地数据                      |

---

## ✅ 是否需要我：

* 📦 提供一个完整的 GitHub 仓库结构和配置文件？
* 📁 打包模板（Electron + Vue + Spring Boot + Node）打好 zip？
* 📸 提供运行效果截图？

你说一声即可，我可以一步到位整理交付方案。
