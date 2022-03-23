const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const { generateRandomString, emailLookup, urlsForUser } = require("./helpers");

app.use(express.static("public"));
app.set("view engine", "ejs");

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
app.use(bodyParser.urlencoded({ extended: true }), cookieParser());

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "aJ48lW"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "aJ48lW"
  }
};

const users = {
  'aJ48lW': {
    userID: "aJ48lW",
    email: "fdsa@gmail.com",
    password: "test"
  },
  'zusVIt': {
    userID: 'zusVIt',
    email: "test@test.com",
    password: "a"
  }
};

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/u/:shortURL", (req, res) => {
  if (!(req.params.shortURL in urlDatabase)) {
    res.statusCode = 404;
    return res.send(`Error ${res.statusCode}: ${req.params.shortURL} does not exist as a shortURL`);
  }
  res.redirect(urlDatabase[req.params.shortURL].longURL);
});

// -------------- URL INDEX -----------------
app.get("/urls", (req, res) => {
  if (!("userID" in req.cookies)) {
    const templateVars = {
      message: "Please login first to view your URLs",
      user: users[req.cookies["userID"]]
    };
    return res.render("login", templateVars);
  }

  const templateVars = {
    urls: urlsForUser(users[req.cookies["userID"]].userID, urlDatabase),
    user: users[req.cookies["userID"]]
  };
  res.render("urls_index", templateVars);
});

// ----------- CREATES NEW URL -------------------
app.post("/urls", (req, res) => {
  if (!("userID" in req.cookies)) {
    res.statusCode = 400;
    return res.send(`Error ${res.statusCode}: Only logged in users can create new urls`);
  }
  let short = generateRandomString();
  urlDatabase[short] = { longURL: req.body.longURL, userID: req.cookies.userID };
  res.redirect(`/urls/${short}`);
});

// ------------ GETS NEW SHORTURL PAGE --------------
app.get("/urls/new", (req, res) => {
  if (!("userID" in req.cookies)) {
    return res.redirect("/login");
  }
  const templateVars = { user: users[req.cookies["userID"]] };
  res.render("urls_new", templateVars);
});

// ----------- GETS PAGE FOR EACH SHORT URL ----------------
app.get("/urls/:shortURL", (req, res) => {
  if (!("userID" in req.cookies)) {
    return res.redirect("/login");
  }

  if (req.cookies.userID !== urlDatabase[req.params.shortURL].userID) {
    return res.redirect("/urls");
  }

  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.cookies["userID"]]
  };
  res.render("urls_show", templateVars);
});


// ------------ EDITS EXISTING SHORT ------------------
app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL].longURL = req.body.newLongURL;
  res.redirect(`/urls/${req.params.shortURL}`);
});

// ---------- REGISTRATION---------------
app.get("/register", (req, res) => {
  if ("userID" in req.cookies) {
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
    return res.send(`Error ${res.statusCode}: Cannot have empty email`);
  }

  if (emailLookup(users, req.body.email)) {
    res.statusCode = 400;
    return res.send(`Error ${res.statusCode}: Email already registered`);
  }

  if (!req.body.password) {
    res.statusCode = 400;
    return res.send(`Error ${res.statusCode}: Cannot have empty password`);
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
  if ("userID" in req.cookies) {
    return res.redirect("/urls");
  }
  const templateVars = {
    message: undefined,
    user: users[req.cookies["userID"]]
  }
  res.render("login", templateVars);
})

app.post("/login", (req, res) => {
  if (!req.body.email) {
    res.statusCode = 400;
    return res.send(`Error ${res.statusCode}: Cannot have empty email`);
  }

  if (!req.body.password) {
    res.statusCode = 400;
    return res.send(`Error ${res.statusCode}: Cannot have empty password`);
  }

  let user = emailLookup(users, req.body.email);
  if (user) {
    if (user.password === req.body.password) {
      return res.cookie("userID", user.userID).redirect("/urls");
    }

    // incorrect password
    res.statusCode = 403;
    return res.send(`Error ${res.statusCode}: Incorrect password`);
  }

  res.statusCode = 403;
  return res.send(`Error ${res.statusCode}: Email not found`);

});


// ---------- LOGOUT --------------------
app.post("/logout", (req, res) => {
  res.clearCookie("userID").redirect("/login");
});


app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}`);
});


