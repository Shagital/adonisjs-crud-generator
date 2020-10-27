import DashboardLayout from "@/pages/Dashboard/Layout/DashboardLayout.vue";
import AuthLayout from "@/pages/auth/AuthLayout.vue";

// Dashboard pages
import Dashboard from "@/pages/Dashboard/Dashboard.vue";
// Profile
import UserProfile from "@/pages/profile/UserProfile.vue";

// Auth
import Login from "@/pages/auth/Login.vue";

// Import Model Components Here. Do not remove this line

const routes = [
  {
    path: "/",
    redirect: "/dashboard",
    name: "home",
    component: DashboardLayout,
    meta: {auth: true},
    children: [
      {
        path: "dashboard",
        name: "Dashboard",
        components: {default: Dashboard},
      },
      {
        path: "profile",
        name: "admin-profile",
        components: {default: UserProfile},
      },
      // Import Model Routes Here. Do not remove this line
    ]
  },
  {
    path: "/",
    component: AuthLayout,
    name: "Authentication",
    children: [
      {
        path: "/login",
        name: "Login",
        component: Login,
      },
    ]
  }
];

export default routes;
