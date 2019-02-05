// Auth flow https://cdn.auth0.com/content/jwt/jwt-diagram.png
// =================================================================
// get the packages we need ========================================
// =================================================================
var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var morgan = require("morgan");
var mongoose = require("mongoose");

var jwt = require("jsonwebtoken"); // used to create, sign, and verify tokens
var User = require("./user"); // get our mongoose model

// =================================================================
// configuration ===================================================
// =================================================================
var port = process.env.PORT || 8080; // used to create, sign, and verify tokens
mongoose.connect("mongodb://localhost:27017/DCI6jsonwebtoken", {
  useNewUrlParser: true
}); // connect to database
app.set("superSecret", "thisshouldbesupersecret"); // secret variable

// use body parser so we can get info from POST and/or URL parameters
app.use(
  bodyParser.urlencoded({
    extended: false
  })
);
app.use(bodyParser.json());

// use morgan to log requests to the console
app.use(morgan("dev"));

// create a sample user
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

// =================================================================
// routes ==========================================================
// =================================================================

// basic route (http://localhost:8080)
app.get("/", function (req, res) {
  res.send("Hello! The API is at http://localhost:" + port + "/api");
});

// ---------------------------------------------------------
// get an instance of the router for api routes
// ---------------------------------------------------------
var apiRoutes = express.Router();

// ---------------------------------------------------------
// authentication (no middleware necessary since this isnt authenticated)
// ---------------------------------------------------------
// http://localhost:8080/api/authenticate
apiRoutes.post("/authenticate", async function (req, res) {
  // find the user
  // [ x ] TODO findOne user by name, if no user found: res.json() with this information
  // [ x ] TODO if user found, but password is wrong: res.json() with this information
  // [ x ] TODO if user is found and password is correct, sign a jwt token and res.json send it back to the client

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
    jwt.sign({
      user: `${user.name}`
    },
      app.get("superSecret"),
      function (err, token) {
        app.get("superSecret");
        console.log("token", token);
        res.json({
          token
        });
      });
  }
});

// ---------------------------------------------------------
// route middleware to authenticate and check token
// ---------------------------------------------------------
apiRoutes.use(function (req, res, next) {
  // check header or url parameters or post parameters for token
  // [ X ] TODO if no token provided res.status(403)
  // [ X ] TODO get the token out of the requests' header
  // [ X ] TODO verify the JWT token


  const token = req.headers["x-access-token"];
  console.log(token);
  if (!token) {
    res.status(403).json({ message: "token required" })
  } else {
    const cert = app.get("superSecret");
    // get public key
    jwt.verify(token, cert, function (err, decoded) {
      console.log(decoded);
      if (err) {
        err = { name: "JsonWebTokenError"};
        res.json(err);
      };
      req.decoded = decoded;
      next();
    });
  }

  // TODO append the token to the req.decoded and run next()
});

// ---------------------------------------------------------
// authenticated routes
// ---------------------------------------------------------
apiRoutes.get("/", function (req, res) {
  console.log("###", req.decoded);
  res.json({
    message: `Welcome ${req.decoded.user}, to the coolest API on earth!`
  });
});

apiRoutes.get("/users", function (req, res) {
  User.find({}, function (err, users) {
    res.json(users);
  });
});

apiRoutes.get("/check", function (req, res) {
  res.json(req.decoded);
});

app.use("/api", apiRoutes);

// =================================================================
// start the server ================================================
// =================================================================
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