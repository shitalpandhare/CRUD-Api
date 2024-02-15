const User = require("../models/user");
const Redis = require("ioredis");
const StatusError = require("../config/index.js").StatusError;
const StatusSuccess = require("../config/index.js").StatusSuccess;

const redisClient = new Redis();
redisClient.on("connect", () => {
  console.log("connected to redis successfully!");
});
// redisClient.flushdb().then(() => {
//   console.log("Database cleared");
// });
redisClient.on("error", (error) => {
  console.log("Redis connection error :", error);
});

async function isUsernameExists(username) {
  const keys = await redisClient.keys("*");
  let usernameExists = false;
  for (let key of keys) {
    const user = JSON.parse(await redisClient.get(key));
    if (user.username === username) {
      usernameExists = true;
      break;
    }
  }
  return usernameExists;
}
const userController = {
  getAllUsers: (req, res) => {
    try {
      let allUsers = [];
      let dataPromises = [];
      const stream = redisClient.scanStream({
        match: "*",
      });
      const getAsync = (key) =>
        new Promise((resolve, reject) => {
          redisClient.get(key, (err, value) => {
            if (err) {
              reject(err);
            } else {
              resolve(value);
            }
          });
        });

      stream.on("data", (keys) => {
        for (const key of keys) {
          const dataPromise = getAsync(key)
            .then((value) => {
              let user = JSON.parse(value);
              allUsers.push(user);
            })
            .catch((err) => {
              throw StatusError.serverError(err.message);
            });
          dataPromises.push(dataPromise);
        }
      });

      stream.on("end", () => {
        Promise.all(dataPromises)
          .then(() => {
            return res.ok({ users: allUsers });
          })
          .catch((err) => {
            return res.status(err.statusCode).json({ error: err.message });
          });
      });
    } catch (error) {
      return res.status(err.statusCode).json({ error: err.message });
    }
  },
  getUserDetails: async (req, res) => {
    try {
      const userId = req.params.id;
      if (!userId) {
        throw StatusError.badRequest("Missing User id");
      }
      const data = await redisClient.get(userId);
      if (data) {
        const user = JSON.parse(data);
        return res.ok({ userDetails: user });
      } else {
        throw StatusError.notFound("User not found");
      }
    } catch (error) {
      if (error instanceof StatusError) {
        return res.status(error.statusCode).json({ error: error.message });
      } else {
        return res.status(500).json({ error: error.message });
      }
    }
  },
  createUser: async function (req, res, next) {
    try {
      const { username, age, hobbies } = req.body;
      if (!username || !age) {
        throw StatusError.badRequest("Missing required fields");
      } else if (typeof age !== "number") {
        throw StatusError.badRequest("Age should be a number");
      }
      const usernameExists = await isUsernameExists(username);
      if (usernameExists) {
        throw StatusError.conflict("Username already exists");
      }
      const newUser = new User(username, age, hobbies);
      const createdUser = await redisClient.set(
        newUser.id,
        JSON.stringify(newUser)
      );
      if (createdUser !== "OK") {
        throw StatusError.serverError("Error while creating user");
      }
      return res.created({ user: newUser });
    } catch (error) {
      if (error instanceof StatusError) {
        return res.status(error.statusCode).json({ error: error.message });
      } else {
        return res.status(500).json({ error: error.message });
      }
    }
  },
  updateUser: async (req, res) => {
    try {
      const { username, age, hobbies } = req.body;
      const userId = req.params.id;
      if (!username || !age || !userId) {
        throw StatusError.badRequest("Missing required fields");
      } else if (typeof age !== "number") {
        throw StatusError.badRequest("Age should be a number");
      }
      const isUserExists = await redisClient.exists(userId);
      const isUsernameExist = await isUsernameExists(username);
      if (isUserExists) {
        const newUser = new User(username, age, hobbies, userId);
        const updatedUser = await redisClient.set(
          userId,
          JSON.stringify(newUser)
        );
        if (updatedUser === "OK") {
          return res.ok({ user: newUser });
        } else {
          throw StatusError.serverError("Error while updating user");
        }
      } else if (isUsernameExist) {
        throw StatusError.conflict("Username already exists");
      } else {
        throw StatusError.notFound("User not found");
      }
    } catch (error) {
      if (error instanceof StatusError) {
        return res.status(error.statusCode).json({ error: error.message });
      } else {
        return res.status(500).json({ error: error.message });
      }
    }
  },
  deleteUser: async (req, res) => {
    try {
      const userId = req.params.id;
      const result = await redisClient.del(userId);

      if (result) {
        return res.ok({ message: "User has been deleted" });
      } else {
        throw StatusError.notFound("User not found");
      }
    } catch (error) {
      if (error instanceof StatusError) {
        return res.status(error.statusCode).json({ error: error.message });
      } else {
        return res.status(500).json({ error: error.message });
      }
    }
  },
};
module.exports = userController;
