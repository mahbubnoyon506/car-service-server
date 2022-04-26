const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
const app =express();

app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next){
    const authHeader = req.headers.authorization;
    console.log('Insite JWT Verify', authHeader);
    if(!authHeader){
       return res.status(401).send({message : 'Unauthorised Access'});
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
       if(err){
           return res.status(403).send({message: 'Forbidden access'})
       }
       console.log('decoded', decoded);
       req.decoded = decoded;
       next();
    })
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7mpo3.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        await client.connect();
        const serviceCollection = client.db('carServices').collection('services');
        const orderCollection = client.db('carServices').collection('order');

        app.get('/service', async(req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        })

        app.get('/service/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const service = await serviceCollection.findOne(query);
            res.send(service)
        })

        app.post('/service', async(req, res) => {
            const newServices = req.body;
            const result = await serviceCollection.insertOne(newServices);
            res.send(result);
        })

        app.delete('/service/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await serviceCollection.deleteOne(query);
            res.send(result);
        })

        // order collection
        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        })

        app.get('/orders', verifyJWT, async(req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            if( email === decodedEmail){
                const query = {email : email};
                const cursor = orderCollection.find(query);
                const orders = await cursor.toArray();
                res.send(orders);
            }
            else{
                res.status(403).send({message: 'Forbidden access'})
            }
        })

        //JWT Authentication
        app.post('/login', async(req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN);
            res.send({accessToken});
        })
    }
    finally{

    }
}

run().catch(console.dir())

app.get('/', (req, res) => {
    res.send('Server running')
});

app.listen(port, () => {
    console.log('Listening the port', port);
})
