<script>
	import Card from '../components/Card.vue'
	export default {
		name: 'mainAbout',
		data() {
			return {
				"cards" : [
						{
								"title": "使let 和 const (ES6)",
								"msg": "在 2015 后的 JavaScript 版本 (ES6) 允许我们使用 const 关键字来定义一个常量，使用 let 关键字定义的限定范围内作用域的变量。"
						},
						{
								"title": "Vue3 的 ref()",
								"msg": "ref( ) 接受一个内部值，返回一个ref 对象，这个对象是响应式的、可更改的，且只有一个指向其内部值的属性 .value。ref() 将传入参数的值包装为一个带 .value 属性的 ref 对象。"
						},
						{
								"title": "vue中定义data：{} 和 data（）",
								"msg": "在简单的vue实例应用中，两种写法几乎是没有什么区别的，因为你定义的#app对象不会被复用。但是如果是在Vue组件应用的环境中，就可能会存在多个地方调用同一个组件的情况，为了不让多个地方的组件共享同一个data对象，只能返回函数。这个与JavaScript的作用域特性有关，函数自己拥有私有的作用域，函数之间的作用域相互独立，也就不会出现组件对数据的绑定出现交错的情况。"
						},
						{
								"title": "vue3的＜script setup＞",
								"msg": "< script setup> 是一个实验性的 API，用于使用 Composition API 编写组件。它允许你在一个更简洁、更有组织的方式中编写组件。这种语法能够让你直接在 < script setup> 标签内使用 ref、computed、watch 等 Composition API 的函数，而无需在 setup 函数内部使用它们。"
						}
				]
			};
		},
		components: {
			Card
		}
	}
</script>
<template>
  <div class="about">
		<div v-for="item in cards">
			<Card :title="item.title" :msg="item.msg" />
		</div>
				<Card 
								title="Vue3 声明式渲染（Declarative Rendering）"
								msg="Vue3 的声明式渲染是一种基于模板的渲染方式，它允许开发者通过简洁的模板语法来描述页面的结构和数据绑定关系，而不需要直接操作 DOM。<br />
									Vue3 的声明式渲染通过使用模板、指令（如 v-if、v-for、v-bind 等）以及响应式数据来简化 UI 更新过程。<br />
									Vue 的声明式渲染让你只需要声明 UI 应该如何呈现，Vue 会根据数据的变化自动更新视图，当你改变数据时，视图会自动响应。"
								/>
								
							<Card
								title="Vue3 指令"
								msg='Vue 指令（Directives）是 Vue.js 的一项核心功能，它们可以在 HTML 模板中以 v- 开头的特殊属性形式使用，用于将响应式数据绑定到 DOM 元素上或在 DOM 元素上进行一些操作。<br />
									Vue 指令是带有前缀 v- 的特殊 HTML 属性，它赋予 HTML 标签额外的功能。<br />
									<table class="reference">
										<thead>
											<tr><th>指令</th><th>描述</th></tr>
										</thead>
										<tbody>
											<tr>
												<td><code>v-bind</code></td>
												<td>用于将 Vue 实例的数据绑定到 HTML 元素的属性上。</td>
											</tr>
											<tr>
												<td><code>v-if</code></td>
												<td>用于根据表达式的值来条件性地渲染元素或组件。</td>
											</tr>
											<tr>
												<td><code>v-show</code></td>
												<td>v-show 是 Vue.js 提供的一种指令，用于根据表达式的值来条件性地显示或隐藏元素。</td>
											</tr>
											<tr>
												<td><code>v-for</code></td>
												<td>用于根据数组或对象的属性值来循环渲染元素或组件。</td>
											</tr>
										
											<tr>
												<td><code>v-on</code></td>
												<td>用于在 HTML 元素上绑定事件监听器，使其能够触发 Vue 实例中的方法或函数。</td>
											</tr>
											<tr>
												<td><code>v-model</code></td>
												<td>用于在表单控件和 Vue 实例的数据之间创建双向数据绑定。</td>
											</tr>
										</tbody>
									</table>'
							/>
							<Card
								title="条件判断 v-if  v-show"
								msg="v-if <br />
									根据表达式的真假条件性地渲染元素。如果表达式为真，则渲染该元素；如果为假，则不渲染（不会在 DOM 中生成该元素）。<br />
									v-show<br />
									根据表达式的真假条件性地显示或隐藏元素，与 v-if 不同的是，v-show 始终会在 DOM 中保留元素，只是通过 CSS 的 display 属性控制元素的显示和隐藏。"
							></Card>
							
							<Card 
								title="Vue 指令定义函数提供了7个钩子函数"
								msg="<ol>
												<li><p><strong>created </strong>: 在绑定元素的属性或事件监听器被应用之前调用。</p>
												</li>
												<li><p><strong>beforeMount </strong>: 指令第一次绑定到元素并且在挂载父组件之前调用。。</p>
												</li>
												<li><p><strong>mounted </strong>: 在绑定元素的父组件被挂载后调用。。</p>
												</li>
												<li><p><strong>beforeUpdate</strong>: 在更新包含组件的 VNode 之前调用。。</p>
												</li>
												<li><p><strong>updated</strong>: 在包含组件的 VNode 及其子组件的 VNode 更新后调用。</p>
												</li>
												<li><p><strong>beforeUnmount</strong>: 当指令与在绑定元素父组件卸载之前时，只调用一次。</p>
												</li>
												<li><p><strong>unmounted</strong>: 当指令与元素解除绑定且父组件已卸载时，只调用一次。</p>
												</li>
										</ol>"
							></Card>
  </div>
</template>

<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    align-items: center;
  }
}
</style>
