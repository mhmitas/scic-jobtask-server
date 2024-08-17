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
    origin: ["http://localhost:5173", "https://mh-computershop.vercel.app"],
    credentials: true,
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

        // productColl.updateMany({ category: "laptop" }, {
        //     $set: {
        //         productImage: "https://res.cloudinary.com/dquqygs9h/image/upload/v1723730793/wufyiruy4xxleymgfqps.png"
        //     }
        // }).then(res => console.log(res))

        // ! think before touch this api
        // get total products count 
        app.get("/total-products", async (req, res) => {
            const search = req.query.search?.trim()
            let category = {};
            if (req.query?.category && req.query?.category?.trim()) {
                category = { category: req.query.category.trim() }
            }
            let brand = {};
            if (req.query?.brand && req.query?.brand?.trim()) {
                brand = { brand: req.query.brand.trim() }
            }
            console.log(brand)
            const minPrice = parseInt(req.query?.minPrice) || 0
            const maxPrice = parseInt(req.query?.maxPrice) || 3000
            const priceQ = {
                price: { $gt: minPrice, $lt: maxPrice }
            }
            const agg = [
                {
                    $match: { ...category, ...brand, ...priceQ }
                },
                {
                    $count: "totalProducts"
                }
            ]
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
            const totalProducts = await productColl.aggregate(agg).toArray();
            if (totalProducts.length === 0) {
                return res.status(200).send({ totalProducts: 0 })
            }
            res.status(200).send(totalProducts[0])
        })
        // Mountain of Query
        // get products 
        app.get("/products", async (req, res) => {
            const search = req.query.search?.trim()
            let category = {};
            let brand = {};
            // skip and limit
            let limit = parseInt(req.query?.limit) || 12
            let skip = parseInt(req.query?.skip) || 0

            if (req.query?.category && req.query?.category?.trim()) {
                category = { category: req.query.category.trim() }
            }
            if (req.query?.brand && req.query?.brand?.trim()) {
                brand = { brand: req.query.brand.trim() }
            }
            const minPrice = parseInt(req.query?.minPrice) || 0
            const maxPrice = parseInt(req.query?.maxPrice) || 3000
            const priceQ = {
                price: { $gt: minPrice, $lt: maxPrice }
            }
            const pipeline = [
                {
                    $match: { ...category, ...brand, ...priceQ }
                }
            ]
            // conditionally add stages
            if (req.query?.sort === "priceHighToLow") {
                sort = { $sort: { price: -1 } }
                pipeline.push(sort)
            }
            if (req.query?.sort === "priceLowToHigh") {
                sort = { $sort: { price: 1 } }
                pipeline.push(sort)
            }
            if (req.query?.sort === "releasedDate") {
                sort = { $sort: { released: -1 } };
                pipeline.push(sort)
            }
            pipeline.push({ $skip: skip })
            pipeline.push({ $limit: limit })
            // Check if search query is valid (at least 3 characters)
            if (search && search.length > 2) {
                pipeline.splice(
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
            const products = await productColl.aggregate(pipeline).toArray();
            res.status(200).send(products)
        })
        // get a product
        app.get("/products/product/:id", async (req, res) => {
            const id = req.params?.id
            if (!ObjectId.isValid(id)) {
                return res.status(400).send("Invalid object id")
            }
            const product = await productColl.findOne({ _id: new ObjectId(id) })
            if (!product) {
                return res.status(404).send("Product not found")
            }
            res.status(200).send(product)
        })
        // add a new products
        app.post("/products/add-new", async (req, res) => {
            const { brand, category, description, price, productImage, productName, released } = req.body;
            if (!brand || !category || !description || !price || !productImage || !productName || !released) {
                return res.status(400).send("all fields are required")
            }
            const result = await productColl.insertOne(
                {
                    brand, category, description, price, productImage, productName, released: new Date(released),
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
async function generateToken(name, email, _id, type) {
    const token = jwt.sign(
        { name, email, _id, type },
        process.env.ACCESS_TOKE_SECRET,
        { expiresIn: "10d" }
    )
    return token
}
const cookieOptions = {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    secure: process.env.NODE_ENV === 'production' ? true : false
}


/* 


*/