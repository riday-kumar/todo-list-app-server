require("dotenv").config();
const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;

const admin = require("firebase-admin");

const decoded = Buffer.from(
  process.env.FIREBASE_SERVICE_KEY,
  "base64",
).toString("utf8");
const serviceAccount = JSON.parse(decoded);

const { getAuth } = require("firebase-admin/auth");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// middleware
app.use(cors());
app.use(express.json());

const verifyFBToken = async (req, res, next) => {
  const queryEmail = req.query.email;
  const myToken = req.headers.authorization;
  if (!req.headers.authorization) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const getToken = myToken.split(" ")[1];
  if (!getToken) {
    return res.status(401).send({ message: "unauthorized access" });
  }

  try {
    const decode = await getAuth()
      .verifyIdToken(getToken)
      .then((decoded) => {
        req.token_email = decoded.email;
        next();
      });
  } catch {
    return res.status(401).send({ message: "unauthorized access" });
  }
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
    // await client.connect();

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
      if (query !== req.token_email) {
        return res.status(403).send({ message: "Forbidden Access" });
      }
      const filter = { userEmail: query };
      const cursor = tasksCollection.find(filter);
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

    // task show according to the calender of certain user
    app.get("/all-date-task/:date", verifyFBToken, async (req, res) => {
      const query = req.query.email;
      // const taskDate = new Date(req.params.date);
      const taskDate = req.params.date;

      if (query !== req.token_email) {
        return res.status(403).send({ message: "Forbidden Access" });
      }

      const filter = {
        userEmail: query,
        completedTask: false,
        taskTime: taskDate,
      };
      const cursor = tasksCollection.find(filter);
      const result = await cursor.toArray();
      res.send(result);
    });

    // task create api
    app.post("/add-task", verifyFBToken, async (req, res) => {
      // console.log(req.body);
      const newTask = req.body;
      const query = req.query.email;
      if (query !== req.token_email) {
        return res.status(403).send({ message: "Forbidden Access" });
      }
      const result = await tasksCollection.insertOne(newTask);
      res.send(result);
    });

    // task update api
    app.patch("/update-task/:taskId", async (req, res) => {
      // console.log(req.params.taskId);
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

    // task complete api
    app.patch("/task-complete/:taskId", verifyFBToken, async (req, res) => {
      const filter = { _id: new ObjectId(req.params.taskId) };
      // console.log(filter);
      const query = req.query.email;
      if (query !== req.token_email) {
        return res.status(403).send({ message: "Forbidden Access" });
      }
      const updateTask = {
        $set: {
          completedTask: true,
        },
      };
      const result = await tasksCollection.updateOne(filter, updateTask);
      res.send(result);
    });

    // task Delete api
    app.delete("/delete-task/:taskId", verifyFBToken, async (req, res) => {
      const param = req.params.taskId;
      const filter = { _id: new ObjectId(param) };

      const query = req.query.email;
      if (query !== req.token_email) {
        return res.status(403).send({ message: "Forbidden Access" });
      }

      const result = await tasksCollection.deleteOne(filter);
      res.send(result);
    });

    // await client.db("admin").command({ ping: 1 });
    console.log("successfully connected with MongoDB");
  } finally {
    // await client.close()
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
