import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    redirect: "/overview",
  },
  {
    path: "/overview",
    name: "Overview",
    component: () => import("../views/Overview.vue"),
  },
  {
    path: "/detail",
    name: "Detail",
    component: () => import("../views/Detail.vue"),
    children: [
      {
        path: "building:id",
        name: "BuildingDetail",
        component: () => import("../views/BuildingDetail.vue"),
        props: true,
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
