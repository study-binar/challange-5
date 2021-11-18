require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const errorHandler = require("./error/Error.Handler");

// router
const userRouter = require("./routes/user.router");
const dashboardRouter = require("./routes/dashboard.router");
const roomRouter = require("./routes/room.router");

const app = express();

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// konfigurasi ejs
app.set("view engine", "ejs");

// router
app.use(userRouter);
app.use(dashboardRouter);
app.use(roomRouter);

// error handler
app.use(errorHandler);
// // error handling
// app.use((err, req, res, next) => {
//   console.log(err);
//   const { message, code = 500, error = "internal server error" } = err;

//   return res.status(code).json({
//     message,
//     code,
//     error,
//   });
// });

// listen
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.info(`connect on port http://localhost:${PORT}`);
});
