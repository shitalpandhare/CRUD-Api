module.exports = StatusSuccess = function (req, res, next) {
  res.ok = function (data) {
    return res.status(200).send(data);
  };
  res.created = function (data) {
    return res.status(201).send(data);
  };
  next();
};
