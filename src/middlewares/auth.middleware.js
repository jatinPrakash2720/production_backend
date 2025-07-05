import { asyncHandler } from "../utils/asyncHandler.utils.js"
import { ApiError } from "../utils/ApiError.utils.js"
import { User } from "../models/user.models.js"
import jwt from "jsonwebtoken"
const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "")

    // console.log("Token extracted:", token)

    if (!token) {
      throw new ApiError(401, "Unauthorized Request")
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    // console.log("Decoded token:", decodedToken)

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    )
    if (!user) {
      throw new ApiError(401, "Invalid Access Token")
    }
    req.user = user
    next()
  } catch (error) {
    console.error("JWT Verification Error:", error.message)
    throw new ApiError(401, error?.message || "Invalid access token")
  }
})

export { verifyJWT }
