import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

router.get("/", authRequired, async (req, res) => {
  const userId = req.user.sub;
  const drafts = await prisma.emailDraft.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      sendLogs: true,
    },
  });
  res.json({ drafts });
});

export default router;
