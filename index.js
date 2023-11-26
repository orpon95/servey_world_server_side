const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
require('dotenv').config()
const port = process.env.PORT || 5000;



// middeleware
app.use(cors());
app.use(express.json());
// console.log(process.env.DB_PASS);


// mongodb start


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ww7s5no.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        client.connect();
        // database creation and collection
        const database = client.db("surveyDB");
        const surveyCollection = database.collection("survey");
        const UsersCollection = database.collection("Users");
        const usersSurveyInfoCollection = database.collection("usersSurveyInfo");

        // post api for storing user info

        app.post("/v1/users", async (req, res) => {
            const users = req.body;
            console.log(users);

            const email = users.email
            const query = { email: email }


            const existUser = await UsersCollection.findOne(query)
            if (existUser) {
                return res.send({ message: "user already exists", insertedId: null })
            }
            // const timestamp = new Date()
            const result = await UsersCollection.insertOne(users)
            res.send(result)
        })
        // get api for getting all user info
        app.get("/v1/users", async (req, res) => {
            const cursor = UsersCollection.find()
            const result = await cursor.toArray()
            res.send(result)

        })

        // delte api from usercollection
        app.delete("/v1/users/:id", async (req, res) => {
            const id = req.params.id
            console.log("pls delte ", id)
            const query = { _id: new ObjectId(id) }
            const result = await UsersCollection.deleteOne(query)
            res.send(result)
        })

        // patch api update data in usercollection
        app.patch("/v1/usersRole/:id", async (req, res) => {

            const id = req.params.id;
            // console.log(id);
            const filter = { _id: new ObjectId(id) }
            // const options = {upsert:true}
            const updatedData = req.body
            // console.log("in patch",updatedData);

            // get
            const existUser = await UsersCollection.findOne(filter)
            if (existUser.role === "admin") {
                return res.send({ message: "user already exists", modifiedCount: null })
            }
            const setUpdatedData = {
                $set: {
                    role: updatedData.role
                }
            }


            const result = await UsersCollection.updateOne(filter, setUpdatedData)
            res.send(result)
            // console.log(updatedData);
        })
        // post api storing users survey info

        app.post("/v1/usersSurveyInfo", async (req, res) => {
            const surveysInfo = req.body;
            console.log(surveysInfo);
            const id = surveysInfo.usersid
            const query = { usersid: id }


            const existUser = await usersSurveyInfoCollection.findOne(query)
            if (existUser) {
                return res.send({ message: "user already exists", insertedId: null })
            }
            const result = await usersSurveyInfoCollection.insertOne(surveysInfo)
            // const timestamp = new Date()
            res.send(result)
        })

        // get api for getting all data from usersurveysinfo collection
        app.get("/v1/usersSurveyInfo", async (req, res) => {
            const cursor = usersSurveyInfoCollection.find()
            const result = await cursor.toArray()
            res.send(result)

        })






        // post api for suveys

        app.post("/v1/surveys", async (req, res) => {
            const surveys = req.body;
            console.log(surveys);
            const result = await surveyCollection.insertOne(surveys)
            // const timestamp = new Date()
            res.send(result)
        })
        // get api for getting all data from surveys collection
        app.get("/v1/allSurveys", async (req, res) => {
            const cursor = surveyCollection.find()
            const result = await cursor.toArray()
            res.send(result)

        })


        // Send a ping to confirm a successful connection
        client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

// mongodb end

// testing api
app.get("/", (req, res) => {
    res.send("survey server")
})

app.listen(port, () => {
    console.log(`survey server at port ${port}`)
})