const nodemailer = require('nodemailer');
const sendEmail = async (subject, message, send_to, sent_from, replay_to)=>{

    //create email transporter
    const transporter = nodemailer.createTransport({
        host:process.env.EMAIL_HOST,
        port: "587", //standerd SMTP port
        auth:{
            user:process.env.EMAIL_USER,
            pass:process.env.EMAIL_PASS,
        }, 
        tls: { 
            rejectUnauthorized:false,
        }
    })   

    //Set email Layout and body
    const options = {
        from: sent_from,
        to: send_to,
        replayTo: replay_to,
        subject: subject,
        html: message ,
        dsn: {
            id: 'some random message specific id',
            return: 'headers',
            notify: 'success',
            recipient: 'thoparamsainithish1234@gmail.com'
        }
    } 

    //send eamil
    await transporter.sendMail(options, (err, info)=>{
        if(err){ 
            console.log(err);            
        }
        else {
            console.log(info);           
        }
    })


}


module.exports = sendEmail;