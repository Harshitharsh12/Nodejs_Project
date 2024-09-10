const express = require("express");
const app = express();
const userModel = require("./Models/user");
const postModel = require("./Models/post");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.get("/", (req, res) => {
  res.render("index");
});
app.post("/create", async (req, res) => {
  let { email, password, age, name, username } = req.body;
  let user = await userModel.findOne({ email });
  if (user) return res.status(500).send("User already Registered!!");
  else
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(password, salt, async (err, hash) => {
        await userModel.create({
          name: name,
          username,
          age,
          email,
          password: hash,
        });
        let token = jwt.sign({ email }, "hololololo");
        res.cookie("token", token);
        res.send("Registration Succesfull!!");
      });
    });
});
app.get("/login", (req, res) => {
  res.render("login");
});
app.post("/login", async (req, res) => {
  let { email, password } = req.body;
  let user = await userModel.findOne({ email });
  if (!user) res.send("Something went Wrong!!");
  else
    bcrypt.compare(password, user.password, (err, result) => {
      if (!result) {
        // res.send("Something went Wrong!!");
        res.redirect("/login");
      } else {
        let token = jwt.sign({ email }, "hololololo");
        res.cookie("token", token);
        res.status(200).send("Login Successfully!!");
      }
    });
});
app.get("/logout", (req, res) => {
  res.cookie("token", "");
  res.redirect("/login");
  // res.send("Logout Successfully!!");
});
app.get("/profile", isLoggedIn, async (req, res) => {
  let user = await userModel
    .findOne({ email: req.user.email })
    // if (!user) res.send("You must be Registered first");
    // else {
    .populate("posts");
  res.render("profile", { user });
  // }
});
app.post("/post", isLoggedIn, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email });
  let post = await postModel.create({
    user: user._id,
    content: req.body.content,
    img: req.body.url,
  });
  user.posts.push(post._id);
  await user.save();
  res.redirect("/profile");
});
function isLoggedIn(req, res, next) {
  if (req.cookies.token === "") res.send("You must be logged in first");
  else {
    let data = jwt.verify(req.cookies.token, "hololololo");
    req.user = data;
    next();
  }
}

app.listen(3000);
