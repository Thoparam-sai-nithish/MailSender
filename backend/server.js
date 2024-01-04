const dotenv = require('dotenv').config();
const exp = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mClient = require('mongodb').MongoClient

//Create the express server
const app = exp();
app.listen(process.env.PORT||3500, ()=>{console.log(`Server is running on the port 'http://localhost:${process.env.PORT}'`)});
//middlewares 
app.use(cors());
app.use(bodyParser.json());
app.use(exp.json());

//coneect to Database 
url = 'mongodb://127.0.0.1:27017'
mClient.connect(url)
.then((dbServerRef)=>{
    const weChatDb = dbServerRef.db('weChat');
    const accountsCollectionObj = weChatDb.collection('accounts');
    const securityKeysCollectionObj = weChatDb.collection('securityKeys');
    app.set('accountsCollectionObj',accountsCollectionObj);
    app.set('securityKeysCollectionObj',securityKeysCollectionObj);
    console.log('Database Connection Success!');
})
.catch((err)=>{
    console.log('error in connecting to Database! :' ,err.message)
})

// import the multiple Apis
const userApp = require('./APIs/UserApi');

//Routes
app.use('/user',userApp);

//invalid Path middleWare
const invalidPathMiddleWare =(request, response)=>{
    console.log('invalid Path :');
    response.status(400).send('invalid Paht');
}
app.use('*',invalidPathMiddleWare);

//error handling middleware
const errorHandlingMiddleWare = ( error,request,response)=>{
    console.log('Servrice unavailabe! ' ,error.message);
    response.status(400).send(error.message);
}
app.use(errorHandlingMiddleWare);