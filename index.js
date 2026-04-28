require("dotenv").config();
const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
var cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("What will be your next target");
});
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.ivoyxep.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // connect the client to the server
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("successfully connected with MongoDB");
  } finally {
    // await client.close()
  }
}

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
run().catch(console.dir);
