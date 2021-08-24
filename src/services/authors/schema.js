import mongoose from "mongoose"
import createError from "http-errors"

const { Schema, model } = mongoose

const AuthorSchema = new Schema(
    {
        name: {

            type:String,
            required:true,
            description: "name is required"
        },
        surname: {

            type:String,
            required:true,
            description: "surname is required"
        },
        email: {

            type:String,
            required:true,
            description: "email is required"
        },
        avatar: {

            type:String,
            required:true,
            description: "avatar is required"
        }
    }
)

AuthorSchema.static("findAuthorsOfBlog", async function (query) {
    const total = await this.countDocuments(query.criteria)
    const authors = await this.find(query.criteria, query.options.fields)
    .skip(query.options.skip)
    .limit(query.options.limit)
    .sort(query.options.sort)

    return { total, authors }
})

export default model("Author", AuthorSchema)
