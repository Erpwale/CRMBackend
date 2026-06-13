const express = require("express");
const router = express.Router();

router.post("/start-work/:id", async (req, res) => {
  const user = await Support.findById(req.params.id);

  const now = new Date();

  if (user.currentStatus === "bench") {
    const benchTime =
      Math.floor((now - user.statusStartedAt) / 1000);

    user.totalBenchSeconds += benchTime;
  }

  user.currentStatus = "work";
  user.statusStartedAt = now;

  await user.save();

  res.json(user);
});

router.post("/start-bench/:id", async (req, res) => {
  const user = await Support.findById(req.params.id);

  const now = new Date();

  if (user.currentStatus === "work") {
    const workTime =
      Math.floor((now - user.statusStartedAt) / 1000);

    user.totalWorkSeconds += workTime;
  }

  user.currentStatus = "bench";
  user.statusStartedAt = now;

  await user.save();

  res.json(user);
});
router.get("/timer/:id", async (req, res) => {
  const user = await Support.findById(req.params.id);

  const now = new Date();

  const currentSeconds =
    Math.floor((now - user.statusStartedAt) / 1000);

  let workSeconds = user.totalWorkSeconds;
  let benchSeconds = user.totalBenchSeconds;

  if (user.currentStatus === "work") {
    workSeconds += currentSeconds;
  } else {
    benchSeconds += currentSeconds;
  }

  res.json({
    status: user.currentStatus,
    workSeconds,
    benchSeconds,
  });
});


module.exports = router;