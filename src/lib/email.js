import sgMail from "@sendgrid/mail"
import striptags from "striptags";

export const email = async (receiver, obj, pdfFile) => {

    try {
        
        sgMail.setApiKey(process.env.SENDGRID_API_KEY)
        const msg = {
        to: receiver, // Change to your recipient
        from: process.env.MY_EMAIL, // Change to your verified sender
        subject: `Blog with Title ${obj.title} has been generated`,
        text: striptags(obj.content),
        attachments:[
            {
                content: pdfFile,
                filename: `${obj.title}.pdf`,
                type:"application/pdf",
                disposition: "attachment"
            }
        ]
        }
        
        await sgMail.send(msg)
        
    } 
    catch (error) {
        console.error(error)
    }

}