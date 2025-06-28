const asyncHandler = (requestHandler) => {
  (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((error) =>
      next(error)
    )
  }
}
export { asyncHandler }

// const asyncHandler = (fn) => {}
// const asyncHandler = (fn) => {() => {}}
// const asyncHandler = (fn) => async () => {}

// const asyncHandler = (requestHandler) => async (req, res, next) => {
//   try {
//     await requestHandler(req, res, next)
//   } catch (error) {
//     res.status(error.code || 500).json({
//       success: false,
//       message: error.message,
//     })
//   }
// }
