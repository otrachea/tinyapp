const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const { generateRandomString, emailLookup, urlsForUser, checkLoggedIn } = require("./helpers");
const { urlDatabase } = require("./data/urlDB");
const { users } = require("./data/userDB");

app.use(express.static("public"));
app.set("view engine", "ejs");

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
app.use(bodyParser.urlencoded({ extended: true }), cookieParser());

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/u/:shortURL", (req, res) => {
  if (!(req.params.shortURL in urlDatabase)) {
    return res
      .status(400)
      .send(`Error ${res.statusCode}: ${req.params.shortURL} does not exist as a shortURL`);
  }
  res.redirect(urlDatabase[req.params.shortURL].longURL);
});

// -------------- URL INDEX -----------------
app.get("/urls", checkLoggedIn, (req, res) => {
  // if user is not logged in
  // if (!("userID" in req.cookies)) {
  //   const templateVars = {
  //     message: "Please login first to view your URLs",
  //     user: users[req.cookies["userID"]]
  //   };
  //   return res.render("login", templateVars);
  // }

  // if user is logged in displays all their shortURLs
  const templateVars = {
    urls: urlsForUser(users[req.cookies["userID"]].userID, urlDatabase),
    user: users[req.cookies["userID"]]
  };
  res.render("urls_index", templateVars);
});

// ----------- CREATES NEW URL -------------------
app.post("/urls", checkLoggedIn, (req, res) => {
  // if user is not logged in
  // if (!("userID" in req.cookies)) {
  //   return res
  //     .status(403)
  //     .send(`Error ${res.statusCode}: Only logged in users can create new urls`);
  // }

  // if user logged in, can create new shortURLs
  let short = generateRandomString();
  urlDatabase[short] = { longURL: req.body.longURL, userID: req.cookies.userID };
  res.redirect(`/urls/${short}`);
});

// ------------ GETS NEW SHORTURL PAGE --------------
app.get("/urls/new", checkLoggedIn, (req, res) => {
  // if user not logged in
  // if (!("userID" in req.cookies)) {
  //   const templateVars = {
  //     message: "Please login first to create new short URLs",
  //     user: users[req.cookies["userID"]]
  //   };
  //   return res.render("login", templateVars);
  // }
  const templateVars = { user: users[req.cookies["userID"]] };
  res.render("urls_new", templateVars);
});

// ----------- GETS PAGE FOR EACH SHORT URL ----------------

app.get("/urls/:shortURL", checkLoggedIn, (req, res) => {

  // if (!("userID" in req.cookies)) {
  //   const templateVars = {
  //     message: "Please login first to view your URLs",
  //     user: undefined
  //   };
  //   return res.render("login", templateVars);
  // }

  if (!(req.params.shortURL in urlDatabase)) {
    return res.status(401).send("Short URL does not exist");
  }

  if (req.cookies.userID !== urlDatabase[req.params.shortURL].userID) {
    return res.status(403).send("This URL does not belong belong to you");
  }

  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.cookies["userID"]]
  };
  res.render("urls_show", templateVars);
});

// ------------ EDITS EXISTING SHORT ------------------
app.post("/urls/:shortURL", checkLoggedIn, (req, res) => {
  // user not logged in
  // if (!("userID" in req.cookies)) {
  //   return res.redirect("/login");
  // }

  // shortURL not in database
  if (!(req.params.shortURL in urlDatabase)) {
    return res.status(401).send("Short URL does not exist");
  }

  // shortURL does not belong to the logged in user
  if (req.cookies.userID !== urlDatabase[req.params.shortURL].userID) {
    return res.status(403).send("This URL does not belong belong to you");
  }

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
app.post("/urls/:shortURL/delete", checkLoggedIn, (req, res) => {
  // user not logged in
  // if (!("userID" in req.cookies)) {
  //   return res.redirect("/login");
  // }

  // shortURL not in database
  if (!(req.params.shortURL in urlDatabase)) {
    return res.status(401).send("Short URL does not exist");
  }

  // shortURL does not belong to the logged in user
  if (req.cookies.userID !== urlDatabase[req.params.shortURL].userID) {
    return res.status(403).send("This URL does not belong belong to you");
  }

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
  console.log(req.statusCode);
  if (req.statusCode === 403) {
    templateVars.message = "Please login first"
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


