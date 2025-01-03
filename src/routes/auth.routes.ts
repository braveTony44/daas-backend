import express from 'express'
import { logoutUser, newUserSignup, refreshToken, userLogin } from '../controllers/auth.controller';
import {verifyToken} from '../middleware/verifyUser'
const router = express.Router();

router.post("/signup",newUserSignup);
router.post("/login",userLogin);
router.post("/logout",logoutUser);
router.post("/tokenRefresh",verifyToken,refreshToken);


export default router;