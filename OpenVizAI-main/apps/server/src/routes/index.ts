import AIRouter from "./ai.route";
import authRoute from "./auth.route";

const allRoutes = [
  { path: "/ai", router: AIRouter },
  { path: "/auth", router: authRoute },
];

export default allRoutes;
