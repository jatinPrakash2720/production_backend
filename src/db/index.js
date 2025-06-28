import mongoose from "mongoose"
import { DB_NAME } from "../constants.js"

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    )
    console.log(
      `\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}` //galti se khi aur connect hojaye toh pta chal jaye
    )
  } catch (error) {
    console.log("MONGODB connection error :", error)
    process.exit(1) // node builtin, and process is a refernce of ongoing current project
  }
}

export default connectDB
