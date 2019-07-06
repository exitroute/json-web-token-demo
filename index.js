var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var morgan = require("morgan");
var mongoose = require("mongoose");

var jwt = require("jsonwebtoken");
var User = require("./user");

var port = process.env.PORT || 8080;
mongoose.connect("mongodb://localhost:27017/DCI6jsonwebtoken", {
  useNewUrlParser: true
});
app.set("superSecret", "thisshouldbesupersecret");

app.use(
  bodyParser.urlencoded({
    extended: false
  })
);
app.use(bodyParser.json());

app.use(morgan("dev"));

(async () => {
  const users = await User.find({});
  if (users.length == 0) {
    console.log(`No user in database, lets create some`);
    var user = new User({
      name: "alice",
      password: "password",
      admin: true
    });
    await user.save();
    console.log("User saved successfully");
  }
})();

app.get("/", function(req, res) {
  res.send("Hello! The API is at http://localhost:" + port + "/api");
});

var apiRoutes = express.Router();

apiRoutes.post("/authenticate", async function(req, res) {
  
  console.log("req.body", req.body);
  const user = await User.findOne({ name: req.body.name });
  console.log("user", user);
  if (!user) {
    res.json({
      message: "User not found"
    });
  } else if (req.body.password !== user.password) {
    res.json({ message: "password does not match" });
  } else if (req.body.password === user.password) {
    jwt.sign(
      {
        user: `${user.name}`
      },
      app.get("superSecret"),
      function(err, token) {
        app.get("superSecret");
        console.log("token", token);
        res.json({
          token
        });
      }
    );
  }
});

apiRoutes.use(function(req, res, next) {
  const token = req.headers["x-access-token"];
  console.log(token);
  if (!token) {
    res.status(403).json({ message: "token required" });
  } else {
    const cert = app.get("superSecret");
    // get public key
    jwt.verify(token, cert, function(err, decoded) {
      console.log(decoded);
      if (err) {
        err = { name: "JsonWebTokenError" };
        res.json(err);
      }
      req.decoded = decoded;
      next();
    });
  }

  // TODO append the token to the req.decoded and run next()
});

apiRoutes.get("/", function(req, res) {
  console.log("###", req.decoded);
  res.json({
    message: `Welcome ${req.decoded.user}, to the coolest API on earth!`
  });
});

apiRoutes.get("/users", function(req, res) {
  User.find({}, function(err, users) {
    res.json(users);
  });
});

apiRoutes.get("/check", function(req, res) {
  res.json(req.decoded);
});

app.use("/api", apiRoutes);

app.listen(port);
console.log(``);
console.log(`#######################################################`);
console.log("The api-url is localhost:" + port);
console.log(``);
console.log(
  `A user is in the database with username: alice and password: password`
);
console.log(``);
console.log(
  `The plan is to authenticate that user with postman per /api/authenticate and the username and password per raw/json`
);
console.log(`#######################################################`);
console.log(``);
