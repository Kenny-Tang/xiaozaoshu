# `hosts` 修改工具

## 需求
>开发一个更新 windows hosts 配置的程序要求如下：
>1. 可以查看现有的配置
>2. 带有GUI界面
>3. 用户可以添加或修改配置

## 打包过程
- 1. 编译代码 
> javac -encoding UTF-8 HostsEditor.java
- 2. 打包文件
> jar --create --file HostsEditor.jar --main-class HostsEditor HostsEditor.class
- 3. 打包为可执行文件 
```shell
jpackage `
  --input . `
--name HostsEditor `
  --main-jar HostsEditor.jar `
--main-class HostsEditor `
  --type exe `
--win-shortcut `
  --win-menu `
--win-dir-chooser `
  --win-menu-group "HostsEditor工具" `
--icon xiaozaoshu.ico `
--win-requested-execution-level requireAdministrator
```

## 源码
```java
/**
 * javac -encoding UTF-8 HostsEditor.java
 * jar --create --file HostsEditor.jar --main-class HostsEditor HostsEditor.class
 * jpackage --input . --name HostsEditor --main-jar HostsEditor.jar --main-class HostsEditor --type exe
 */
public class HostsEditor extends JFrame {
    private static final String HOSTS_PATH;
    private static final String sysEncoding;
    static {
        String os = System.getProperty("os.name").toLowerCase();
        if (os.contains("win")) {
            sysEncoding = "GBK";
            HOSTS_PATH = "C:\\Windows\\System32\\drivers\\etc\\hosts";
        } else {
            HOSTS_PATH = "/etc/hosts";
            sysEncoding = "UTF-8";
        }
    }

    private final DefaultTableModel tableModel;

    public HostsEditor() {
        setTitle("Hosts 配置编辑器");
        setSize(700, 400);
        setDefaultCloseOperation(EXIT_ON_CLOSE);
        setLocationRelativeTo(null);

        String[] columnNames = {"IP 地址", "域名"};
        tableModel = new DefaultTableModel(columnNames, 0);
        JTable table = new JTable(tableModel);

        JScrollPane scrollPane = new JScrollPane(table);
        add(scrollPane, BorderLayout.CENTER);

        // 控制按钮区域
        JPanel buttonPanel = new JPanel();
        JTextField ipField = new JTextField(12);
        JTextField domainField = new JTextField(20);
        JButton addBtn = new JButton("添加");
        JButton deleteBtn = new JButton("删除选中行");
        JButton saveBtn = new JButton("保存到 hosts");
        JButton refreshBtn = new JButton("刷新");

        buttonPanel.add(new JLabel("IP:"));
        buttonPanel.add(ipField);
        buttonPanel.add(new JLabel("域名:"));
        buttonPanel.add(domainField);
        buttonPanel.add(addBtn);
        buttonPanel.add(deleteBtn);
        buttonPanel.add(saveBtn);
        buttonPanel.add(refreshBtn);

        add(buttonPanel, BorderLayout.SOUTH);

        // 事件处理
        addBtn.addActionListener(e -> {
            String ip = ipField.getText().trim();
            String domain = domainField.getText().trim();
            if (ip.isEmpty() || domain.isEmpty()) {
                JOptionPane.showMessageDialog(this, "IP 和域名不能为空");
                return;
            }
            if (!isValidIPv4(ip)) {
                JOptionPane.showMessageDialog(this, "请输入有效的 IPv4 地址");
                return;
            }
            tableModel.addRow(new Object[]{ip, domain});
            ipField.setText("");
            domainField.setText("");
        });

        deleteBtn.addActionListener(e -> {
            int selected = table.getSelectedRow();
            if (selected >= 0) {
                tableModel.removeRow(selected);
            }
        });

        saveBtn.addActionListener(e -> saveToHosts());
        refreshBtn.addActionListener(e -> {
            tableModel.setRowCount(0);
            loadHosts();
        });

        loadHosts();
    }

    private void loadHosts() {
        try {
            List<String> lines = Files.readAllLines(new File(HOSTS_PATH), Charset.forName(sysEncoding));

            for (String line : lines) {
                line = line.trim();
                if (line.startsWith("#") || line.isEmpty()) continue;
                String[] parts = line.split("\\s+");
                if (parts.length >= 2) {
                    tableModel.addRow(new Object[]{parts[0], parts[1]});
                }
            }
        } catch (IOException e) {
            System.err.println(e);
            JOptionPane.showMessageDialog(this, "读取 hosts 文件失败:\n" + e.getMessage(), "错误", JOptionPane.ERROR_MESSAGE);
        }
    }

    private void backupHosts() throws IOException {
        File original = new File(HOSTS_PATH);
        if (original.exists()) {
            File backup = new File(HOSTS_PATH + ".bak_" + System.currentTimeMillis());
            Files.copy(original.toPath(), backup.toPath(), StandardCopyOption.REPLACE_EXISTING);
        }
    }

    private void saveToHosts() {
        try {
            backupHosts(); // 备份原文件
            try (BufferedWriter writer = new BufferedWriter(new FileWriter(HOSTS_PATH))) {
                writer.write("# 修改于 Java HostsEditor\n");
                for (int i = 0; i < tableModel.getRowCount(); i++) {
                    String ip = tableModel.getValueAt(i, 0).toString();
                    String domain = tableModel.getValueAt(i, 1).toString();
                    writer.write(String.format("%-15s %s%n", ip, domain));
                }
            }
            JOptionPane.showMessageDialog(this, "✅ Hosts 文件保存成功！");
        } catch (IOException e) {
            JOptionPane.showMessageDialog(this,
                    "保存失败，请确保以管理员权限运行程序。\n" + e.getMessage(), "错误", JOptionPane.ERROR_MESSAGE);
        }
    }

    private boolean isValidIPv4(String ip) {
        String pattern = "^((25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]?\\d)(\\.|$)){4}$";
        return ip.matches(pattern);
    }

    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> new HostsEditor().setVisible(true));
    }
}

```