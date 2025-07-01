**Java 调用 Word/WPS 转换 PDF**

---

## 一、Jacob 环境配置（Java COM 调用库）

### 1.1 引入 Maven 依赖（Jacob 的 jar）

Jacob 并未上传到 Maven Central，需要你 **手动下载 jar 和 DLL** 后手动安装到本地仓库，或直接将 jar 添加到项目中。

#### 方法一：直接下载并手动引入

到官网或可信仓库下载：

* 官网主页：[https://sourceforge.net/projects/jacob-project/](https://sourceforge.net/projects/jacob-project/)
* 选择适合你 JDK 的版本（建议：**Jacob 1.18 或 1.20，64位系统请用 x64 版本**）

下载得到：

```
jacob-1.18-x64.dll
jacob.jar
```

然后将 `jacob.jar` 加入到项目 classpath，或添加到本地仓库：

```bash
mvn install:install-file -Dfile=jacob.jar -DgroupId=com.jacob -DartifactId=jacob -Dversion=1.18 -Dpackaging=jar
```

Maven 依赖配置如下：

```xml
<dependency>
    <groupId>com.jacob</groupId>
    <artifactId>jacob</artifactId>
    <version>1.18</version>
</dependency>
```

---

### 1.2 放置 DLL 文件（关键步骤）

必须将对应版本的 DLL 文件放到如下位置之一：

* Windows 系统目录：

    * `C:\Windows\System32\jacob-1.18-x64.dll` （64位系统）
    * 或 `C:\Windows\SysWOW64\jacob-1.18-x86.dll`（32位系统）

**建议方式（推荐）**：在 Java 程序中动态指定 DLL 路径：

```java
System.setProperty("jacob.dll.path", "C:\\libs\\jacob-1.18-x64.dll");
System.load("C:\\libs\\jacob-1.18-x64.dll");
```

可放在主方法或类静态块中，优先于一切 Jacob 调用：

```java
static {
    System.setProperty("jacob.dll.path", "C:\\libs\\jacob-1.18-x64.dll");
}
```

---

### 1.3 判断你的 JVM 是 64 位还是 32 位

在控制台运行以下命令：

```bash
java -version
```

或者在代码中输出：

```javascript
System.out.println(System.getProperty("os.arch"));  // amd64 = 64 位
```

---

## 二、测试是否安装成功

你可以运行如下 Jacob 测试代码验证：

```java
import com.jacob.activeX.ActiveXComponent;
import com.jacob.com.ComThread;

public class JacobTest {
    public static void main(String[] args) {
        System.setProperty("jacob.dll.path", "C:\\libs\\jacob-1.18-x64.dll");
        ComThread.InitSTA();

        try {
            ActiveXComponent app = new ActiveXComponent("Word.Application");
            System.out.println("检测到 Word 安装！");
            app.invoke("Quit");
        } catch (Exception e) {
            System.out.println("未检测到 Word：" + e.getMessage());
        } finally {
            ComThread.Release();
        }
    }
}
```

---

## 三、常见问题排查

| 问题描述                              | 解决方式                                                   |
| --------------------------------- | ------------------------------------------------------ |
| `java.lang.UnsatisfiedLinkError`  | Jacob DLL 未加载成功，确保 DLL 路径正确 & 位数一致                     |
| `Cannot create ActiveX component` | 未安装 Word 或注册表中缺失相关 COM 组件                              |
| Word 或 WPS 打开后不关闭                 | 确保调用了 `invoke("Quit")`，或 `Dispatch.call(doc, "Close")` |
| 不支持 headless Linux/macOS 系统       | Jacob 仅支持 Windows + COM，对 macOS/Linux 无效               |

---

## 四、代码实现

```java 
public void word2pf(String inputFile, String outputFile) {
	ActiveXComponent app = null;
	Dispatch doc = null;
	try {
		// 创建 WPS 应用对象
		// 优先尝试启动 Microsoft Word
		try {
			app = new ActiveXComponent("Word.Application");
			System.out.println("使用 Microsoft Word 进行转换");
		} catch (Exception e) {
			// 如果 Word 不可用，尝试 WPS
			System.out.println("Microsoft Word 未安装，尝试使用 WPS...");
			try {
				app = new ActiveXComponent("KWPS.Application");
				System.out.println("使用 WPS Office 进行转换");
			} catch (Exception ex) {
				throw new RuntimeException("未检测到 Word 或 WPS 安装！");
			}
		}

		// 显示或隐藏 WPS（false 为隐藏）
		app.setProperty("Visible", new Variant(false));
		app.setProperty("AutomationSecurity", new Variant(3));

		// 获取 Documents 集合
		Dispatch docs = app.getProperty("Documents").toDispatch();

		// 打开文档，参数：文件路径，是否只读
		doc = Dispatch.call(docs, "Open", inputFile, false, true).toDispatch();

		// Dispatch.call(doc, "ExportAsFixedFormat", outputFile, wdFormatPDF);
		Dispatch.call(doc, "ExportAsFixedFormat",
				outputFile,
				new Variant(17),   // wdExportFormatPDF
				new Variant(false), // OpenAfterExport
				new Variant(1),     // OptimizeFor
				new Variant(0),     // Range
				new Variant(1),     // From page
				new Variant(1),     // To page
				new Variant(0),     // Item
				new Variant(true),  // IncludeDocProps
				new Variant(true),  // KeepIRM
				new Variant(1),     // CreateBookmarks: 0=None, 1=Headings, 2=Bookmarks
				new Variant(true),  // DocStructureTags
				new Variant(true),  // BitmapMissingFonts
				new Variant(false)  // UseISO19005_1
		);

	} catch (Exception e) {
		e.printStackTrace();
	} finally {
		if (doc != null) {
			Dispatch.call(doc, "Close", false);
		}
		if (app != null) {
			app.invoke("Quit", 0);
		}
		ComThread.Release();
	}
}
```
---

### `ExportAsFixedFormat` 方法参数总览
以下是 Microsoft Word/WPS 的 COM 方法 `ExportAsFixedFormat` **所有参数的完整解释表**，对应 Jacob 中的 Java 调用顺序。

```java
Dispatch.call(doc, "ExportAsFixedFormat",
    outputFile,        // 1. OutputFileName
    new Variant(17),   // 2. ExportFormat
    new Variant(false),// 3. OpenAfterExport
    new Variant(1),    // 4. OptimizeFor
    new Variant(0),    // 5. Range
    new Variant(1),    // 6. From
    new Variant(9999), // 7. To
    new Variant(0),    // 8. Item
    new Variant(true), // 9. IncludeDocProps
    new Variant(true), // 10. KeepIRM
    new Variant(1),    // 11. CreateBookmarks
    new Variant(true), // 12. DocStructureTags
    new Variant(true), // 13. BitmapMissingFonts
    new Variant(false) // 14. UseISO19005_1
);
```
#### 每个参数详解

| 参数顺序 | 名称                   | 类型        | 示例值             | 含义说明                                                  |
| ---- | -------------------- | --------- | --------------- | ----------------------------------------------------- |
| 1    | `OutputFileName`     | `String`  | `"C:\\out.pdf"` | 输出文件路径                                                |
| 2    | `ExportFormat`       | `int`     | `17`            | `17` 表示导出为 PDF（`wdExportFormatPDF`）                   |
| 3    | `OpenAfterExport`    | `boolean` | `false`         | 是否导出后自动打开 PDF 文件                                      |
| 4    | `OptimizeFor`        | `int`     | `0` or `1`      | `0` = 屏幕阅读（较小体积）<br>`1` = 打印质量（高清）                    |
| 5    | `Range`              | `int`     | `0`             | 导出范围：<br>`0`=全部文档<br>`3`=指定页码范围（用 From 和 To）          |
| 6    | `From`               | `int`     | `1`             | 起始页码（当 Range=3 时生效）                                   |
| 7    | `To`                 | `int`     | `9999`          | 结束页码（Range=3 时生效）                                     |
| 8    | `Item`               | `int`     | `0`             | 导出对象：<br>`0`=正文（常用）<br>`1`=带批注                        |
| 9    | `IncludeDocProps`    | `boolean` | `true`          | 是否导出文档属性（如标题、作者）                                      |
| 10   | `KeepIRM`            | `boolean` | `true`          | 是否保留信息权限管理（IRM）                                       |
| 11   | `CreateBookmarks`    | `int`     | `0/1/2`         | PDF 中是否生成书签：<br>`0`=无<br>`1`=按标题生成<br>`2`=按已有 Word 书签 |
| 12   | `DocStructureTags`   | `boolean` | `true`          | 是否保留 PDF 的结构标签（用于可访问性）                                |
| 13   | `BitmapMissingFonts` | `boolean` | `true`          | 字体缺失时是否用位图代替                                          |
| 14   | `UseISO19005_1`      | `boolean` | `false`         | 是否输出为 PDF/A 标准格式（长期保存）                                |

**常用推荐配置（Java 中 Variant 写法）**

```java
new Variant(17),   // PDF
new Variant(false),// 不自动打开
new Variant(1),    // 打印优化（高清）
new Variant(0),    // 全部页面
new Variant(1),    // From
new Variant(9999), // To
new Variant(0),    // 正文内容
new Variant(true), // 包含文档属性
new Variant(true), // 保留 IRM
new Variant(1),    // 按标题生成书签
new Variant(true), // 文档结构标签
new Variant(true), // 缺字用位图
new Variant(false) // 不使用 PDF/A
```

#### 导出格式 new Variant(17), // wdExportFormatPDF
用于 `ExportAsFixedFormat` 方法的第二个参数，表示导出的文件格式。

**相关枚举值（仅供参考）：**
在使用 `ExportAsFixedFormat` 或 `SaveAs` 方法时，Microsoft Word 支持导出/保存为多种格式，下面是常见的两类格式枚举：

1. `ExportAsFixedFormat` 支持的导出格式（有限，仅两种）：

| 值  | 常量名                 | 描述           |
| -- | ------------------- | ------------ |
| 17 | `wdExportFormatPDF` | 导出为 PDF      |
| 18 | `wdExportFormatXPS` | 导出为 XPS（很少用） |

💡 适用于只做“固定版式导出”，如打印用 PDF。

2. `SaveAs` 支持的所有文件格式（非常丰富）

方法签名类似：

```java
Dispatch.call(doc, "SaveAs", path, fileFormatCode);
```

格式参数来自 `WdSaveFormat` 枚举：

| 值  | 常量名                             | 说明                           |
| -- | ------------------------------- | ---------------------------- |
| 0  | `wdFormatDocument`              | Word 97-2003 文档（`.doc`）      |
| 5  | `wdFormatRTF`                   | RTF 格式（`.rtf`）               |
| 6  | `wdFormatText`                  | 纯文本（`.txt`）                  |
| 7  | `wdFormatTextLineBreaks`        | 文本（带换行符）                     |
| 8  | `wdFormatDOSText`               | 纯文本 DOS 编码                   |
| 9  | `wdFormatDOSTextLineBreaks`     | DOS 文本（带换行符）                 |
| 10 | `wdFormatUnicodeText`           | Unicode 编码的文本                |
| 11 | `wdFormatHTML`                  | HTML 文件（`.html`）             |
| 12 | `wdFormatWebArchive`            | 单文件网页（`.mht`）                |
| 13 | `wdFormatFilteredHTML`          | 精简 HTML                      |
| 14 | `wdFormatXML`                   | Word 2003 XML（`.xml`）        |
| 15 | `wdFormatDocument97`            | Word 97 文档                   |
| 16 | `wdFormatDocumentDefault`       | Word 默认格式（`.docx`）           |
| 17 | `wdExportFormatPDF`             | PDF（`ExportAsFixedFormat`专用） |
| 18 | `wdExportFormatXPS`             | XPS（`ExportAsFixedFormat`专用） |
| 20 | `wdFormatFlatXML`               | 平面 XML（`.xml`）               |
| 24 | `wdFormatStrictOpenXMLDocument` | 严格标准的 `.docx` 文件             |

##### 核心区别总结

| 对比项             | `ExportAsFixedFormat`         | `SaveAs (PDF)`          |
| --------------- | ----------------------------- | ----------------------- |
| 是否专为 PDF/XPS 设计 | ✅ 是，专门导出 PDF/XPS              | ❌ 泛用保存方法，附带支持 PDF       |
| 书签/结构化标签支持      | ✅ 支持设置是否生成书签、结构标签             | ❌ 支持较弱或不可控              |
| 支持导出部分页数        | ✅ 支持导出页面范围（From/To）           | ❌ 只能导出整个文档              |
| 支持优化参数（屏幕/打印）   | ✅ 可以设置 PDF 优化方式（打印/屏幕）        | ❌ 不支持                   |
| 支持权限/安全控制（IRM）  | ✅ 可设置是否保留原 Word 权限保护          | ❌ 无相关设置                 |
| 操作细节控制          | ✅ 可设置是否嵌入结构标签、是否使用 PDF/A 等    | ❌ 无法控制                  |
| 支持格式            | 仅支持 PDF / XPS（格式代码 `17`、`18`） | 支持所有 Word 可保存格式（包括 PDF） |
| 推荐用于 PDF 导出？    | ✅ 推荐（完整控制）                    | ⚠️ 可用，但不推荐（功能弱）         |

##### 实战建议

你在做 Word → PDF 转换服务或批处理程序时：

* **99% 情况下都应该使用 `ExportAsFixedFormat`**
* 只有在生成 `.doc`、`.html`、`.txt` 时才使用 `SaveAs`


#### 保留文档的权限设置（如加密、限制编辑等） new Variant(true),  // KeepIRM
IRM 的全称是 **Information Rights Management**（信息权限管理），是 Microsoft Office 提供的一种**文档级别的权限控制技术**，用于防止**文档被未授权访问、复制、打印或转发**。

##### IRM 权限具体做什么？

启用 IRM 后，你可以对文档设置以下限制：

| 权限限制           | 描述                           |
| -------------- | ---------------------------- |
| 禁止复制内容         | 无法复制文档中的文本/图像                |
| 禁止打印           | 无法打印文档                       |
| 限定查看权限（只读）     | 某些人只能查看，不能编辑                 |
| 设置文档到期时间       | 到某个时间后无法再打开文档                |
| 指定可访问用户或用户组    | 只有指定用户可以打开（需登录 Microsoft 账户） |
| 防止转发/另存为/截图等操作 | 防止通过非授权方式传播内容                |

#### 与 PDF 导出时的 `KeepIRM` 参数关系

在 `ExportAsFixedFormat` 导出 PDF 的过程中：

* `KeepIRM = true` 表示：**如果 Word 文档本身启用了 IRM 权限，则在导出 PDF 时也保留这些权限（如果目标格式支持）**
* `KeepIRM = false` 表示：**导出 PDF 时忽略 IRM 设置，生成的 PDF 不带权限限制**

⚠️ 注意：**PDF 并不完全支持 Word 的 IRM 机制**，所以即便设置为 `true`，IRM 权限不一定能被 PDF 保留，具体依赖于 Word 和 Acrobat 等应用的处理方式。


**实际建议**

* **大多数情况下，你可以放心设为 `true`**（保留原始权限控制）
* 如果你明确希望导出为一个**无权限限制的 PDF 文件**，可以设为 `false`
* 如果 Word 文档未启用 IRM，这个参数无实际影响

#### 优化参数（OptimizeFor）

这是 `ExportAsFixedFormat` 方法的第 4 个参数，类型是 `WdExportOptimizeFor` 枚举，表示：

> **你希望导出的 PDF 优化的目标是“质量”还是“文件大小”**


**枚举值说明：**

| 值 | 名称                            | 含义说明                                             |
| - | ----------------------------- |--------------------------------------------------|
| 0 | `wdExportOptimizeForPrint`    | 为打印优化（**高质量、文件大**）, 图像和字体保留质量高，不压缩太多，适合印刷或存档使用   |
| 1 | `wdExportOptimizeForOnScreen` | 为屏幕阅读优化（**低质量、体积小**）, 更注重减小文件大小，可能压缩图像质量，适合网络传输  |


如果你需要同时控制 **图像分辨率、压缩算法、字体嵌入等更细粒度的导出设置**，那只能通过 Word 宏 或 PDF 处理库（如 PDFBox、iText）后处理。

#### 设置导出范围
```java
  new Variant(0),     // Range
  new Variant(1),     // From page
  new Variant(1),     // To page
```

##### 正确的设置方式

- 方式一：导出整个文档（推荐，最常用）

设置 `Range` 为 `0`（即 `wdExportAllDocument`），可以忽略 `From` 和 `To`，但保险起见也可以填写合法范围：

```java
new Variant(0),     // Range: 0=全部，1=页数范围
new Variant(1),     // FromPage（实际忽略）
new Variant(9999),  // ToPage（实际忽略）
```
这样写几乎能保证导出完整文档。


- 方式二：导出特定页范围（比如第2到第5页）

如果你只想导出部分页数：

```java
  new Variant(1),     // Range: 1=页数范围
  new Variant(2),     // FromPage
  new Variant(5),     // ToPage
```

**参考**

| 场景                 | Range | FromPage | ToPage | 效果          |
| ------------------ | ----- | -------- | ------ | ----------- |
| 导出整本文档             | 0     | 任意       | 任意     | 导出全部        |
| 导出第2到第5页           | 1     | 2        | 5      | 部分页         |
| 写 `1-999`（但页数只有10） | 1     | 1        | 999    | ✅ 自动裁剪至最后一页 |
