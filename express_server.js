const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const { generateRandomString, emailLookup } = require("./helpers");

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

const users = {
  '1': {
    userID: "1",
    email: "fdsa@gmail.com",
    password: "test"
  }
};

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// -------------- URL INDEX -----------------
app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["userID"]]
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  let short = generateRandomString();
  urlDatabase[short] = req.body.longURL;
  res.redirect(`/urls/${short}`);
});

// ------------ CREATE NEW SHORT URL --------------
app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies["userID"]] };
  res.render("urls_new", templateVars);
});

// ----------- PAGE FOR EACH SHORT URL ----------------
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: users[req.cookies["userID"]]
  };
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.newLongURL;
  res.redirect(`/urls/${req.params.shortURL}`);
});

// ---------- REGISTRATION---------------
app.get("/register", (req, res) => {
  if (req.cookies["userID"]) {
    return res.redirect("/urls");
  }
  const templateVars = {
    user: users[req.cookies["userID"]]
  }
  res.render("register", templateVars);
})

app.post("/register", (req, res) => {
  if (!req.body.email) {
    res.statusCode = 400;
    return res.send("Error 400: Cannot have empty email");
  }

  if (emailLookup(users, req.body.email)) {
    res.statusCode = 400;
    return res.send("Error 400: Email already registered");
  }

  if (!req.body.password) {
    res.statusCode = 400;
    return res.send("Error 400: Cannot have empty password");
  }

  let userID = generateRandomString();
  users[userID] = { userID: userID, email: req.body.email, password: req.body.password };
  res.cookie("userID", userID).redirect("/urls");
});

// ---------- DELETING URLS -------------
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls")
});


// -------------- LOGIN -------------------
app.get("/login", (req, res) => {
  if (req.cookies["userID"]) {
    return res.redirect("/urls");
  }
  const templateVars = {
    user: users[req.cookies["userID"]]
  }
  res.render("login", templateVars);
})

app.post("/login", (req, res) => {
  if (!req.body.email) {
    res.statusCode = 400;
    return res.send("Error 400: Cannot have empty email");
  }

  if (!req.body.password) {
    res.statusCode = 400;
    return res.send("Error 400: Cannot have empty password");
  }

  let user = emailLookup(users, req.body.email);
  if (user) {
    if (user.password === req.body.password) {
      return res.cookie("userID", user.userID).redirect("/urls");
    }

    // incorrect password
    res.statusCode = 403;
    return res.send("Error 403: Incorrect password");
  }

  res.statusCode = 403;
  return res.send("Error 403: Email not found");

});


// ---------- LOGOUT --------------------
app.post("/logout", (req, res) => {
  res.clearCookie("userID").redirect("/urls");
});


app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}`);
});


