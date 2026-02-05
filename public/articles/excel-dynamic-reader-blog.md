# 基于EasyExcel的动态列映射读取方案

在企业级应用开发中，Excel文件的导入导出是一个常见需求。然而，现实场景中的Excel文件往往存在表头不规范、列名称多样化等问题，传统的固定列映射方式难以应对这些挑战。
本文将介绍一个基于阿里巴巴EasyExcel框架的动态列映射解决方案，它能够通过正则表达式模式匹配，灵活地处理各种复杂的Excel表头场景。

## 一、背景与痛点

在处理Excel数据导入时，我们经常会遇到以下问题：

1. **表头名称不统一**：同一个字段在不同Excel文件中可能有多种命名方式
2. **列顺序不确定**：相同的数据列在不同文件中的顺序可能不同
3. **字段名称包含特殊字符**：如空格、括号、特殊符号等

传统的解决方案要么要求用户严格按照模板填写，要么需要为每种格式编写不同的解析代码，这都大大降低了系统的灵活性和用户体验。

## 二、技术方案设计

### 2.1 核心思路

我的解决方案基于以下核心思路：

1. **使用正则表达式匹配表头**：通过配置正则表达式模式来识别不同命名的同一字段
2. **动态建立列索引映射**：在读取表头时动态建立字段名与列索引的映射关系
3. **反射赋值**：通过反射机制将单元格数据动态赋值给对象属性

### 2.2 技术栈选择

- **EasyExcel**：阿里巴巴开源的Excel处理框架，具有低内存占用、高性能的特点
- **Java反射**：用于动态设置对象属性值
- **正则表达式**：用于灵活匹配各种表头名称

## 三、核心实现详解

### 3.1 自定义监听器 - ExcelListener

```java
public class ExcelListener<T> extends AnalysisEventListener<T> {
    private List<T> dataList = new ArrayList<>();
    private Map<String, List<Pattern>> patternMap = new HashMap<>();
    private Map<String, Integer> fieldIndexMap = new HashMap<>();
}
```

ExcelListener是整个方案的核心组件，它继承自EasyExcel的AnalysisEventListener，主要包含三个关键数据结构：

- **dataList**：存储解析后的数据对象列表
- **patternMap**：存储字段名与正则表达式模式的映射关系
- **fieldIndexMap**：存储字段名与列索引的映射关系

### 3.2 表头解析与映射建立

```java
@Override
public void invokeHeadMap(Map<Integer, String> headMap, AnalysisContext context) {
    for (Map.Entry<Integer, String> head : headMap.entrySet()) {
        Integer index = head.getKey();
        String value = head.getValue();
        if (Strings.isNotBlank(value)) {
            for (Map.Entry<String, List<Pattern>> patternEntry : patternMap.entrySet()) {
                String fieldName = patternEntry.getKey();
                List<Pattern> patterns = patternEntry.getValue();
                for (Pattern pattern : patterns) {
                    if (pattern.matcher(value).matches()) {
                        fieldIndexMap.put(fieldName, index);
                        break;
                    }
                }
            }
        }
    }
}
```

这个方法是动态映射的关键。当EasyExcel读取到表头行时，会调用此方法：

1. 遍历每个表头单元格
2. 对每个单元格的值，尝试与配置的正则表达式进行匹配
3. 匹配成功则建立字段名与列索引的映射关系

### 3.3 数据行解析与对象赋值

```java
@Override
public void invoke(T t, AnalysisContext context) {
    for (Map.Entry<String, Integer> entry : fieldIndexMap.entrySet()) {
        String key = entry.getKey();
        Integer index = entry.getValue();
        CellData cellData = (CellData) context.readRowHolder().getCellMap().get(index);
        Object value = getCellValue(cellData);
        ReflectionUtils.setFieldValue(t, key, value);
    }
    dataList.add(t);
}
```

对于每一行数据：

1. 根据之前建立的字段映射关系，获取对应列的数据
2. 通过反射将数据设置到对象的相应属性中
3. 将完成赋值的对象添加到结果列表中

### 3.4 使用示例

```java
public static void main(String[] args) {
    // 配置字段与正则表达式的映射关系
    HashMap<String, List<String>> patternMap = new HashMap<>();
    patternMap.put("auditGroup", ListUtil.of(".*专业审核分组.*"));
    
    // 创建监听器
    ExcelListener<SubjectInfoExcelDTO> readListener = new ExcelListener<>(patternMap);
    
    // 读取Excel文件
    EasyExcel.read("path/to/excel.xlsx", SubjectInfoExcelDTO.class, readListener)
            .sheet()
            .headRowNumber(3)  // 指定表头所在行
            .doRead();
    
    // 获取解析结果
    List<SubjectInfoExcelDTO> dataList = readListener.getDataList();
}
```

## 四、方案优势

### 4.1 高度灵活性

通过正则表达式配置，可以轻松应对各种表头命名不规范的情况。例如，"专业审核分组"字段可能在不同Excel中表现为：
- "专业审核分组"
- "2025年专业审核分组"
- "【专业审核分组】"
- "专业审核分组(必填)"

只需配置一个正则表达式`.*专业审核分组.*`即可匹配所有情况。

### 4.2 易于扩展

新增字段映射只需要在patternMap中添加配置即可，无需修改核心代码：

```java
patternMap.put("projectName", ListUtil.of(".*项目名称.*", ".*工程名称.*"));
patternMap.put("expertName", ListUtil.of(".*专家姓名.*", ".*评委姓名.*"));
```

### 4.3 性能优异

- 基于EasyExcel的流式读取，内存占用低
- 正则表达式在初始化时预编译，运行时效率高
- 使用反射缓存机制，避免重复的反射操作

### 4.4 错误处理友好

通过getCellValue方法统一处理不同类型的单元格数据，避免类型转换异常：

```java
private Object getCellValue(CellData cellData) {
    switch (cellData.getType()) {
        case STRING:
            return cellData.getStringValue();
        case BOOLEAN:
            return cellData.getBooleanValue();
        case NUMBER:
            return cellData.getNumberValue();
        default:
            throw new RuntimeException("不支持的单元格类型: " + cellData.getType());
    }
}
```

## 五、最佳实践建议

1. **合理设计正则表达式**：避免过于宽泛的匹配模式，防止误匹配
2. **提供模板下载**：虽然系统支持灵活匹配，但仍建议提供标准模板
3. **日志记录**：记录匹配失败的列名，便于后续优化正则表达式
4. **数据验证**：在数据入库前进行必要的数据验证
5. **性能监控**：对于大文件导入，建议添加进度提示和性能监控

## 六、总结

本文介绍的基于EasyExcel的动态列映射方案，通过正则表达式匹配和反射机制，优雅地解决了Excel导入中表头不规范的问题。这个方案不仅提高了系统的灵活性和用户体验，还保持了良好的性能和可维护性。

在实际项目中，这种方案已经成功应用于多个企业级系统，大大减少了因Excel格式问题导致的数据导入失败，提升了数据处理的效率。希望这个方案能为遇到类似问题的开发者提供参考和借鉴。

未来，我们还可以在此基础上进行以下优化：

1. **智能列名推断**：使用机器学习算法自动推断列名映射
2. **配置可视化**：提供Web界面进行正则表达式配置
3. **错误自动修复**：对常见的格式错误进行自动修复
4. **多格式支持**：扩展支持CSV、TSV等其他表格格式

通过不断的优化和完善，相信这个方案能够为更多的开发者和用户带来便利。

## ExcelListener 源码
```java 
public class ExcelListener<T> extends AnalysisEventListener<T> {
	private List<T> dataList = new ArrayList<>();
	public List<T> getDataList() {
		return dataList;
	}
	private Map<String, List<Pattern>> patternMap = new HashMap<>();
	public ExcelListener() {}

	public ExcelListener(Map<String, List<String>> patternMap) {
		for (Map.Entry<String, List<String>> entry : patternMap.entrySet()) {
			String key = entry.getKey();
			List<String> patterns = entry.getValue();
			List<Pattern> compiledPatterns = patterns.stream()
					.map(Pattern::compile)
					.collect(Collectors.toList());
			this.patternMap.put(key, compiledPatterns);
		}
	}
	Map<String, Integer> fieldIndexMap = new HashMap<>();
	@Override
	public void invoke(T t, AnalysisContext context) {
		for (Map.Entry<String, Integer> entry : fieldIndexMap.entrySet()) {
			String key = entry.getKey();
			Integer index = entry.getValue();
			CellData cellData = (CellData) context.readRowHolder().getCellMap().get(index);
			Object value = getCellValue(cellData);
			ReflectionUtils.setFieldValue(t, key,value);
		}
		dataList.add(t);
	}
	private Object getCellValue(CellData cellData) {
		switch (cellData.getType()) {
			case STRING:
				return cellData.getStringValue();
			case BOOLEAN:
				return cellData.getBooleanValue();
			case NUMBER:
				return cellData.getNumberValue();
			default:
				throw new RuntimeException("不支持的单元格类型: " + cellData.getType());
		}
	}

	@Override
	public void invokeHeadMap(Map<Integer, String> headMap, AnalysisContext context) {
		for (Map.Entry<Integer, String> head : headMap.entrySet()) {
			Integer index = head.getKey();
			String value = head.getValue();
			if (Strings.isNotBlank(value)) {
				for (Map.Entry<String, List<Pattern>> patternEntry : patternMap.entrySet()) {
					String fieldName = patternEntry.getKey();
					List<Pattern> patterns = patternEntry.getValue();
					for (Pattern pattern : patterns) {
						if (pattern.matcher(value).matches()) {
							fieldIndexMap.put(fieldName, index);
							break;
						}
					}
				}
			}
		}
	}

	@Override
	public void doAfterAllAnalysed(AnalysisContext analysisContext) {

	}
}
```