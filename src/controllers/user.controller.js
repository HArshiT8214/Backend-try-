import { asyncHandler } from "../utils/asyncHandler.js"
import { apiError } from "../utils/apiError.js"
import { User } from "../models/user.model.js"
import { uploadResult } from "../utils/cloudinary.js"

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
    if(req.files && Array.isArray(req.files.coverImage)&&req.files.coverImage.length>0){
        coverImageLocalPath=req.files.coverImage[0].path;
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

export { registerUser } 