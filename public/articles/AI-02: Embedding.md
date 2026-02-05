# Embedding 详细解释

"Embedding"(嵌入和向量化)指的是将文本,图像等非结构化数据转换为高维数值向量的技术,是计算机能够理解和处理语义信息.
```java
// 文本  -> 向量
"猫" -> [0.2, -0.5, 0.8, 0.1, ....] // 假设是 1536 为度向量
"狗" -> [0.3, -0.4, 0.7, 0.2, ....]
"汽车" -> [0.9, 0.1, -0.6, 0.4, ....]

// 语义相近的词,向量也相似
余弦相似度("猫", "狗") = 0.95 // 很相似
余弦相似度("猫", "汽车") = 0.2 // 不相似
```
 
> 余弦公式: 
> $
\cos\theta = \frac{\text{邻边}}{\text{斜边}}
$
> 
> 公式中,余弦值越接近 1,表示两个向量夹角越小,语义越相似.

## 二、核心原理
### 1. **向量空间映射**

    原始文本： "我喜欢吃苹果"
            ↓ (Embedding 模型)
    向量表示： [0.12, -0.34, 0.56, ..., 0.78] (假设是 1536 维)

#### 2. **语义相似度计算**
通过计算向量之间的距离或夹角,衡量文本间的语义相似度.
- **余弦相似度**：衡量两个向量夹角的余弦值.
- **欧氏距离**：衡量两个向量在空间中的距离.
```javascript
// 余弦相似度计算示例
function cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
}
// 结果范围[-1, 1], 越接近 1 表示越相似
// 1.0 - 完全相同
// 0.0 - 无相似性
// -1.0 - 完全相反
```

## 三、主流的 Embedding 模型
1.**OpenAI Embedding**
```java
// text-embedding-3-small (1536 维)
// text-embedding-3-large (3072 维)
// text-embedding-ada-002 (1536 维，旧版)

@Service
public class OpenAIEmbeddingService {
    
    public double[] getEmbedding(String text) {
        // 调用 OpenAI API
        EmbeddingRequest request = EmbeddingRequest.builder()
            .model("text-embedding-3-small")
            .input(text)
            .build();
            
        EmbeddingResponse response = openAiService.createEmbeddings(request);
        return response.getData().get(0).getEmbedding();
    }
}
```
2. 本地开源模型
```text
// BGE (BAAI General Embedding) - 中文友好
// bge-small-zh-v1.5 (512 维)
// bge-large-zh-v1.5 (1024 维)

// all-MiniLM-L6-v2 (384 维) - 英文
// sentence-transformers/paraphrase-multilingual (768 维) - 多语言
```
3. 向量维度对比

| 模型名称                        | 维度数  | 语言支持       | 优势| 
|-------------------------------|--------|----------------|-----|
| text-embedding-3-small        | 1536   | 多语言         | 通用性强，适合多种任务 |
| text-embedding-3-large        | 3072   | 多语言         | 更高精度，适合复杂任务 |
| bge-small-zh-v1.5            | 512    | 中文           | 轻量级，适合资源受限环境 |
| bge-large-zh-v1.5            | 1024   | 中文         | 平衡性能与资源消耗 |
| all-MiniLM-L6-v2              | 384    | 英文           | 速度快，适合实时应用 |
| sentence-transformers/paraphrase-multilingual | 768    | 多语言         | 多语言支持，适合跨语言任务 |

## 四、应用场景
1. **语义搜索**：通过向量相似度检索相关文档
```java
@Service
public class SemanticSearchService {
    
    @Autowired
    private VectorDatabase vectorDatabase;
    // 存储文档
    public void indexDocument(String docId, String content) {
        double[] embedding = embeddingService.getEmbedding(content);
        vectorDatabase.storeVector(docId, embedding);
    }
    // 语义搜索
    public List<SearchResult> search(String query, int topK) {
        double[] queryEmbedding = embeddingService.getEmbedding(query);
        return vectorDatabase.searchSimilarVectors(queryEmbedding, topK);
    }
}
// 使用示例
// 查询 "如何照顾宠物"
// 能匹配到：养猫的注意事项，狗狗饲养指南（即使没有宠物这个词也能匹配到）
```
2. RGA（Retrieval-Augmented Generation）：结合向量检索和生成模型,提升回答准确性.
```javascript
@Service 
public class RAGService {
    
    public String generateAnswer(String question) {
        // 第一步：将问题向量化
        double[] questionEmbedding = embeddingService.getEmbedding(question);
        // 第二步：语义搜索相关文档
        List<Document> relevantDocs = searchService.search(questionEmbedding, 5);
        
        // 第三步：构建上下文
        String context = relevantDocs.stream()
            .map(Document::getContent)
            .collect(Collectors.joining("\n\n"));
        
        // 第四步：让LLM基于上下文生成答案
        String prompt = String.format("""
            基于以下上下文回答问题:
            
            上下文:
            %s
            
            问题: %s
        """, context, question);
        return llmService.chat(prompt);
    }
}
```
3. 文本分类
```javascript
public String classifyText(String text) {
    double[] embedding = embeddingService.getEmbedding(text);
    // 预定义的分类别的 Embedding
    Map<String, double[]> categoryEmbeddings = Map.of(
        "科技", embeddingService.getEmbedding("科技 技术 软件 硬件"),
        "体育", embeddingService.getEmbedding("体育 运动 比赛 健身"),
        "财经", embeddingService.getEmbedding("财经 金融 股票 经济")
    );
    // 找到最相似的类别
    String bestCategory = null;
    double highestSimilarity = -1;
    for (Map.Entry<String, double[]> entry : categoryEmbeddings.entrySet()) {
        double similarity = cosineSimilarity(embedding, entry.getValue());
        if (similarity > highestSimilarity) {
            highestSimilarity = similarity;
            bestCategory = entry.getKey();
        }
    }
    return bestCategory;
}
```
4. 推荐系统：基于用户和物品的向量相似度进行推荐.
```java
public List<Item> recommendItems(String userId, int topK) {
    // 获取用户的历史行为
    List<String> userHistory = userService.getUserHistory(userId);
    // 生成用户兴趣向量（多个 embedding 的平均值）
    double[] historyEmbeddings = userHistory.stream()
        .map(itemService::getItemEmbedding)
        .reduce(new double[embeddingDim], (a, b) -> addVectors(a, b));
    // 归一化用户向量
    double[] userEmbedding = normalizeVector(historyEmbeddings);
    // 在物品库中搜索相似物品
    return itemService.searchSimilarItems(userEmbedding, topK);
}
```
5. 去重/聚类
```java
public List<List<String>> deduplicateDocuments(List<String> documents, double threshold) {
    // 1. 计算所有文档的 Embedding
    List<DocWithEmbedding> docsWithEmbeddings = documents.stream()
      .map(doc -> new DocWithEmbedding(doc, embeddingService.getEmbedding(doc)))
      .collect(Collectors.toList());
    // 2. 聚类
    List<List<String>> clusters = new ArrayList<>();
    Set<Integer> visited = new HashSet<>();
    
    for (int i = 0; i < docsWithEmbeddings.size(); i++) {
        if (visited.contains(i)) continue;
        List<String> cluster = new ArrayList<>();
        cluster.add(docsWithEmbeddings.get(i).getDoc());
        visited.add(i);
        
        for (int j = i+1; j < docsWithEmbeddings.size(); j++) {
            if (visited.contains(i)) continue;
            double similarity = cosineSimilarity(docsWithEmbeddings.get(i).getEmbedding(), docsWithEmbeddings.get(j).getEmbedding());
            if (similarity > threshold) {
                cluster.add(docsWithEmbeddings.get(j));
                visited.add(j);
            }
        }
        clusters.add(cluster);
    }
    return clusters;
} 
```
















