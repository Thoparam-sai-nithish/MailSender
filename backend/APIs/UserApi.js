const exp = require('express')
const userApp = exp.Router()
const expAsyncHandler = require('express-async-handler')
const sendEmail =require('../utils/sendEmail')
const expressAsyncHandler = require('express-async-handler')
const bcryptjs =require('bcryptjs');
const jwt = require('jsonwebtoken')
const bodyParser = require('body-parser')

userApp.use(bodyParser.json())
userApp.use(exp.json())
//send Email
userApp.post('/sendEmail', expAsyncHandler(async(req ,res)=>{
    try{
        const {recieverEmail,emailSubject,emailMessege} = req.body;
        const sentTo  =recieverEmail
        const sendFrom = process.env.EMAIL_USER
        const replayTo = sentTo
        const subject = emailSubject
        const message = `
            <h3>Email body goes here</h3>
            <p>${emailMessege}</p>
            <p>regards...</p>
        `
        await sendEmail(subject,message,sentTo,sendFrom,replayTo)
        res.status(200).send("Email SEnt Succesfully")
    }catch(err){
        console.log("Error in sending the mail (userApp.js) : ",err);
        res.status(500).send({message:"Error in sending the mail (userApp.js)",payload:err.message})    
    }
}))

//Create Account
userApp.post('/createAccount',expAsyncHandler(async(req,res)=>{
    const accountsCollectionObj = req.app.get('accountsCollectionObj');
    const newUser = req.body;
    let doesUserExist = await accountsCollectionObj.findOne({userName:newUser.userName})
    if(doesUserExist!==null) res.status(200).send({message:'User Already Exists'})
    else{
        const hashedPassword = await bcryptjs.hash(newUser.userPassword,3);
        newUser.userPassword = hashedPassword;
        console.log('new User :',newUser)
        await accountsCollectionObj.insertOne(newUser)
        try{
            // const {userEmail,userPassword} = req.body;
            const sentTo  =newUser.userEmail
            const sendFrom = process.env.EMAIL_USER
            const replayTo = sentTo
            const subject = 'Account has been created succesfuly'
            const emailMessege='Congratulations your new weChat account has been created succefully!.\nIf this was not done by you report the account'
            const message = `
            <div className='bg-secondary bg-opacity-75'>
                <h3 className='text-success fw-bold'>Account Created !</h3>
                <p>${emailMessege}</p>
                <h4>your account details are</h4>
                <p>name:${newUser.userName}</p>
                <p>email:${newUser.userEmail}</p>
                <p>mobile:${newUser.userMobile}</p>
                <p>Date of birth:${newUser.userDob}</p>
                <p>regards...</p>
            </div>
            `
            await sendEmail(subject,message,sentTo,sendFrom,replayTo)
            // res.status(200).send("Email SEnt Succesfully")
            res.status(200).send({message:'success'})
        }
        catch(err){
            console.log("Error in sending the mail (userApp.js) : ",err);
            res.status(500).send({message:"Error in sending the mail (userApp.js)",payload:err.message})    
        }
    }





    

}))

//Login to Account
userApp.post('/login',expressAsyncHandler(async(req,res)=>{
    const accountsCollectionObj = req.app.get('accountsCollectionObj');
    const submitedDetails = req.body;
    const dbAccount = await accountsCollectionObj.findOne({userEmail:submitedDetails.userEmail});
    console.log('Submitted details are: ',submitedDetails)
    console.log('Db Account is:', dbAccount)

    if(dbAccount === null) {
        res.status(200).send({message:'user not found'});
    } else {
        let passCheck = await bcryptjs.compare(submitedDetails.userPassword,dbAccount.userPassword)
        // console.log(passCheck)
        if(passCheck!= true) {
            res.status(200).send({message:'password not matched!'});
        }else{
            const privateKey = 'weChat'
            let jwToken = jwt.sign(dbAccount,privateKey,{expiresIn:'7d'})

            // send confirmation mail
            try{
                const sentTo  =submitedDetails.userEmail
                const sendFrom = process.env.EMAIL_USER
                const replayTo = sentTo
                const subject = 'New login detected'
                const emailMessege='We have detected a new login to your weChat Account!.\nIf this was not done by you report the account'
                const message = `
                <div className='bg-secondary bg-opacity-75'>
                    <h3 className='text-success fw-bold'>Security Alert!</h3>
                    <p>${emailMessege}</p>
                    <h4>your account details are</h4>
                    <p>name: ${dbAccount.userName}</p>
                    <p>email: ${submitedDetails.userEmail}</p>
                    <p>mobile: ${dbAccount.userMobile}</p>
                    <p>Thank you...</p>
                </div>
                `
                await sendEmail(subject,message,sentTo,sendFrom,replayTo)
                // res.status(200).send("Email SEnt Succesfully")
                res.status(200).send({message:'success',jwToken})
            }
            catch(err){
                console.log("Error in sending the mail (userApp.js) : ",err);
                res.status(500).send({message:"Error in sending the mail (userApp.js)",payload:err.message})    
            }
        }
    }
    
}))

//Forget Password
userApp.post('/forgetPassword',expAsyncHandler(async(req,res)=>{
    const accountsCollectionObj = req.app.get('accountsCollectionObj');
    const securityKeysCollectionObj = req.app.get('securityKeysCollectionObj');
    const data = req.body;
    const dbAccount = await accountsCollectionObj.findOne({userEmail:data.userEmail});    
    if(dbAccount === null) res.status(200).send({message:'User Not Found'});    
    else{
        const otp = Math.floor(100000 + Math.random() * 900000);
        await securityKeysCollectionObj.deleteOne({userEmail:data.userEmail});
        await securityKeysCollectionObj.insertOne({userEmail:data.userEmail,userOtp:otp})
        // console.log(otp);
        
        // send otp via Email
        try{
            const sentTo  =data.userEmail
            const sendFrom = process.env.EMAIL_USER
            const replayTo = sentTo
            const subject = 'weChat Confirmation OTP'
            const emailMessege='Confirmation OTP for weChat account is below code.\nIf this was not done by you dont share OTP with anyone and ignore this messgae'
            const message = `
            <div className='bg-secondary bg-opacity-75'>
                <h3 className='text-success fw-bold'>Security Alert!</h3>
                <p>${emailMessege}</p>
                <h5> Your OTP : ${otp}</h5>
                <p>Thank you...</p>
            </div>
            `
            await sendEmail(subject,message,sentTo,sendFrom,replayTo)
            res.status(200).send({message:'success'})
        }
        catch(err){
            console.log("Error in sending the mail (userApp.js) : ",err);
            res.status(500).send({message:"Error in sending the mail (userApp.js)",payload:err.message})    
        }
    
        // res.send({otp:otp})
    }
}))

//checkOtp
userApp.post('/verifyPasswordOtp',expAsyncHandler(async(req,res)=>{
    const securityKeysCollectionObj = req.app.get('securityKeysCollectionObj');
    const data=req.body;
    // console.log(data)
    const dbSecurityKey = await securityKeysCollectionObj.findOne({userEmail: data.userEmail})
    // console.log(dbSecurityKey)
    if(dbSecurityKey === null) res.status(200).send({message:'user not found'});
    else {
        if((+data.userOtp)===dbSecurityKey.userOtp) res.status(200).send({message:'success'});
        else res.status(200).send({message:'Invalid OTP'});
    }
}))

//update Password
userApp.post('/updatePassword',expAsyncHandler(async(req,res)=>{
    const accountsCollectionObj = req.app.get('accountsCollectionObj');
    const securityKeysCollectionObj = req.app.get('securityKeysCollectionObj');
    const data = req.body;
    const dbAccount = await accountsCollectionObj.findOne({userEmail:data.userEmail});
    if(dbAccount === null) res.status(200).send({message:'User Not Found'})   
    else{
        dbAccount.userPassword = data.userPassword;
        data.userPassword = await bcryptjs.hash(data.userPassword,3);
        await accountsCollectionObj.updateOne({userEmail:data.userEmail},{$set: { userPassword: data.userPassword }})
        // console.log( 'user From updated',await accountsCollectionObj.findOne({userEmail:data.userEmail}))
        await securityKeysCollectionObj.deleteOne({userEmail:dbAccount.userEmail})
        res.status(200).send({message:'success'});
    }
}))

//Get user Details
userApp.post('/getUserDetails',expAsyncHandler(async(req,res)=>{
    const accountsCollectionObj = req.app.get('accountsCollectionObj');
    const reqData = req.body
    try{
        const userData = jwt.verify(reqData.token,'weChat');
        console.log('token is valid ')
        console.log('user Details : ',userData);
        res.status(200).send({message:'ok',details:userData})
    }catch{
        console.log('invalid token!')
        res.status(200).send({message:'invalid token'})
    }
}))
module.exports=userApp;