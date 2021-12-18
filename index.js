const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient } = require("mongodb");
const stripe = require("stripe")(process.env.STRIPE_SECRET);
const ObjectId = require("mongodb").ObjectId;
const { parse } = require("dotenv");
const app = express();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.oisx1.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
console.log("mongo pass and name", uri);
async function run() {
  try {
    await client.connect();
    const database = client.db("E_Shop");
    const ClothsCollection = database.collection("Cloths");
    const usersCollection = database.collection("users");
    const ordersCollection = database.collection("orders");
    app.get("/cloths", async (req, res) => {
      const cursor = ClothsCollection.find({});
      const result = await cursor.toArray();
      res.json(result);
    });
    // find SIngle Cloth Api
    app.get("/cloth/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await ClothsCollection.findOne(query);
      // console.log(result);
      res.json(result);
    });
    // order api
    app.post("/orders", async (req, res) => {
      console.log("hitted the orders post api");
      const order = req.body;
      console.log(order);
      const result = await ordersCollection.insertOne(order);
      // console.log(result);
      res.json(result);
    });
    // my order api with pay  query
    app.get("/myorder/:email", async (req, res) => {
      const email = req.params.email;
      const pay = "pay";
      const query = { email: email, pay: pay };
      console.log("email", email);
      const cursor = ordersCollection.find(query);
      const result = await cursor.toArray();
      res.json(result);
    });
    // my order api
    app.get("/totalMyOrder/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      console.log("email", email);
      const cursor = ordersCollection.find(query);
      const result = await cursor.toArray();
      res.json(result);
    });
    // all orders get
    app.get("/allorders", async (req, res) => {
      const cursor = ordersCollection.find({});
      const result = await cursor.toArray();
      res.json(result);
    });
    //update order  status
    app.put("/confirmOrder/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: false };
      const updateDoc = {
        $set: {
          status: "Confirm",
        },
      };
      const result = await ordersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
      console.log("update many", result);
    });
    // update my order after checkout
    app.put("/myorder/:email", async (req, res) => {
      const data = req.body;
      const email = req.params.email;
      const filter = { email: email };
      const options = { upsert: false };
      const updateDoc = {
        $set: {
          pay: "paid",
        },
      };
      const result = await ordersCollection.updateMany(
        filter,
        updateDoc,
        options
      );
      res.json(result);
      console.log("update many", result);
    });
    // cancele order api
    app.delete("/myorder/:id", async (req, res) => {
      console.log("my order hitted", req.params.id);
      const id = req.params.id;
      const result = await ordersCollection.deleteOne({ _id: ObjectId(id) });
      res.json(result);
    });
    // user create and save mongoDb
    app.post("/users", async (req, res) => {
      console.log("reviews", req.body);
      const users = await usersCollection.insertOne(req.body);
      res.json(users);
    });
    app.put("/users", async (req, res) => {
      const user = req.body;
      console.log("users");
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      console.log(result);
      res.json(result);
    });
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let isAdmin = false;
      if (user?.role === "admin") {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    });
    // make admin
    app.put("/admin", async (req, res) => {
      console.log(req.body);
      const user = req.body;
      const filter = { email: user.email };
      const updateDoc = { $set: { role: "admin" } };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.json(result);
    });
    // create payment
    app.post("/create-payment-intent", async (req, res) => {
      const paymentInfo = req.body;
      const amount = paymentInfo.price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "eur",
        automatic_payment_methods: {
          enabled: true,
        },
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    });
  } finally {
    // await client.close();
  }
}
app.get("/testing", (req, res) => {
  res.send("hello testing api");
});
app.get("/", (req, res) => {
  res.send("E Shop server is runnig ");
});
run().catch(console.dir);
app.listen(port, () => {
  console.log("server is runnig the port", port);
});
