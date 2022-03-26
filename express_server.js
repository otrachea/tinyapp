const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const { generateRandomString, getUserByEmail, urlsForUser, checkLoggedIn } = require("./helpers");
const { urlDatabase } = require("./data/urlDB");
const { users } = require("./data/userDB");

app.use(express.static("public"));
app.set("view engine", "ejs");

const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const methodOverride = require("method-override");
app.use(bodyParser.urlencoded({ extended: true }), cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}), methodOverride("_method"));

const bcrypt = require("bcryptjs");

app.get("/", (req, res) => {
  if (!("userID" in req.session)) {
    return res.redirect("/login");
  }
  res.redirect("/urls");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/u/:shortURL", (req, res) => {
  // checks if shortURL actually exists in database
  if (!(req.params.shortURL in urlDatabase)) {
    return res
      .status(400)
      .send(`Error ${res.statusCode}: ${req.params.shortURL} does not exist as a shortURL`);
  }

  let url = urlDatabase[req.params.shortURL];
  url.timesVisited++; 

  // whenever someone clicks on redirection link, gives them a visitor cookie to track
  // if and when they click on the redirection link again
  if (!("visitorID" in req.session)) {
    // creating random visitor id
    req.session.visitorID = (Math.random() * 1000000).toFixed(0).toString().padStart(6, '1');
  }
  // adding each visit 
  url.visitors.push({ visitorID: req.session.visitorID, timeStamp: new Date(Date.now()) });

  res.redirect(url.longURL);
});

// -------------- URL INDEX -----------------
app.get("/urls", checkLoggedIn, (req, res) => {

  // if user is logged in displays all their shortURLs
  const templateVars = {
    urls: urlsForUser(users[req.session.userID].userID, urlDatabase),
    user: users[req.session.userID]
  };
  res.render("urls_index", templateVars);
});

// ----------- CREATES NEW URL -------------------
app.post("/urls", checkLoggedIn, (req, res) => {

  // if user logged in, can create new shortURLs
  let short = generateRandomString();
  urlDatabase[short] = {
    longURL: req.body.longURL,
    userID: req.session.userID,
    timeCreated: new Date().toString(),
    timesVisited: 0,
    visitors: []
  };
  res.redirect(`/urls/${short}`);
});

// ------------ GETS NEW SHORTURL PAGE --------------
app.get("/urls/new", (req, res) => {

  // user not logged in
  if (!("userID" in req.session)) {
    return res.redirect("/login");
  }

  const templateVars = { user: users[req.session.userID] };
  res.render("urls_new", templateVars);
});

// ----------- GETS PAGE FOR EACH SHORT URL ----------------
app.get("/urls/:shortURL", checkLoggedIn, (req, res) => {

  // short url not in database
  if (!(req.params.shortURL in urlDatabase)) {
    return res.status(401).send("Short URL does not exist");
  }

  // url does not belong to logged in user
  if (req.session.userID !== urlDatabase[req.params.shortURL].userID) {
    return res.status(403).send("This URL does not belong belong to you");
  }

  const url = urlDatabase[req.params.shortURL];

  // counts number of unique visitors
  const visitorCount = {};
  for (const visitor of url.visitors) {
    if (!(visitor.visitorID in visitorCount)) {
      visitorCount[visitor.visitorID] = 0;
    }
    visitorCount[visitor.visitorID]++;
  }

  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: url.longURL,
    user: users[req.session.userID],
    timesVisited: url.timesVisited,
    uniqueVisitors: Object.keys(visitorCount).length,
    visitors: url.visitors
  };
  res.render("urls_show", templateVars);
});

// ------------ EDITS EXISTING SHORT ------------------
app.put("/urls/:shortURL", checkLoggedIn, (req, res) => {

  // shortURL not in database
  if (!(req.params.shortURL in urlDatabase)) {
    return res.status(401).send("Short URL does not exist");
  }

  // shortURL does not belong to the logged in user
  if (req.session.userID !== urlDatabase[req.params.shortURL].userID) {
    return res.status(403).send("This URL does not belong belong to you");
  }

  urlDatabase[req.params.shortURL].longURL = req.body.newLongURL;
  res.redirect(`/urls`);
});

// ---------- REGISTRATION---------------
app.get("/register", (req, res) => {

  // if user logged in, redirects to /urls
  if ("userID" in req.session) {
    return res.redirect("/urls");
  }

  const templateVars = {
    user: users[req.session.userID]
  };
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {

  if (!req.body.email) {
    res.statusCode = 400;
    return res.send(`Error ${res.statusCode}: Cannot have empty email`);
  }

  if (getUserByEmail(users, req.body.email)) {
    res.statusCode = 400;
    return res.send(`Error ${res.statusCode}: Email already registered`);
  }

  if (!req.body.password) {
    res.statusCode = 400;
    return res.send(`Error ${res.statusCode}: Cannot have empty password`);
  }

  // creates hashed password and adds newly created user to database
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(req.body.password, salt, (err, hash) => {

      let userID = generateRandomString();

      users[userID] = {
        userID: userID,
        email: req.body.email,
        password: hash
      };

      req.session.userID = userID;
      res.redirect("/urls");
    });
  });

});

// ---------- DELETING URLS -------------
app.delete("/urls/:shortURL/delete", checkLoggedIn, (req, res) => {

  // shortURL not in database
  if (!(req.params.shortURL in urlDatabase)) {
    return res.status(401).send("Short URL does not exist");
  }

  // shortURL does not belong to the logged in user
  if (req.session.userID !== urlDatabase[req.params.shortURL].userID) {
    return res.status(403).send("This URL does not belong belong to you");
  }

  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

// -------------- LOGIN -------------------
app.get("/login", (req, res) => {
  
  // if user logged in, redirects to /urls
  if ("userID" in req.session) {
    return res.redirect("/urls");
  }

  const templateVars = {
    user: users[req.session.userID]
  };
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {

  if (!req.body.email) {
    res.statusCode = 400;
    return res.send(`Error ${res.statusCode}: Cannot have empty email`);
  }

  if (!req.body.password) {
    res.statusCode = 400;
    return res.send(`Error ${res.statusCode}: Cannot have empty password`);
  }

  // gets user from database using provided email
  let user = getUserByEmail(users, req.body.email);

  // no user found
  if (!user) {
    res.statusCode = 403;
    return res.send(`Error ${res.statusCode}: Email not found`);
  }

  // checks if password provided matches hashed password in database
  bcrypt.compare(req.body.password, user.password, (err, success) => {
    if (!success) {
      res.statusCode = 403;
      return res.send(`Error ${res.statusCode}: Incorrect password`);
    }

    // password matches
    req.session.userID = user.userID;
    res.redirect("/urls");

  });

});


// ---------- LOGOUT --------------------
app.post("/logout", (req, res) => {
  // clears cookie and redirects to login
  req.session = null;
  res.redirect("/login");
});


// ----------- ANY NON-EXISTING URL ---------
app.get("*", (req, res) => {
  res.statusCode = 404;
  res.send("Page not found");
});


app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}`);
});


