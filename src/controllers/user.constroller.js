import { asyncHandler } from "../utils/asyncHandler.utils.js"
import { ApiError } from "../utils/ApiError.utils.js"
import { ApiResponse } from "../utils/ApiResponse.utils.js"
import { User } from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.utils.js"
import jwt from "jsonwebtoken"
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    // console.log(user.refreshToken)
    await user.save({ validateBeforeSave: false })
    // console.log(user.refreshToken)
    return { accessToken, refreshToken }
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    )
  }
}
const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend done
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  //return res

  const { fullName, email, username, password } = req.body
  console.log("email: " + email)

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required")
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  })
  if (existedUser) {
    throw new ApiError(409, "User with email or username already exist")
  }
  console.log(req.files)

  // if (fullName === "") {
  //   throw new ApiError(400, "fullname is required")
  // }
  const avatarLocalPath = req.files?.avatar[0]?.path
  // const coverImageLocalPath = req.files?.coverImage[0]?.path
  let coverImageLocalPath
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path
  }
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required")
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  })

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user")
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"))
})

const loginUser = asyncHandler(async (req, res) => {
  //user se data lenge,,
  //validate karenge
  //username check krlenge hai ya nhi,
  //password check
  //access and refresh token
  //send secure cookie
  //response

  const { email, username, password } = req.body
  // if (!username || !email) {
  //   throw new ApiError(400, "username or email is required")
  // }
  if (!(username || email)) {
    throw new ApiError(400, "username or email is required")
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  })
  if (!user) {
    throw new ApiError(404, "User does not exists")
  }

  const isPasswordValid = await user.isPasswordCorrect(password)

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  )
  // console.log(`accessToken : ${accessToken}, and refreshToken: ${refreshToken}`)
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )
  const option = {
    httpOnly: true,
    secure: true,
  }

  return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Succesfully"
      )
    )
})

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: { refreshToken: 1 },
    },
    {
      new: true,
    }
  )

  const option = {
    httpOnly: true,
    secure: true,
  }

  return res
    .status(200)
    .clearCookie("accessToken", option)
    .clearCookie("refreshToken", option)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
  //cookie se refresh token,
  //user se refresh token nikal ke same hai ya nhi
  //generateAcessandRefresTOken
  //aur new refresh token database mein set
  //res mein new cookies add krdenge

  try {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
      throw new ApiError(401, "unauthorized request")
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )
    const user = await User.findById(decodedToken?._id)
    if (!user) {
      throw new ApiError(401, "invalid refresh token")
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used")
    }
    const options = {
      httpOnly: true,
      secure: true,
    }
    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(decodedToken?._id)

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, newRefreshToken },
          "Access Token refresheds"
        )
      )
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token")
  }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmNewPassword } = req.body

  if (!(newPassword === confirmNewPassword)) {
    throw new ApiError(400, "password and confirm password does not match")
  }
  const user = await User.findById(req.user?._id)

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password")
  }

  user.password = newPassword
  await user.save({ validateBeforeSave: false })

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password changed successfullt"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(200, req.user, "Current User fetced successfully")
})

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body

  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required")
  }

  await User.findByIdAndDelete(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true }
  ).select("-password")
  // $set: {
  //   fullName: fullName,
  //   email:email,
  // }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account Details updated successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.files?.path

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing")
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if (!avatar.url) {
    throw new ApiError(408, "Error while uploading on Cloudinary")
  }
  const storeData = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password")

  return res.status(200).json(new ApiResponse(200, storeData, "Avatar Updated"))
  //req.files, localpath,
  //cloudinary prr upload and new paths, ajayenge.
  //purane avatar ko delete,
  //new ko update,
  //return
})
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.files?.path

  if (!coverImageLocalPath) {
    throw new ApiError(400, "CoverImage file is missing")
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if (!coverImage.url) {
    throw new ApiError(408, "Error while uploading on Cloudinary")
  }
  const storeData = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password")

  return res
    .status(200)
    .json(new ApiResponse(200, storeData, "coverImage Updated"))
  //req.files, localpath,
  //cloudinary prr upload and new paths, ajayenge.
  //purane avatar ko delete,
  //new ko update,
  //return
})
export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
}
