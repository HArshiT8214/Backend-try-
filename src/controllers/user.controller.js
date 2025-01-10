import { asyncHandler } from "../utils/asyncHandler.js"
import { apiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { User } from "../models/user.model.js"
import { uploadResult } from "../utils/cloudinary.js"





const generateAccessandRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        user.save({
            validateBeforeSave: true
        })
        return { accessToken, refreshToken }
    } catch (error) {
        throw new apiError(500, "something went weong while generating tokens")
    }
}







// get user details from frontend
// validation - not empty
// check if user already exists: username, email
// check for images, check for avatar
// upload them to cloudinary, avatar
// create user object - create entry in db
// remove password and refresh token field from response
// check for user creation
// return res




const registerUser = asyncHandler(async (req, res) => {
    const { username, email, fullname, password } = req.body
    // console.log("email", email);


    // if (fullname === "") {
    //     throw new apiError(400, "fullname is required")
    // }
    if (
        [fullname, email, username, password].some((field) =>
            field?.trim() === "")
    ) {
        throw new apiError(400, "all fields are reqired")
    }

    const exitedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (exitedUser) {
        throw new apiError(409, "User with email or username already")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }




    if (!avatarLocalPath) {
        throw new apiError(400, "Avatar file is required")
    }

    const avatar = await uploadResult(avatarLocalPath)
    const coverImage = await uploadResult(coverImageLocalPath)

    if (!avatar) {
        throw new apiError(400, "Avater file failed to upload on cloudniary")
    }

    const user = await User.create({
        username,
        email,
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        password,

    })


})


const loginUser = asyncHandler(async (req, res) => {
    //req.body-->data
    //username email check
    //find user
    //check password
    //access and refresh token 
    //send cooki


    const { username, email, password } = req.body;
    if (!(username || email)) {
        throw new apiError(400, "username,email not found!!")
    }
    const user = await User.findOne({
        $or: [{ email }, { username }]
    })
    if (!user) {
        throw new apiError(404, "user does not exist")
    }

    const isPasswordValid = await user.isPasswordcorrect(password)

    if (!isPasswordValid) {
        throw new apiError(401, "Invalid user credentials")
    }

    const { accessToken, refreshToken } = await generateAccessandRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    const options = {
        httpOnly: true,
        secure: true,
    }
    return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json(new ApiResponse(200, {
        user: loggedInUser, accessToken,
        refreshToken
    },
        "User logged in successfully"

    ))

})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        })

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res.status(200).clearCookie("accessToken", options)
        .clearCookie("refreshToken", options).json(new ApiResponse(200, {}, "User logged Out "))


})

export { registerUser, loginUser, logoutUser } 