import express from "express";
import listEndpoints from "express-list-endpoints";
import cors from "cors";
import mongoose from "mongoose";
import blogsRouter from "./services/blogs/index.js";
import authorsRouter from "./services/authors/index.js";
import { notFoundErrorHandler, badRequestErrorHandler, catchAllErrorHandler, unAuthorizedHandler, forbiddenHandler } from "./errorMiddlewares.js";

const server = express();
const port = process.env.PORT || 3002

// ****************** MIDDLEWARES ****************************

server.use(express.json());
server.use(cors())

// ****************** ROUTES *******************************

server.use("/blogs", blogsRouter)
server.use("/authors", authorsRouter)

// ****************** ERROR HANDLERS ***********************

server.use(badRequestErrorHandler)
server.use(unAuthorizedHandler)
server.use(forbiddenHandler)
server.use(notFoundErrorHandler)
server.use(catchAllErrorHandler)

console.table(listEndpoints(server));

mongoose
  .connect(process.env.MONGO_CONNECTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() =>
    server.listen(port, () => {
      console.log("🧡 server is running on port ", port);
    })
  )
  .catch((err) => console.log(err));
