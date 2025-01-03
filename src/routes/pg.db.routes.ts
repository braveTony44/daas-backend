import express from 'express'
import { getColumns, getTableDataController, getTables, isPgConnect } from '../controllers/pg.db.controller';
import { verifyToken } from '../middleware/verifyUser';
const router = express.Router();

router.get("/isconnected", verifyToken,isPgConnect);

router.post("/getTables",verifyToken,getTables);
router.post("/table/columns",verifyToken,getColumns);
router.post("/table/data",verifyToken,getTableDataController);

export default router;