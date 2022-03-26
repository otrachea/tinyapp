// generates random 6 letter string made up of uppercase, lowercase and numbers
const generateRandomString = () => {
  let alpha = "abcdefghijklmnopqrsztuvwyz";
  alpha += alpha.toUpperCase() + "0123456789";
  let result = "";

  for (let i = 0; i < 6; i++) {
    result += alpha[Math.floor(Math.random() * 52)];
  }

  return result;
};

// finds user in database based on email, returns undefined if no user found 
const getUserByEmail = (users, email) => {
  for (const user of Object.values(users)) {
    if (user.email === email) {
      return user;
    }
  }
  return undefined;
};

// gets all the urls in urlDatabase that are owned by userID and returns
// then as an object where they keys are the urls and the values is
// an object that stores various pieces of info about the url
const urlsForUser = (userID, urlDatabase) => {
  const filteredShortURLS = {};
  for (const url in urlDatabase) {
    if (Object.hasOwnProperty.call(urlDatabase, url)) {
      if (urlDatabase[url].userID === userID) {
        filteredShortURLS[url] = urlDatabase[url];
      }
    }
  }
  return filteredShortURLS;
};

// if user is not logged in, sends 403 error then passes to next
// function in middleware
const checkLoggedIn = (req, res, next) => {
  if (!("userID" in req.session)) {
    return res.status(403).send("Please login first");
  }
  next();
};

module.exports = { generateRandomString, getUserByEmail, urlsForUser, checkLoggedIn };