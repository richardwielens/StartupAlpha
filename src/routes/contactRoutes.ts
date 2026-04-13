import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const router = Router();

const createContactSchema = z.object({
  workspaceId: z.string().min(1, "workspaceId is required"),
  firstName: z.string().min(1, "firstName is required"),
  lastName: z.string().optional(),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional()
});

router.post("/", async (req, res, next) => {
  try {
    const body = createContactSchema.parse(req.body);

    const workspace = await prisma.workspace.findUnique({
      where: { id: body.workspaceId }
    });

    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    const contact = await prisma.contact.create({
      data: {
        workspaceId: body.workspaceId,
        firstName: body.firstName,
        lastName: body.lastName,
        phoneNumber: body.phoneNumber,
        email: body.email
      }
    });

    res.status(201).json(contact);
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const workspaceId = req.query.workspaceId as string | undefined;

    const contacts = await prisma.contact.findMany({
      where: workspaceId ? { workspaceId } : undefined,
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json(contacts);
  } catch (error) {
    next(error);
  }
});

router.get("/:contactId", async (req, res, next) => {
  try {
    const { contactId } = req.params;

    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      include: {
        conversations: {
          include: {
            messages: true
          },
          orderBy: {
            createdAt: "desc"
          }
        }
      }
    });

    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }

    res.json(contact);
  } catch (error) {
    next(error);
  }
});

export default router;