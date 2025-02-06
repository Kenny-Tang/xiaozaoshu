import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import MdViewer from '../views/MdViewer.vue';
import mdLinks from '@/assets/links.json';

const rs = [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'Vue Anki',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
		{
			path: '/md-view',
			name: 'MdViewer',
			component: MdViewer,
		}
  ];
	for (const link of mdLinks) {
	  const dynamicRoute = {
	    path: link.path,  // e.g., "/md-view/:id"
	    name: link.name,
	    component: MdViewer,
	    props: route => ({ url: link.url }), // Passing the route parameter 'id' as a prop
	  };
		console.log(link.url+ " l")
	  rs.push(dynamicRoute);
	}

	// for (const ru in mdLinks) {
	// 	const lk = {};
	// 	lk.path = mdLinks[ru].path;
	// 	lk.name = mdLinks[ru].name;
	// 	// console.log(lk.name + "")
	// 	lk.component = MdViewer;
	// 	rs.push(lk);
	// }
	
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: rs,
})

export default router
