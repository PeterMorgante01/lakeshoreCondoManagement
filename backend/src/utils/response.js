function ok(res, data, message = "OK") {
  return res.status(200).json({ message, data });
}

function created(res, data, message = "Created") {
  return res.status(201).json({ message, data });
}

module.exports = { ok, created };