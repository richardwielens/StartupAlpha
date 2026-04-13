import express from "express";
import workspaceRoutes from "./routes/workspaceRoutes";
import contactRoutes from "./routes/contactRoutes";
import conversationRoutes from "./routes/conversationRoutes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    status: "ok"
  });
});

app.use("/api/workspaces", workspaceRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/conversations", conversationRoutes);

app.use(errorHandler);

export default app;