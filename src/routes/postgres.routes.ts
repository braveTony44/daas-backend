import express from "express";
import {
  createPostgresDb,
  deletePostgresContainer,
  logsOfPostgresContainer,
  pausePostgresContainer,
  unPausePostgresContainer,
} from "../controllers/pg.controller";
import { verifyToken } from "../middleware/verifyUser";


const router = express.Router();

// all the routes for container
router.post("/create",verifyToken,createPostgresDb);
router.put("/pause",verifyToken, pausePostgresContainer);
router.put("/unpause", verifyToken,unPausePostgresContainer);
router.delete("/delete", verifyToken,deletePostgresContainer);
router.get("/get/:containerId/log",verifyToken, logsOfPostgresContainer);

// admin routes
// router.post("/start",verifyToken,startPostgresContainer);
// router.get("/status/:containerId",verifyToken,getContainerStatus);
// router.post("/stop",verifyToken,stopPostgresContainer);

export default router;
