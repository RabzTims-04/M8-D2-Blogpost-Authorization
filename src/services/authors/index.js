import express from "express";
import createError from "http-errors";
import q2m from "query-to-mongo"

import AuthorModel from "./schema.js";

const authorsRouter = express.Router();

/* *************GET Authors******************** */

authorsRouter.get("/", async (req, res, next) => {
    try {
        
        const query = q2m(req.query)
     
        const { total, authors } = await AuthorModel.findAuthorsOfBlog(query)
        res.send({links: query.links("/authors", total), total, authors})
        
    } catch (error) {
        next(createError(500, "Error in getting authors"))
    }
})

/* ***************GET single author****************** */

authorsRouter.get("/", async (req, res, next) => {
    try {


    } catch (error) {
        next(createError(500, "Error in getting single author"))
    }
})

/* ***************POST author details****************** */

authorsRouter.post("/", async (req, res, next) => {
    try {
        
        const newAuthor = new AuthorModel(req.body)
        const {_id} = await newAuthor.save()
        res.status(201).send({_id})
        
    } catch (error) {
        next(createError(500, "Error in posting author details"))
    }
})

/* ***************EDIT author details****************** */

/* authorsRouter.put("/", async (req, res, next) => {
    try {
        
    } catch (error) {
        next(createError(500, "Error in updating author details"))
    }
})
 */

/* ****************DELETE author details***************** */

authorsRouter.delete("/:id", async (req, res, next) => {
    try {
        const id = req.params.id
        const author = await AuthorModel.findByIdAndDelete(id)
        if(author){
            res.status(204).send()
        }
        else{
            next(createError(404, `author with id: ${id} not found`))
        }
    } catch (error) {
        next(createError(500, "Error in deleting author details"))
    }
})

export default authorsRouter