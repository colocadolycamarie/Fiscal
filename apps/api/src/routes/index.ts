import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import workspacesRouter from "./workspaces";
import dataSourcesRouter from "./data-sources";
import metricsRouter from "./metrics";
import reportsRouter from "./reports";
import alertsRouter from "./alerts";
import conversationsRouter from "./conversations";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(workspacesRouter);
router.use(dataSourcesRouter);
router.use(metricsRouter);
router.use(reportsRouter);
router.use(alertsRouter);
router.use(conversationsRouter);

export default router;
