import express from 'express'
import { getAllUserConatiners, getInstance, userProfile } from '../controllers/user.controller';
import { verifyToken } from '../middleware/verifyUser';
const router = express.Router();

router.get("/profile",verifyToken,userProfile);
router.get("/containers",verifyToken,getAllUserConatiners);
router.get("/get/:instanceId",verifyToken,getInstance);

export default router;