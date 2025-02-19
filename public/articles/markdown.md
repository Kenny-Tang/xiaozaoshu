
# 折叠代码块

    <details>
      <summary>折叠时显示的标题</summary>
    
    ```java
    System.out.println("Hello world！");
    ```
    </details>

```text
# <summary></summary>标签下要空一行
```

# pandoc 使用

## 生成html

    pandoc 开发及上线规范.md -o 开发及上线规范.html -M charset="utf-8" --standalone

## 生成docx

    pandoc 开发及上线规范.md -o 开发及上线规范.docx