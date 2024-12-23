import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access tokens")
    }
}

const options = {
    httpOnly: true,
    secure: true
}

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res


    const { fullName, email, username, password } = req.body

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    // console.log("avatarLocalPath: ", avatarLocalPath);
    // console.log("coverImageLocalPath: ", coverImageLocalPath);

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    // console.log("avatar: ", avatar);
    // console.log("coverImage: ", coverImage);

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    // console.log("avatar = : ", avatar);

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

})

const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    // username or email
    // find the user
    // password check
    // access and refresh token
    // send cookie

    const { email, username, password } = req.body
    console.log("req: ", req)
    console.log("req.user: ", req.user)
    console.log("email: ", email);
    console.log("username: ", username);
    console.log("password: ", password);

    if (!username && !email) {
        throw new ApiError(400, "Either username or email is required for login");
    }

    if (!password) {
        throw new ApiError(400, "Password is required for login");
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "User does not exists")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid Password")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    console.log("accessToken: ", accessToken);
    console.log("refreshToken: ", refreshToken);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User logged In Succesfully"
            )
        )
})

const logoutUser = asyncHandler(async (req, res) => {
    // delete refreshToken

    console.log("req:: ", req)
    console.log("req.user:: ", req.user)
    console.log("req.chocolate:: ", req.chocolate)

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out"))
})

const refreshAcessToken = asyncHandler(async (req, res) => {

    // Hit the endpoint
    // get the current user by refresh token
    // verify is this refersh token is match to the store in db
    // if match then generate new accessToken and refresh token and send to user
    // else error

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    // console.log("incomingRefreshToken: ", incomingRefreshToken);

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        // console.log("decodedToken: ", decodedToken);
        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid refresh Token")
        }

        // console.log("incomingRefreshToken: ", incomingRefreshToken);
        // console.log("user.refreshToken: ", user.refreshToken);

        // check non decoded token
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)
        // console.log("refreshAcessToken/ accessToken: ", accessToken);
        // console.log("refreshAcessToken/ newRefreshToken: ", refreshToken);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken },
                    "Access token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    // get the current user
    // check the password
    // update the password
    // send the response

    const { oldPassword, newPassword } = req.body

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Old password and new password are required")
    }

    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed succesfully"))

})

const getCurrentUser = asyncHandler(async (req, res) => {
    // get the current user
    // send the response

    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "Current User fetch Succesfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { email, fullName } = req.body

    if (!email || !fullName) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email,
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated Successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    // take newAvatar check its local path
    // upload newAvatar on cloudinary
    // check if upload succesfully or not
    // replace and save newAvatar

    //middleware: verifyjwt, multer

    const newAvatarLocalPath = req.file?.path

    if (!newAvatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const newAvatar = await uploadOnCloudinary(newAvatarLocalPath)
    if (!newAvatar.url) {
        throw new ApiError(400, "Error while uploading Avatar on cloudinary")
    }

    //check if user already has avatar, then delete it from cloudinary
    let responseOfDelete = null
    if (req.user?.avatar) {
        const avatarPublicId = req.user.avatar.split("/").pop()?.split(".")[0]
        responseOfDelete = await deleteFromCloudinary(avatarPublicId)
    }

    if (responseOfDelete !== "ok") {
        throw new ApiError(400, "Error while deleting Avatar from cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: newAvatar.url
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar updated Successfully"))
})

const updateUserCoverImage = asyncHandler(async (req, res) => {

    const newCoverImageLocalPath = req.file?.path

    if (!newCoverImageLocalPath) {
        throw new ApiError(400, "CoverImage file is required")
    }

    const newCoverImage = await uploadOnCloudinary(newCoverImageLocalPath)
    if (!newCoverImage.url) {
        throw new ApiError(400, "Error while uploading CoverImage on cloudinary")
    }

    //check if user already has coverImage, then delete it from cloudinary
    let responseOfDelete = null
    if (req.user?.coverImage) {
        const coverImagePublicId = req.user.coverImage.split("/").pop()?.split(".")[0]
        responseOfDelete = await deleteFromCloudinary(coverImagePublicId)
    }

    if (responseOfDelete !== "ok") {
        throw new ApiError(400, "Error while deleting CoverImage from cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: newCoverImage.url
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "CoverImage updated Successfully"))
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "Username is missing!");
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])

    console.log("Channel: ", channel);

    if (!channel?.length) {
        throw new ApiError(404, "Channel does not exists!")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, channel[0], "User channel fetched succesfully!")
        )
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $profile: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                }
            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user[0].watchHistory,
                "Watch history fetched succesfully"
            )
        )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAcessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
}