const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
require('dotenv').config()
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
const jwt = require("jsonwebtoken")
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
        // client.connect();
        // database creation and collection
        const database = client.db("surveyDB");
        const surveyCollection = database.collection("survey");
        const UsersCollection = database.collection("Users");
        const usersSurveyInfoCollection = database.collection("usersSurveyInfo");
        const PaymentHistory = database.collection("PaymentHistory");

        // jwt relared api
        // token api
        app.post("/api/v1/jwt", async (req, res) => {
            const user = req.body;
            console.log(user);
            // const result = await jobscollection.insertOne(addedjobs)
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" })

            // res.cookie("token", token, {
            //     httpOnly: true,
            //     // secure: true,
            //     // sameSite: "none",
            //     secure: process.env.NODE_ENV === 'production',
            //     sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            //     // maxAge: 60 * 60 * 1000


            // })

            // .send({ success: true })
            res.send({ token })


        })
        // verifytoken middelwares
        const verifytoken = (req, res, next) => {
            console.log("token in verify", req.headers.authorization);
            if (!req.headers.authorization) {
                return res.status(401).send({ message: "forbidden access" })

            }
            const token = req.headers.authorization.split(" ")[1]
            console.log("split toke ", token);
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: "forbidden access" })

                }
                req.decoded = decoded
                next()
            })
            // next()


        }

        // verify surveyor
        const verifySurveyor = async (req, res, next) => {
            const email = req.decoded.email
            const query = { email: email }
            const user = await UsersCollection.findOne(query)
            const Surveyor = user?.role === "surveyor"
            if (!Surveyor) {
                return res.status(403).send({ message: "forbidden access" })

            }
            next()
        }
        // verify admin
        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email
            const query = { email: email }
            const user = await UsersCollection.findOne(query)
            const isAdmin = user?.role === "admin"
            if (!isAdmin) {
                return res.status(403).send({ message: "forbidden access" })

            }
            next()
        }



        // admin check
        app.get("/v1/users/admin/:email", verifytoken, async (req, res) => {
            // console.log("token in get alluser", req.headers);
            const email = req.params.email
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: "forbidden access" })
            }
            const query = { email: email }
            const user = await UsersCollection.findOne(query)
            let admin = false
            if (user) {
                admin = user.role === "admin"
            }
            res.send({ admin })
            // const cursor = UsersCollection.find()
            // const result = await cursor.toArray()
            // res.send(result)

        })
        // surveyor check
        app.get("/v1/users/surveyor/:email", verifytoken, async (req, res) => {
            // console.log("token in get alluser", req.headers);
            const email = req.params.email
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: "forbidden access" })
            }
            const query = { email: email }
            const user = await UsersCollection.findOne(query)
            let surveyor = false
            if (user) {
                surveyor = user.role === "surveyor"
            }
            res.send({ surveyor })
            // const cursor = UsersCollection.find()
            // const result = await cursor.toArray()
            // res.send(result)

        })
        // pro check
        app.get("/v1/users/prouser/:email", verifytoken, async (req, res) => {
            // console.log("token in get alluser", req.headers);
            const email = req.params.email
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: "forbidden access" })
            }
            const query = { email: email }
            const user = await UsersCollection.findOne(query)
            let Pro_user = false
            if (user) {
                Pro_user = user.role === "Pro_user"
            }
            res.send({ Pro_user })
            // const cursor = UsersCollection.find()
            // const result = await cursor.toArray()
            // res.send(result)

        })

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
        app.get("/v1/users", verifytoken, verifyAdmin, async (req, res) => {
            // console.log("token in get alluser", req.headers);
            const cursor = UsersCollection.find()
            const result = await cursor.toArray()
            res.send(result)

        })

        // delte api from usercollection
        app.delete("/v1/users/:id", verifyAdmin, async (req, res) => {
            const id = req.params.id
            console.log("pls delte ", id)
            const query = { _id: new ObjectId(id) }
            const result = await UsersCollection.deleteOne(query)
            res.send(result)
        })

        // patch api update data in usercollection
        app.patch("/v1/usersRole/:id", verifyAdmin, async (req, res) => {

            const id = req.params.id;
            console.log("surveyorid", id);
            const filter = { _id: new ObjectId(id) }
            // const options = {upsert:true}
            const updatedData = req.body
            console.log("in patch surv", updatedData);

            // get
            const existUser = await UsersCollection.findOne(filter)
            if (existUser.role === "admin" || existUser.role === "surveyor") {
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
        // patch api update data for pro user in usercollection
        // app.patch("/v2/usersRole/:email", verifyAdmin, async (req, res) => {

        //     const email = req.params.email;
        //     console.log("surveyoremail", email);
        //     const filter = { email:email }

        //     const updatedData = req.body
        //     console.log("in patch surv", updatedData);

        //     // get
        //     const existUser = await UsersCollection.findOne(filter)
        //     if (existUser.role === "admin" || existUser.role === "surveyor" || existUser.role === "pro") {
        //         return res.send({ message: "user already exists", modifiedCount: null })
        //     }
        //     const setUpdatedData = {
        //         $set: {
        //             role: updatedData.role
        //         }
        //     }


        //     const result = await UsersCollection.updateOne(filter, setUpdatedData)
        //     res.send(result)
        //     // console.log(updatedData);
        // })
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
            console.log("sort valu",req.query.sort);
            const filter = req.query

            const query = {
                category: {$regex: filter.sort}
            }
            const cursor = surveyCollection.find(query)
            const result = await cursor.toArray()
            res.send(result)

        })
        // pathch in survey coollection for unpulish user
        app.patch("/v1/unpublishSurvey/:id", async (req, res) => {

            const id = req.params.id;
            console.log(id);
            const filter = { _id: new ObjectId(id) }
            // const options = {upsert:true}
            const updatedData = req.body
            console.log("in patch of unpublish", updatedData);

            // get
            const existUser = await surveyCollection.findOne(filter)
            if (existUser.status === "unpublish") {
                return res.send({ message: "user already exists", modifiedCount: null })
            }
            const setUpdatedData = {
                $set: {
                    status: updatedData.status,
                    feedback: updatedData.feedback,

                }
            }


            const result = await surveyCollection.updateOne(filter, setUpdatedData)
            res.send(result)
            // console.log(updatedData);
        })

        // update in suurvey collection
        app.put("/api/v1/surveyUpdate/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true }
            const updatedProduct = req.body
            console.log("inside updated", id, updatedProduct);

            const setUpdatedProduct = {
                $set: {
                    title: updatedProduct?.title,
                    category: updatedProduct?.category,

                    short_description: updatedProduct?.short_description,
                    timestamp: updatedProduct?.timestamp,

                }
            }
            const result = await surveyCollection.updateOne(filter, setUpdatedProduct, options)
            res.send(result)
        })

        // payment api
        app.post("/create-payment-intent", async (req, res) => {
            const { price } = req.body;
            const amount = parseInt(price * 100)
            console.log(amount);

            // Create a PaymentIntent with the order amount and currency
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                payment_method_types: [
                    "card"
                ]
            });

            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });
        // apyment end

        // payment history api for storing payment info and role update to pro users


        app.post("/v1/paymentHistory/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email: email }

            const payment = req.body;
            console.log("inside paymenr", payment);
            const result = await PaymentHistory.insertOne(payment)
            const setUpdatedData = {
                $set: {
                    role: "Pro_user"
                }
            }
            const Patchresult = await UsersCollection.updateOne(query, setUpdatedData)

            res.send({ result, Patchresult })
        })

        // patment history get apoi

        app.get("/v2/paymentHistory/:email", verifytoken, async (req, res) => {
            console.log(" payment email", req.params?.email);
            let query = {}
            if (req?.params?.email) {
                query = { email: req?.params?.email }
            }
            const cursor = PaymentHistory.find(query)
            const result = await cursor.toArray()
            res.send(result)

        })
        // patment history get apoi

        app.get("/v2/allpaymentHistory/:email", verifytoken, async (req, res) => {
            console.log(" allpayment email", req.params?.email);
            
            const cursor = PaymentHistory.find()
            const result = await cursor.toArray()
            res.send(result)

        })





        // Send a ping to confirm a successful connection
        // client.db("admin").command({ ping: 1 });
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