import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const router = Router();

const createWorkspaceSchema = z.object({
  name: z.string().min(1, "name is required")
});

router.post("/", async (req, res, next) => {
  try {
    const body = createWorkspaceSchema.parse(req.body);

    const workspace = await prisma.workspace.create({
      data: {
        name: body.name
      }
    });

    res.status(201).json(workspace);
  } catch (error) {
    next(error);
  }
});

router.get("/", async (_req, res, next) => {
  try {
    const workspaces = await prisma.workspace.findMany({
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json(workspaces);
  } catch (error) {
    next(error);
  }
});

router.get("/:workspaceId", async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        contacts: true,
        conversations: {
          include: {
            contact: true,
            messages: true
          },
          orderBy: {
            createdAt: "desc"
          }
        }
      }
    });

    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    res.json(workspace);
  } catch (error) {
    next(error);
  }
});

export default router;