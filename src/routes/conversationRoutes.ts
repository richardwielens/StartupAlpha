import { Router } from "express";
import { ChannelType, SenderType } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const router = Router();

const createConversationSchema = z.object({
  workspaceId: z.string().min(1, "workspaceId is required"),
  contactId: z.string().min(1, "contactId is required"),
  channel: z.nativeEnum(ChannelType),
  subject: z.string().optional()
});

const createMessageSchema = z.object({
  senderType: z.nativeEnum(SenderType),
  content: z.string().min(1, "content is required"),
  externalMessageId: z.string().optional()
});

router.post("/", async (req, res, next) => {
  try {
    const body = createConversationSchema.parse(req.body);

    const workspace = await prisma.workspace.findUnique({
      where: { id: body.workspaceId }
    });

    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    const contact = await prisma.contact.findUnique({
      where: { id: body.contactId }
    });

    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }

    if (contact.workspaceId !== body.workspaceId) {
      return res.status(400).json({
        error: "Contact does not belong to this workspace"
      });
    }

    const conversation = await prisma.conversation.create({
      data: {
        workspaceId: body.workspaceId,
        contactId: body.contactId,
        channel: body.channel,
        subject: body.subject
      },
      include: {
        contact: true,
        messages: true
      }
    });

    res.status(201).json(conversation);
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const workspaceId = req.query.workspaceId as string | undefined;

    const conversations = await prisma.conversation.findMany({
      where: workspaceId ? { workspaceId } : undefined,
      include: {
        contact: true,
        messages: {
          orderBy: {
            createdAt: "asc"
          }
        }
      },
      orderBy: {
        updatedAt: "desc"
      }
    });

    res.json(conversations);
  } catch (error) {
    next(error);
  }
});

router.get("/:conversationId", async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        contact: true,
        workspace: true,
        messages: {
          orderBy: {
            createdAt: "asc"
          }
        }
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    res.json(conversation);
  } catch (error) {
    next(error);
  }
});

router.post("/:conversationId/messages", async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const body = createMessageSchema.parse(req.body);

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderType: body.senderType,
        content: body.content,
        externalMessageId: body.externalMessageId
      }
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        updatedAt: new Date()
      }
    });

    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
});

router.get("/:conversationId/messages", async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: {
        createdAt: "asc"
      }
    });

    res.json(messages);
  } catch (error) {
    next(error);
  }
});

export default router;