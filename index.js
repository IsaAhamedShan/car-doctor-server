const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const helmet = require('helmet');
var jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const port = process.env.PORT || 5000;

// middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      frameAncestors: ["'self'"],
      formAction: ["'self'"],
      connectSrc: ["'self'", "car-doctor-server-sigma-two.vercel.app"]
    }
  }
}));
//we will use the cookie to client site which is different address than the server thats why we need to set origin and credentials here.
//and also use cookie parser so backend can read the cookies
app.use(
  cors({
    origin: [
      "https://car-service-doctor-fb32a.web.app",
      "https://car-service-doctor-fb32a.firebaseapp.com",
      "http://localhost:5173"
    ],
    // origin: "*",

    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.get("/", (req, res) => {
  res.send("doctor is running");
});

//custom middlewares
const logger = (req, res, next) => {
  console.log(req.host, req.originalUrl);
  next();
};
const verifyToken = (req, res, next) => {
  const token = req.cookies?.token; //we get the cookie in req.cookies because of app.use(cookieParser())
  console.log("value of token in middleware: " + token);
  if (!token) {
    return res.status(401).send({ message: "not authorized." });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decode) => {
    //error hole
    if (error) {
      return res.status(401).send({ message: "unauthorized" });
    }
    //if token is valid then it will call decode function and will decode the token
    if (decode) {
      console.log("decoded token in middleware: ", decode);
      req.user = decode;
      next();
    }
  });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.jeu0kz0.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const serviceCollection = await client
      .db("carDoctor")
      .collection("services");
    const bookingCollection = await client
      .db("carDoctor")
      .collection("bookingList");
    //auth related api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log(user);

      //creating cookies
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1hr",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
        })
        .send({ success: true });
    });
    //service
    app.get("/services", async (req, res) => {
      const response = serviceCollection.find();
      const data = await response.toArray();
      res.send(data);
    });

    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      //by declaring the options will generate only title ,price and service_id of the particular data
      const options = {
        projection: { title: 1, price: 1, service_id: 1, img: 1 },
      };

      const result = await serviceCollection.findOne(query, options);
      res.send(result);
    });

    //booking
    app.get("/booking", logger, verifyToken, async (req, res) => {
      console.log(
        "req.query is : ",
        req.query,
        "\n",
        "req.user is :",
        req.user
      );
      console.log("cookies are:", req.cookies.token);
      if (req.query.email !== req.user.email) {
        return res.status(403).send({ message: "Forbidden access" });
      }
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await bookingCollection.find(query).toArray();

      res.send(result);
    });
    app.post("/booking", async (req, res) => {
      const data = req.body;
      const result = await bookingCollection.insertOne(data);
      res.send(result);
      console.log("data:", data);
    });
    app.post("/logout", async (req, res) => {
      const user = req.body;
      console.log("logging out", user);
      res.clearCookie("token", { maxAge: 0 }).send({ success: true });
    });
    app.patch("/booking/:id", async (req, res) => {
      const _id = req.params.id;
      const filter = { _id: new ObjectId(_id) };
      const updateBooking = req.body;
      console.log(updateBooking);
      //we are not using upsert as are not replacing anything. we are adding status to existing bookings. so no need to use upsert here
      const updateDoc = {
        $set: {
          status: updateBooking.status,
        },
      };

      try {
        const result = await bookingCollection.updateOne(filter, updateDoc);

        if (result.modifiedCount > 0) {
          res
            .status(200)
            .json({ success: true, message: "Booking updated successfully" });
        } else {
          res.status(404).json({
            success: false,
            message: "Booking not found or not updated",
          });
        }
      } catch (error) {
        console.error("Error updating booking:", error);
        res
          .status(500)
          .json({ success: false, message: "Internal server error" });
      }
    });

    app.delete(`/booking/:id`, async (req, res) => {
      const _id = req.params.id;
      const objectId = new ObjectId(_id);
      const result = await bookingCollection.deleteOne({ _id: objectId });
      if (result.deletedCount === 1) {
        console.log("Document deleted successfully");
      } else {
        console.log("Document not found");
      }
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
