import createError from "http-errors"
import atob from "atob"
import AuthorModel from "../services/authors/schema.js"

export const basicAuthMiddleWare = async (req, res, next) => {
    console.log(req.headers);
    if(!req.headers.authorization){
        next(createError(401,'please provide credentials in the authorization header!' ))
    }else{
        const decoded = atob((req.headers.authorization).split(" ")[1])
        console.log(decoded);
        const [email, password] = decoded.split(":")
        const author = await AuthorModel.checkCredentials(email, password)
        console.log(author);
        if(author){
            req.author = author
            next()
        }else{
            next(createError(401, "credentials are incorrect!!"))
        }
    }
}