import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAcessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { VerifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

// secured routes
router.route("/logout").post(VerifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAcessToken)
router.route("/change-password").post(VerifyJWT, changeCurrentPassword)
router.route("/current-user").get(VerifyJWT, getCurrentUser)
router.route("/update-account-details").patch(VerifyJWT, updateAccountDetails)
router.route("/update-avatar").patch(VerifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/update-coverimage").patch(VerifyJWT, upload.single("coverImage"), updateUserCoverImage)
router.route("/c/:username").get(VerifyJWT, getUserChannelProfile)
router.route("/watch-history").get(VerifyJWT, getWatchHistory)


export default router