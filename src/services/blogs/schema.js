import mongoose from "mongoose";

const { Schema, model } = mongoose;

const blogSchema = new Schema(
    {
        category:{
            type: String,
            required:true,
            description:"should be a string"
        },
        title:{
            type: String,
            required:true,
            description:"should be a string"
        },
        cover:{
            type: String,
            required:true,
            description:"should be a url"
        },
        readTime:{
            type: Object,
            properties:{
                value:{
                    type: Number,
                    required:true,
                    description:"should be a number"
                },
                unit:{
                    type: String,
                    required:true,
                    description:"should be a string"
                }
            }
        },
        authors:[{
            type: Schema.Types.ObjectId, 
            required: true,
            ref: "Author"
        }],
        /* author:{
            type: Object,
            required: true,
            properties:{
                name:{
                    type: String,
                    required:true,
                    description:"should be a string"
                },
                avatar:{
                    type: String,
                    required:true,
                    description:"should be a url"
                }
            }
        }, */
        content:{
            type: String,
            required:true,
            description: "should be a string"
        },
        comments:[
            {
                name:String,
                comment:String,
                createdAt: Date,
                updatedAt: Date
            }
        ]
    },
    {
        timestamps: true
    }
)

blogSchema.static("findAuthorsOfBlog", async function (query) {
    const total = await this.countDocuments(query.criteria)
    const blogs = await this.find(query.criteria, query.options.fields)
    .skip(query.options.skip)
    .limit(query.options.limit)
    .sort(query.options.sort)
    .populate("authors")

    return { total, blogs }

})

blogSchema.static("findAuthorOfBlog", async function (id) {
        const blog = await this.findById(id).populate("authors")
        return blog
})

export default model("Blog", blogSchema)