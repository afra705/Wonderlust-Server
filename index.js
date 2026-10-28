"use client";
import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import cors from "cors";
import "dotenv/config";
import { createRemoteJWKSet, jwtVerify } from "jose";

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json({ limit: "5mb" }));
//mongodb
const client = new MongoClient(process.env.MONGODB_URI);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}
const mongoClient = await connectToMongoDB();

const db = mongoClient.db("wanderlust");
const destinationCollection = db.collection("destination");
const bookingCollection = db.collection("bookings");
const userCollection = db.collection("user");


const verifyApi = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send({ msg: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).send({ msg: "Unauthorized" });
  }

  const JWKS = createRemoteJWKSet(
    new URL(`${process.env.CLIENT_URI}/api/auth/jwks`)
  );

  try {
    const { payload } = await jwtVerify(token, JWKS);

    console.log(payload);
    next();
  } catch (error) {
    console.log(error);
    return res.status(401).send({ msg: "Invalid Token" });
  }
};


app.get("/", (req, res) => {
  res.send("Hello World!");
});
// create
app.post("/destination", verifyApi, async (req, res) => {
  const data = req.body;
  const result = await destinationCollection.insertOne(data);
  console.log(result);
  res.send(result);
});
// all-destination

app.get("/destinations", async (req, res) => {
  const result = await destinationCollection.find().toArray();
  res.send(result);
});

// read
app.get("/destinations/:id", verifyApi, async (req, res) => {
  const { id } = req.params;
  const result = await destinationCollection.findOne({ _id: new ObjectId(id) });
  res.send(result);
});
// edit
app.patch("/destination/:id", async (req, res) => {
  const { id } = req.params;
  const updatedata = req.body;
  const result = await destinationCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: updatedata },
  );
  res.json(result);
});
// delete
app.delete("/destination/:id", async (req, res) => {
  const { id } = req.params;
  const updatedata = req.body;
  const result = await destinationCollection.deleteOne({
    _id: new ObjectId(id),
  });
  res.json(result);
});

app.post("/bookings", async (req, res) => {
  const data = req.body;
  const result = await bookingCollection.insertOne(data);
  console.log(result);
  res.send(result);
});

app.get("/my-bookings/:email", async (req, res) => {
  const { email } = req.params;
  const result = await bookingCollection.find({ email: email }).toArray();
  res.send(result);
});

// booking delete
app.delete("/my-bookings/:id", async (req, res) => {
  const { id } = req.params;
  const result = await bookingCollection.deleteOne({ _id: id });
  res.send(result);
});

// Profile update
app.patch("/profile/:id", async (req, res) => {
  const { id } = req.params;
  const { name, image } = req.body;

  const result = await userCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { name, image } },
  );

  res.json(result);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
