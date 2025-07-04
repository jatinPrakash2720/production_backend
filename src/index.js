// require("dotenv").config({ path: "./env" })
import dotenv from "dotenv"
import connectDB from "./db/index.js"
dotenv.config({ path: "./env" })
import { app } from "./app.js"

connectDB() // yeh ek promise return krta hai,,,isliye hum then catch use kr paye
  .then(() => {
    app.on("error", (error) => {
      console.log("Application is unable to listen ", error)
    })
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at port : ${process.env.PORT}`)
    })
  })
  .catch((err) => {
    console.log("MONGO db connection failed !!!", err)
  }
)

/*    
;(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    app.on("error", (error) => {
      console.log("Our application able to talk, ERROR:", error)
      throw error
    })
    app.listen(process.env.PORT, () => {
      console.log(`App is listening on port ${process.env.PORT}`)
    })
  } catch (error) {
    console.error("ERROR :", error)
    throw error
  }
})()
// function connectDB() {}

// connectDB()

*/
