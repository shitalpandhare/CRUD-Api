const { v4: uuidv4 } = require("uuid");
class User {
  constructor(username, age, hobbies, id = null) {
    this.id = id === null ? uuidv4() : id;
    this.username = username;
    this.age = age;
    this.hobbies = hobbies;
  }
}
module.exports = User;
