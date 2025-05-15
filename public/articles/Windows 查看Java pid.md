在 Windows 系统上查看 Java 进程的 PID（进程标识符），可以使用以下几种方法：

---

### **方法 1：使用 `jps` 命令（推荐）**
`jps`（Java Virtual Machine Process Status Tool）是 JDK 自带的工具，专门用于查看 Java 进程的 PID 和主类名。

1. **打开 CMD 或 PowerShell**
    - 按 `Win + R`，输入 `cmd` 或 `powershell`，回车。

2. **运行 `jps` 命令**
   ```cmd
   jps -l
   ```
    - `-l` 参数会显示完整的包名（主类名）。
    - 示例输出：
      ```
      1234 org.example.Main
      5678 sun.tools.jps.Jps
      ```
    - 第一列是 **PID**，第二列是主类名。

---

### **方法 2：使用 `tasklist` 命令**
`tasklist` 是 Windows 内置的命令，可以列出所有进程，包括 Java 进程。

1. **运行 `tasklist` 并过滤 Java 进程**
   ```cmd
   tasklist | findstr "java"
   ```
    - 示例输出：
      ```
      java.exe                     1234 Console                    1    1,234,560 K
      javaw.exe                    5678 Console                    1    1,345,678 K
      ```
    - 第二列 **PID** 就是 Java 进程的 ID。

---

### **方法 3：使用 `wmic` 命令**
`wmic` 是 Windows 管理工具，可以查询进程信息。

1. **查询 Java 进程的 PID**
   ```cmd
   wmic process where "name='java.exe'" get processid,commandline
   ```
    - 示例输出：
      ```
      CommandLine                                                                                     ProcessId
      "C:\Program Files\Java\jdk-17\bin\java.exe" -Xmx1024m -jar myapp.jar                           1234
      ```
    - `ProcessId` 列就是 PID。

---

### **方法 4：使用任务管理器（GUI）**
1. **打开任务管理器**
    - 按 `Ctrl + Shift + Esc` 或 `Ctrl + Alt + Del` → 选择 "任务管理器"。

2. **查找 Java 进程**
    - 切换到 **"详细信息"** 选项卡。
    - 查找 `java.exe` 或 `javaw.exe`。
    - **PID** 列就是进程 ID。

---

### **总结**
| 方法 | 命令 | 适用场景 |
|------|------|----------|
| **`jps`** | `jps -l` | **最推荐**，直接显示 Java 进程 PID 和主类名 |
| **`tasklist`** | `tasklist \| findstr "java"` | 通用方法，适用于所有 Windows 进程 |
| **`wmic`** | `wmic process where "name='java.exe'" get processid,commandline` | 可查看完整命令行 |
| **任务管理器** | GUI 操作 | 适合不熟悉命令行的用户 |

一般都是在 Linux 服务器中部署应用，开发使用 Mac 进行开发，比较少的会涉及到 Windows 系统的使用，特此记录下。