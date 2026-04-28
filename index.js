require("dotenv").config();
const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
var cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

const verifyFBToken = (req, res, next) => {
  next();
};

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

    const toToDB = client.db("focus_flue");
    const usersCollection = toToDB.collection("users");
    const tasksCollection = toToDB.collection("tasks");

    // user created api
    app.post("/users", async (req, res) => {
      const email = req.body.email;
      const existingUser = await usersCollection.findOne({ email });

      if (!existingUser) {
        await usersCollection.insertOne({
          email,
          createdAt: new Date(),
        });
      }

      res.send({ success: true });
    });

    // all task getting api
    app.get("/all-task", verifyFBToken, async (req, res) => {
      const query = req.query.email;
      // console.log(query);
      const cursor = tasksCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // specific task shown
    app.get("/all-task/:taskId", async (req, res) => {
      const param = req.params.taskId;
      const query = { _id: new ObjectId(param) };
      const result = await tasksCollection.findOne(query);
      res.send(result);
    });

    // task create api
    app.post("/add-task", async (req, res) => {
      // console.log(req.body);
      const newTask = req.body;
      const result = await tasksCollection.insertOne(newTask);
      res.send(result);
    });

    // task update
    app.patch("/update-task/:taskId", async (req, res) => {
      console.log(req.params.taskId);
      const filter = { _id: new ObjectId(req.params.taskId) };
      const updateDoc = {
        $set: {
          taskTitle: req.body.updatedTitle,
          taskDescription: req.body.updatedDescription,
          taskPriority: req.body.updatedPriority,
          taskTime: req.body.updatedDate,
        },
      };
      const result = await tasksCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log("successfully connected with MongoDB");
  } finally {
    // await client.close()
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
