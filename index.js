require("dotenv").config()
const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require("jsonwebtoken")
const cookieParser = require('cookie-parser')
const cors = require("cors")
const app = express()
const port = process.env.PORT || 5000;

// middlewares
app.use(cors({
    origin: ["http://localhost:5173", "https://mhvocabulary.vercel.app"], credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}))
app.use(express.json())
app.use(cookieParser())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.jt5df8u.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// const uri = "mongodb://localhost:27017";

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        deprecationErrors: true,
    }
});

const db = client.db("mhStore")
const productColl = db.collection("products");
const userColl = db.collection("users")

async function run() {
    try {

        // get products 
        app.get("/products", async (req, res) => {
            const search = req.query.search?.trim()
            // console.log(search)
            const agg = []
            // Check if search query is valid (at least 3 characters)
            if (search && search.length > 2) {
                agg.splice(
                    0, 0,
                    {
                        $search: {
                            index: "default",
                            text: {
                                query: search,
                                path: {
                                    wildcard: "*",
                                },
                            },
                        },
                    }
                )
            }
            // Perform aggregation
            const result = await productColl.aggregate(agg).toArray();
            res.status(200).send(result)
        })
        // add a new products
        app.post("/products/add-new", async (req, res) => {
            const { brand, category, description, price, productImage, productName, released } = req.body;
            if (!brand || !category || !description || !price || !productImage || !productName || !released) {
                return res.status(400).send("all fields are required")
            }
            const result = await productColl.insertOne(
                {
                    brand, category, description, price, productImage, productName, released,
                    createdAt: new Date()
                }
            )
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    }
    finally {
        // hello world
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

// utils
async function generateToken(name, email, _id) {
    const token = jwt.sign(
        { name, email, _id },
        process.env.JWT_SECRET,
        { expiresIn: "12h" }
    )
    return token
}
const cookieOptions = {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    secure: process.env.NODE_ENV === 'production' ? true : false
}


/* 
// // authentication apis
// app.post("/auth/sign-up", async (req, res) => {
//     const { displayName, email } = req.body;
//     if (!displayName || !email) {
//         return res.status(400).send("all fields are required")
//     }
//     const result = await userColl.insertOne({ displayName, email })
//     const token = jwt.sign(
//         { displayName, email },
//         process.env.ACCESS_TOKE_SECRET,
//         { expiresIn: "10d" }
//     )
//     res.status(200).send({ result, token })
// })

*/