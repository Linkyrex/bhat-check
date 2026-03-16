import { Router, type IRouter } from "express";
import healthRouter from "./health";
import goldRouter from "./gold";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/gold", goldRouter);

export default router;
