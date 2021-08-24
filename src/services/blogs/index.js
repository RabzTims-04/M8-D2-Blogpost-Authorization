import express from "express";
import createError from "http-errors";
import blogModel from "./schema.js";
import striptags from "striptags";
import q2m from "query-to-mongo";
import axios from "axios";
import { pipeline } from "stream";
import { v2 as cloudinary } from "cloudinary"
import { CloudinaryStorage } from "multer-storage-cloudinary"
import multer from "multer";
import { generatePDFReadableStream, stream2Buffer } from "../../lib/pdf/index.js";
import { email } from "../../lib/email.js";

const blogsRouter = express.Router();

/* ***************blogs********************* */

blogsRouter.get("/", async (req, res, next) => {
  try {
    const query = q2m(req.query)
    console.log(query);

    const { total, blogs } = await blogModel.findAuthorsOfBlog(query);
    res.send({links: query.links("/blogs", total), total, blogs})
  } catch (error) {
    next(
      createError(500, "An error occurred while creating getting blogs list")
    );
  }
});

/* *******************get single blog*************************** */

blogsRouter.get("/:blogId", async (req, res, next) => {
  try {
    const blogId = req.params.blogId;
    const blog = await blogModel.findAuthorOfBlog(blogId);
    if (blog) {
      res.send(blog);
    } else {
      next(createError(404, `blog with id: ${blogId} not found`));
    }
  } catch (error) {
    next(
      createError(
        500,
        `An error occurred while finding blog with id: ${req.params.blogId}`
      )
    );
  }
});

/* const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params:{
    folder:"BlogCovers"
  }
})

const uploadOnCloudinary = multer({ storage: cloudinaryStorage}).single("blogCover") */

/* ********************PDF download************************* */

blogsRouter.get("/:blogId/pdf", async (req, res, next) => {
  try {
    const blogId = req.params.blogId;
    const blog = await blogModel.findAuthorOfBlog(blogId);
    if (blog) {
      const response = await axios.get(blog.cover,{
        responseType: 'arraybuffer'
      })
      const mediaPath = blog.cover.split('/')
      const filename = mediaPath[mediaPath.length-1]
      const [ id, extension ] = filename.split('.')
      const base64 = Buffer.from(response.data).toString('base64')
      const base64Image = `data:image/${extension};base64,${base64}`
      const source = generatePDFReadableStream(blog, base64Image)
      const destination = res
      pipeline(source, destination, err => {
        if(err){
          next(err)
        }
      })
    } else {
      next(createError(404, `blog with id: ${blogId} not found`));
    }
  } catch (error) {
    next(
      createError(
        500,
        `An error occurred while finding blog with id: ${req.params.blogId}`
      )
    );
  }
});


/* *******************post a blog*************************** */

blogsRouter.post("/", async (req, res, next) => {
  try {
    let readTimeValue =
      Math.floor(striptags(req.body.content).length / 228) + 1;
    req.body.readTime = {};
    req.body.readTime.value = readTimeValue;
    let readTimeUnit = req.body.readTime.value === 1 ? "minute" : "minutes";
    req.body.readTime.unit = readTimeUnit;
    const newBlog = new blogModel(req.body);
    const { _id } = await newBlog.save();

    console.log(newBlog);

    const blogId = newBlog._id;
    const blog = await blogModel.findAuthorOfBlog(blogId)

    const response = await axios.get(newBlog.cover,{
      responseType: 'arraybuffer'
    })
    const mediaPath = newBlog.cover.split('/')
    const filename = mediaPath[mediaPath.length-1]
    const [ id, extension ] = filename.split('.')
    const base64 = Buffer.from(response.data).toString('base64')
    const base64Image = `data:image/${extension};base64,${base64}`
    const source = generatePDFReadableStream(blog, base64Image)
    const destination = res
    pipeline(source, destination, err => {
      if(err){
        next(err)
      }
    })

    const PdfAsBuffer = await stream2Buffer(source)
    const base64Pdf = PdfAsBuffer.toString("base64")

    const authorEmail = blog.authors[0].email
    await email(authorEmail, newBlog, base64Pdf)    

    res.status(201).send({ _id });
  } catch (error) {
    console.log(error);
    if (error.name === "ValidationError") {
      next(createError(400, error));
    } else {
      next(createError(500, `An error occurred while creating new blog`));
    }
  }
});

/* *******************edit blog*************************** */

blogsRouter.put("/:blogId", async (req, res, next) => {
  try {
    const blogId = req.params.blogId;
    const updatedBlog = await blogModel.findByIdAndUpdate(blogId, req.body, {
      new: true,
      runValidators: true,
    });

    if (updatedBlog) {
      res.send(updatedBlog);
    } else {
      next(createError(404, `Blog with id: ${blogId} not found`));
    }
  } catch (error) {
    next(
      createError(
        500,
        `An error occurred while updating blog with id: ${req.params.blogId}`
      )
    );
  }
});

/* *******************delete blog*************************** */

blogsRouter.delete("/:blogId", async (req, res, next) => {
  try {
    const blogId = req.params.blogId;
    const deleteBlog = await blogModel.findByIdAndDelete(blogId);
    if (deleteBlog) {
      res.status(204).send();
    } else {
      next(createError(404, `Blog with id: ${blogId} not found`));
    }
  } catch (error) {
    next(
      createError(
        500,
        `An error occurred while deleting blog with id: ${req.params.blogId}`
      )
    );
  }
});

/* **************************Comments***************************** */

blogsRouter.get("/:blogId/comments", async (req, res, next) => {
  try {
    const blog = await blogModel.findById(req.params.blogId);
    if (blog) {
      res.send(blog.comments);
    } else {
      next(createError(404, "blog not found"));
    }
  } catch (error) {
    next(createError(500, "Error while fetching comments "));
  }
});

/* *******************get single comment*************************** */

blogsRouter.get("/:blogId/comments/:commentId", async (req, res, next) => {
  try {
    const blog = await blogModel.findById(req.params.blogId, {
      comments: {
        $elemMatch: {
          _id: req.params.commentId,
        },
      },
    });
    if (blog) {
      if (blog.comments.length > 0) {
        res.send(blog.comments[0]);
      } else {
        next(createError(404, `no comments found`));
      }
    } else {
      next(createError(404, `blog not found`));
    }
  } catch (error) {
    next(createError(500, "Error while fetching a single comment"));
  }
});

/* *******************post comment*************************** */

blogsRouter.post("/:blogId/comments", async (req, res, next) => {
  try {
    const blogId = req.params.blogId;
    const newComment = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const comment = await blogModel.findByIdAndUpdate(
      blogId,
      {
        $push: {
          comments: newComment,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );
    if (comment) {
      res.send(comment);
    } else {
      next(createError(404, "blog not found"));
    }
  } catch (error) {
    next(createError(500, "Error while posting a comment"));
  }
});

/* *******************edit comment*************************** */

blogsRouter.put("/:blogId/comments/:commentId", async (req, res, next) => {
  try {
    /* const blogcomment = await blogModel.findById(req.params.blogId, {
      comments: {
        $elemMatch: {
          _id: req.params.commentId,
        },
      },
    });
    console.log(blogcomment.comments[0]);
    const updatedComment = {
      ...blogcomment.comments[0]._doc,
      ...req.body,
      updatedAt: new Date()
    };
    console.log(updatedComment); */

    //either can be done like above or below

    const body = {};
    for (let key in req.body) {
      body[`comments.$.${key}`] = req.body[key];
    }
    body[`comments.$.updatedAt`] = new Date()
    const blog = await blogModel.findOneAndUpdate(
      {
        _id: req.params.blogId,
        "comments._id": req.params.commentId,
      },
      {
        $set: body,
        /*   $set: {
          "comments.$": updatedComment,
        }, */
      },
      {
        new: true,
        runValidators: true,
      }
    );
    if (blog) {
      res.send(blog);
    } else {
      next(createError(404, `blog not found`));
    }
  } catch (error) {
    next(createError(500, "Error while editing a comment"));
  }
});

/* *******************delete comment*************************** */

blogsRouter.delete("/:blogId/comments/:commentId", async (req, res, next) => {
  try {
    const blogToDelete = await blogModel.findById(req.params.blogId,{
        comments:{
            $elemMatch:{_id:req.params.commentId}
        }
    })
    const blog = await blogModel.findByIdAndUpdate(
      req.params.blogId,
      {
        $pull: {
          comments: {
            _id: req.params.commentId,
          },
        },
      },
      {
        new: true,
      }
    );
    if (blog) {
      res.send(blogToDelete.comments[0]._doc);
    } else {
      next(createError(404, `blog not found`));
    }
  } catch (error) {
    next(createError(500, "Error while deleting a comment"));
  }
});

export default blogsRouter;
