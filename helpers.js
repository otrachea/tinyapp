const generateRandomString = () => {
  let alpha = "abcdefghijklmnopqrsztuvwyz";
  alpha += alpha.toUpperCase() + "0123456789";
  let result = "";

  for (let i = 0; i < 6; i++) {
    result += alpha[Math.floor(Math.random() * 52)];
  }

  return result;
}

const emailLookup = (users, email) => {
  for (const user of Object.values(users)) {
    if (user.email === email) {
      return user;
    }
  }
  return false;
}

module.exports = { generateRandomString, emailLookup };