const assert = require("chai").assert;

const { getUserByEmail } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe("#getUserByEmail", () => {
  it("should return a user with a valid email", () => {
    assert.deepEqual(getUserByEmail(testUsers, "user@example.com"), {
      id: "userRandomID",
      email: "user@example.com",
      password: "purple-monkey-dinosaur"
    })
  });

  it("should return false when no email found", () => {
    assert.isUndefined(getUserByEmail(testUsers, "notinDB@test.com"));
  });

});