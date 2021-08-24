import mongoose from "mongoose"
import bcrypt from "bcrypt"

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
            description: "email is required",
            index: {
                unique: true,
            }
        },
        password:{
            type:String,
            required:true,
            description: "password is required",
            index: {
                unique: true,
            }
        },
        avatar: {

            type:String,
            description: "avatar is required",
            default:"https://pics.me.me/thumb_45993-anime-forum-avatars-profile-photos-avatar-abyss-51102772.png"

        },
        role:{
            type: String,
            required: true,
            enum:["Admin", "User"],
            default:"User"
        }
    },
    {
        timestamps: true
    }
)

AuthorSchema.pre("save", async function (next) {
    const newAuthor = this
    const plainPW = newAuthor.password
    if(newAuthor.isModified){
        newAuthor.password = await bcrypt.hash(plainPW, 10)
    }
    next()
})

AuthorSchema.methods.toJSON = function (){
    const authorDocument = this
    console.log(authorDocument);
    const authorObject = authorDocument.toObject()
    console.log(authorObject);
    delete authorObject.password
    delete authorObject.__v
    return authorObject
}

AuthorSchema.statics.checkCredentials = async function(email, password){
    const author = await this.findOne({ email })
    if(author){
        const isMatch = await bcrypt.compare(password, author.password)
        if(isMatch){
            return author
        }else{
            return null
        }
    }else{
        return null
    }
}

AuthorSchema.static("findAuthorsOfBlog", async function (query) {
    const total = await this.countDocuments(query.criteria)
    const authors = await this.find(query.criteria, query.options.fields)
    .skip(query.options.skip)
    .limit(query.options.limit)
    .sort(query.options.sort)

    return { total, authors }
})

export default model("Author", AuthorSchema)
