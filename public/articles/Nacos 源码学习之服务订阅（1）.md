因为笔者学习使用的demo 项目是搭建的 Spring Cloud 微服务项目，在 ApiGateway 中配置了微服务项目的路由转发。
# 服务订阅
## 客户端逻辑
Spring Cloud Gateway 在启动的时候会调用服务发现的接口，查找路由配置的服务信息，如果使用的是Nacos作为注册中心，则会执行该方法进行处理 `NacosReactiveDiscoveryClient#getInstances`

```java
	public Flux<ServiceInstance> getInstances(String serviceId) {

		return Mono.justOrEmpty(serviceId).flatMapMany(loadInstancesFromNacos()) // 加载实例
				.subscribeOn(Schedulers.boundedElastic());
	}
```
在这个方法中，`loadInstancesFromNacos()` 是一个函数式接口，它会返回一个 `Function<String, Flux<ServiceInstance>>`，用于从 Nacos 中加载服务实例。

```java
	private Function<String, Publisher<ServiceInstance>> loadInstancesFromNacos() {
		return serviceId -> {
			try {
				return Mono.justOrEmpty(serviceDiscovery.getInstances(serviceId)) // 获取服务实例列表
						.flatMapMany(instances -> {
							ServiceCache.setInstances(serviceId, instances);  // 缓存服务实例
							return Flux.fromIterable(instances);
						});
			}
			catch (NacosException e) {
				...... // 省略异常处理
			}
		};
	}
```
这里会将获取到的服务实例信息缓存到 `Map<String, List<ServiceInstance>> instancesMap` 方使用。

在 `NacosReactiveDiscoveryClient#getInstances` 方法中会调用 `NacosServiceDiscovery#getInstances` 方法获取服务实例列表。

```java
	public List<ServiceInstance> getInstances(String serviceId) throws NacosException {
		String group = discoveryProperties.getGroup();
		List<Instance> instances = namingService().selectInstances(serviceId, group,
				true);
		return hostToServiceInstanceList(instances, serviceId);
	}
```

在 `NacosServiceDiscovery#getInstances` 方法中会调用 `NacosNamingService#selectInstances` 方法获取服务实例列表。

```java
    public List<Instance> selectInstances(String serviceName, String groupName, List<String> clusters, boolean healthy, 
                boolean subscribe) throws NacosException {
        
        ServiceInfo serviceInfo;
        String clusterString = StringUtils.join(clusters, ",");
        if (subscribe) {
            serviceInfo = serviceInfoHolder.getServiceInfo(serviceName, groupName, clusterString);
            if (null == serviceInfo) {
                // 通过订阅获取服务实例
                serviceInfo = clientProxy.subscribe(serviceName, groupName, clusterString);
            }
        } else {
            serviceInfo = clientProxy.queryInstancesOfService(serviceName, groupName, clusterString, 0, false);
        }
        return selectInstances(serviceInfo, healthy);
    }
```

在 `NacosNamingService#selectInstances` 方法中会调用 `clientProxy.subscribe` 方法获取服务实例列表, 如果没有订阅过在调用 `grpcClientProxy.subscribe` 通过 gRPC 客户端订阅服务。

```java
    public ServiceInfo subscribe(String serviceName, String groupName, String clusters) throws NacosException {
        NAMING_LOGGER.info("[SUBSCRIBE-SERVICE] service:{}, group:{}, clusters:{} ", serviceName, groupName, clusters);
        String serviceNameWithGroup = NamingUtils.getGroupedName(serviceName, groupName);
        String serviceKey = ServiceInfo.getKey(serviceNameWithGroup, clusters);
        serviceInfoUpdateService.scheduleUpdateIfAbsent(serviceName, groupName, clusters);
        ServiceInfo result = serviceInfoHolder.getServiceInfoMap().get(serviceKey);
        if (null == result || !isSubscribed(serviceName, groupName, clusters)) {
            result = grpcClientProxy.subscribe(serviceName, groupName, clusters);// 通过 gRPC 客户端订阅服务
        }
        serviceInfoHolder.processServiceInfo(result);
        return result;
    }
```

在 `grpcClientProxy.subscribe` 最终实现方法如下，将订阅请求信息封装成 `SubscribeServiceRequest` 请求服务端进行处理。

```java
    public ServiceInfo doSubscribe(String serviceName, String groupName, String clusters) throws NacosException {
        SubscribeServiceRequest request = new SubscribeServiceRequest(namespaceId, groupName, serviceName, clusters,
                true);
        SubscribeServiceResponse response = requestToServer(request, SubscribeServiceResponse.class);
        redoService.subscriberRegistered(serviceName, groupName, clusters);
        return response.getServiceInfo();
    }
```
接下来，服务端会处理这个订阅请求，并将服务实例信息返回给客户端。

## 服务端逻辑

在 `NacosGrpcServer` 中会处理客户端的订阅请求，具体的处理类为 `SubscribeServiceRequestHandler#handle`。

```java
    public SubscribeServiceResponse handle(SubscribeServiceRequest request, RequestMeta meta) throws NacosException {
        String namespaceId = request.getNamespace();
        String serviceName = request.getServiceName();
        String groupName = request.getGroupName();
        String app = RequestContextHolder.getContext().getBasicContext().getApp();
        String groupedServiceName = NamingUtils.getGroupedName(serviceName, groupName);
        Service service = Service.newService(namespaceId, groupName, serviceName, true);
        Subscriber subscriber = new Subscriber(meta.getClientIp(), meta.getClientVersion(), app, meta.getClientIp(),
                namespaceId, groupedServiceName, 0, request.getClusters());
        // 获取服务实例信息
        ServiceInfo serviceInfo = ServiceUtil.selectInstancesWithHealthyProtection(serviceStorage.getData(service),
                metadataManager.getServiceMetadata(service).orElse(null), subscriber.getCluster(), false, true,
                subscriber.getIp());
        if (request.isSubscribe()) {
            clientOperationService.subscribeService(service, subscriber, meta.getConnectionId());
            NotifyCenter.publishEvent(new SubscribeServiceTraceEvent(System.currentTimeMillis(),
                    NamingRequestUtil.getSourceIpForGrpcRequest(meta), service.getNamespace(), service.getGroup(),
                    service.getName()));
        } else {
            clientOperationService.unsubscribeService(service, subscriber, meta.getConnectionId());
            NotifyCenter.publishEvent(new UnsubscribeServiceTraceEvent(System.currentTimeMillis(),
                    NamingRequestUtil.getSourceIpForGrpcRequest(meta), service.getNamespace(), service.getGroup(),
                    service.getName()));
        }
        return new SubscribeServiceResponse(ResponseCode.SUCCESS.getCode(), "success", serviceInfo);
    }
```

`ServiceInfo serviceInfo = ServiceUtil.selectInstancesWithHealthyProtection(serviceStorage.getData(service),
metadataManager.getServiceMetadata(service).orElse(null), subscriber.getCluster(), false, true,
subscriber.getIp())` 这行代码会获取服务实例信息，

`serviceStorage.getData(service)` 从 `ConcurrentMap<Service, ServiceInfo> serviceDataIndexes` 获取服务的信息，
`metadataManager.getServiceMetadata(service)` 从 `ConcurrentMap<Service, ServiceMetadata> serviceMetadataMap` 获取服务的元数据信息。

`selectInstancesWithHealthyProtection` 方法会根据服务实例的健康状态进行过滤，并返回符合条件的服务实例列表。

最后，如果当前的请求是一个服务订阅的请求，则会发布一个服务订阅事件 `ClientOperationEvent.ClientSubscribeServiceEvent(singleton, clientId)`。

### ClientOperationEvent.ClientSubscribeServiceEvent
`ClientOperationEvent.ClientSubscribeServiceEvent` 事件是一个客户端操作事件，它在客户端注册服务时发布。这个事件的处理逻辑主要在 `ClientServiceIndexesManager` 中实现。

```java
    // 订阅服务事件处理
    if (event instanceof ClientOperationEvent.ClientSubscribeServiceEvent) {
        addSubscriberIndexes(service, clientId); // 添加订阅者索引
    }
    
    // 处理逻辑 
    private void addSubscriberIndexes(Service service, String clientId) {
        // 将订阅者的 clientId 添加到订阅者索引集合中
        Set<String> clientIds = subscriberIndexes.computeIfAbsent(service, key -> new ConcurrentHashSet<>());
        if (clientIds.add(clientId)) {
            // 如果是第一次订阅，发送服务被订阅的事件
            NotifyCenter.publishEvent(new ServiceEvent.ServiceSubscribedEvent(service, clientId));
        }
    }
```

把订阅者的 `clientId` 添加进订阅者索引集合  `ConcurrentMap<Service, Set<String>>`  ***`subscriberIndexes`***

第一次订阅还会发送一个 `ServiceEvent.ServiceSubscribedEvent` 服务被订阅的事件， 

### ServiceEvent.ServiceSubscribedEvent

`ServiceEvent.ServiceSubscribedEvent` 事件是一个服务事件，它在服务被订阅时发布。这个事件的处理逻辑主要在 `NamingSubscriberServiceV2Impl` 中实现。

```java
    @Override
    public void onEvent(Event event) {
        if (event instanceof ServiceEvent.ServiceChangedEvent) {
            // 🔴 如果 Service 发生变化，则通知所有的订阅者
            ServiceEvent.ServiceChangedEvent serviceChangedEvent = (ServiceEvent.ServiceChangedEvent) event;
            Service service = serviceChangedEvent.getService();
            delayTaskEngine.addTask(service, new PushDelayTask(service, PushConfig.getInstance().getPushTaskDelay()));
            MetricsMonitor.incrementServiceChangeCount(service);
        } else if (event instanceof ServiceEvent.ServiceSubscribedEvent) {
            // 🔴 如果是某个客户端的订阅事件，则仅通知该客户端 Service 相关的信息
            ServiceEvent.ServiceSubscribedEvent subscribedEvent = (ServiceEvent.ServiceSubscribedEvent) event;
            Service service = subscribedEvent.getService();
            delayTaskEngine.addTask(service, new PushDelayTask(service, PushConfig.getInstance().getPushTaskDelay(),
                    subscribedEvent.getClientId()));
        }
    }
```
`PushDelayTask` 是一个延迟任务，它会在指定的延迟时间后执行。`delayTaskEngine.addTask(...)` 方法会将这个任务添加到 `NacosDelayTaskExecuteEngine` 中进行调度。

接下来我们从源码角度 **一步步揭示 `NacosDelayTaskExecuteEngine` 的调度原理**。

---

## 一、`NacosDelayTaskExecuteEngine` 简介

`NacosDelayTaskExecuteEngine` 是 Nacos 中用于处理延迟任务的核心调度器，类定义大致如下：

```java
    public PushDelayTaskExecuteEngine(ClientManager clientManager, ClientServiceIndexesManager indexesManager,
                                      ServiceStorage serviceStorage, NamingMetadataManager metadataManager,
                                      PushExecutor pushExecutor, SwitchDomain switchDomain) {
        super(PushDelayTaskExecuteEngine.class.getSimpleName(), Loggers.PUSH);
        this.clientManager = clientManager;
        this.indexesManager = indexesManager;
        this.serviceStorage = serviceStorage;
        this.metadataManager = metadataManager;
        this.pushExecutor = pushExecutor;
        this.switchDomain = switchDomain;
        setDefaultTaskProcessor(new PushDelayTaskProcessor(this));
    }
```

`PushDelayTaskProcessor` 是一个任务处理器，用于处理 `PushDelayTask` 类型的任务。 在这之上的参数为会使用到数据服务的实现方法。

---

## 二、任务调度逻辑在哪？

核心逻辑在 `AbstractDelayTaskExecuteEngine` 里：

### 1. 构造方法中启动了调度线程：

```java
public AbstractDelayTaskExecuteEngine(String name, Logger logger) {
    this.name = name;
    this.logger = logger;

    this.processingExecutor = ExecutorFactory.newSingleScheduledExecutorService(className); // 创建调度线程
    this.processingExecutor.scheduleWithFixedDelay(this::processTasks, 1000, 500, TimeUnit.MILLISECONDS);
}
```

* `ExecutorFactory.newSingleScheduledExecutorService(...)`：创建了一个 **单线程调度器**
* `scheduleWithFixedDelay(...)`：每 500 毫秒调用一次 `processTasks()` 方法，首次延迟 1 秒

---

### 2. `processTasks()` 方法干什么？

这个方法会遍历所有任务，根据任务的延迟时间判断是否到期，若到期则执行：

 - 获取所有任务的键集合 `Collection<Object> keys = getAllTaskKeys();`
 - 查找任务的实际处理器 `NacosTaskProcessor processor = getProcessor(taskKey)`
 - 处理任务 `processor.process(task)`，如果处理失败则重试 `retryFailedTask(taskKey, task)`。

这里实际的处理器为： `PushDelayTaskProcessor`.process() 方法的实现如下：
```java 
    @Override
    public boolean process(NacosTask task) {
        PushDelayTask pushDelayTask = (PushDelayTask) task;
        Service service = pushDelayTask.getService();
        NamingExecuteTaskDispatcher.getInstance()
                .dispatchAndExecuteTask(service, new PushExecuteTask(service, executeEngine, pushDelayTask));
        return true;
    }
```

这里将 `PushDelayTask` 转换为 `PushExecuteTask`，并通过 `NamingExecuteTaskDispatcher` 调度执行。

`dispatchAndExecuteTask` 方法会将任务分发到对应的 `TaskExecuteWorker` 执行，`TaskExecuteWorker` 是一个线程类，在创建的时候启动，维护了一个阻塞队列 `BlockingQueue<Runnable> queue`。

如果队列中有未执行的任务，`TaskExecuteWorker` 会不断从队列中取出任务并执行，否则会阻塞等待新任务的到来。

```java
    while (!closed.get()) {
        Runnable task = queue.take();
        task.run();
    }
```

`PushExecuteTask` 的 `run()` 方法会调用 `PushExecutor.push(...)` 方法进行推送， 在2.x 版本中，具体推送由 `PushExecutorRpcImpl#doPushWithCallback` 来实现。

```java
    public void run() {
        try {
            // 获取服务实例, 这里 PushDataWrapper 是对  Service 相关数据的一个封装
            PushDataWrapper wrapper = generatePushData();
            delayTaskEngine.getPushExecutor().doPushWithCallback(each, subscriber, wrapper,
                        new ServicePushCallback(each, subscriber, wrapper.getOriginalData(), delayTask.isPushToAll()));
        } catch (Throwable e) {
            Loggers.PUSH.error("[PushExecuteTask] push error, service: {}, clientId: {}", service, pushDelayTask.getClientId(), e);
        }
    }
```