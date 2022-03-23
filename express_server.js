const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.use(express.static("public"));
// app.use(experss.urlencoded({ extended: false }));
app.set("view engine", "ejs");

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
app.use(bodyParser.urlencoded({ extended: true }), cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {};

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { username: req.cookies["username"] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    username: req.cookies["username"]
  };
  res.render("urls_show", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = {
    username: req.cookies["username"]
  }
  res.render("register", templateVars);
})

app.get("/u/:shortURL", (req, res) => {
  res.redirect(urlDatabase[req.params.shortURL]);
});

app.post("/urls", (req, res) => {
  let short = generateRandomString();
  urlDatabase[short] = req.body.longURL;
  res.redirect(`/urls/${short}`);
});

app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.newLongURL;
  res.redirect(`/urls/${req.params.shortURL}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls")
});

app.post("/login", (req, res) => {
  if (!("username" in req.cookies) && req.body.username) {
    res.cookie("username", req.body.username);
  }
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("username").redirect("/urls");
});

app.post("/register", (req, res) => {
  let userID = generateRandomString();
  users[userID] = { id: userID, email: req.body.email, password: req.body.password };
  res.cookie("username", userID).redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}`);
});


function generateRandomString() {
  let alpha = "abcdefghijklmnopqrsztuvwyz";
  alpha += alpha.toUpperCase() + "0123456789";
  let result = "";

  for (let i = 0; i < 6; i++) {
    result += alpha[Math.floor(Math.random() * 52)];
  }

  return result;
}
