import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-85692d7a/health", (c) => {
  return c.json({ status: "ok" });
});

// Initialize a new session with creator
app.post("/make-server-85692d7a/session/:sessionId/init", async (c) => {
  try {
    const sessionId = c.req.param("sessionId");
    const { creatorId } = await c.req.json();
    console.log(`Initializing session ${sessionId} with creator ${creatorId}`);
    await kv.set(`session:${sessionId}:creator`, creatorId);
    console.log(`Creator saved successfully for session ${sessionId}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error initializing session: ${error}`);
    return c.json({ error: "Failed to initialize session", details: String(error) }, 500);
  }
});

// Get session data (prompt, revealed state, responses)
app.get("/make-server-85692d7a/session/:sessionId", async (c) => {
  try {
    const sessionId = c.req.param("sessionId");
    
    // Get each value individually to ensure correct mapping
    const prompt = await kv.get(`session:${sessionId}:prompt`);
    const revealed = await kv.get(`session:${sessionId}:revealed`);
    const responses = await kv.get(`session:${sessionId}:responses`);
    const creatorId = await kv.get(`session:${sessionId}:creator`);
    
    console.log(`Getting session ${sessionId}:`, {
      prompt,
      revealed,
      responses,
      creatorId
    });
    
    return c.json({
      prompt: prompt || "Share your thoughts...",
      revealed: revealed === "true",
      responses: responses ? JSON.parse(responses) : [],
      creatorId: creatorId || null,
    });
  } catch (error) {
    console.log(`Error getting session data: ${error}`);
    return c.json({ error: "Failed to get session data", details: String(error) }, 500);
  }
});

// Update prompt
app.post("/make-server-85692d7a/session/:sessionId/prompt", async (c) => {
  try {
    const sessionId = c.req.param("sessionId");
    const { prompt } = await c.req.json();
    await kv.set(`session:${sessionId}:prompt`, prompt);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error updating prompt: ${error}`);
    return c.json({ error: "Failed to update prompt", details: String(error) }, 500);
  }
});

// Toggle revealed state
app.post("/make-server-85692d7a/session/:sessionId/reveal", async (c) => {
  try {
    const sessionId = c.req.param("sessionId");
    const { revealed, userId } = await c.req.json();
    
    // Verify the user is the session creator
    const creatorId = await kv.get(`session:${sessionId}:creator`);
    if (creatorId && userId !== creatorId) {
      return c.json({ error: "Only the session creator can reveal responses" }, 403);
    }
    
    await kv.set(`session:${sessionId}:revealed`, revealed ? "true" : "false");
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error toggling reveal state: ${error}`);
    return c.json({ error: "Failed to toggle reveal state", details: String(error) }, 500);
  }
});

// Submit or update response
app.post("/make-server-85692d7a/session/:sessionId/response", async (c) => {
  try {
    const sessionId = c.req.param("sessionId");
    const { userId, userName, text } = await c.req.json();
    
    // Get current responses
    const responsesData = await kv.get(`session:${sessionId}:responses`);
    const responses = responsesData ? JSON.parse(responsesData) : [];
    
    // Remove any existing response from this user
    const filteredResponses = responses.filter((r: any) => r.authorId !== userId);
    
    // Add new response
    const newResponse = {
      id: `${userId}-${Date.now()}`,
      text,
      authorName: userName,
      authorId: userId,
      timestamp: Date.now(),
    };
    
    const updatedResponses = [...filteredResponses, newResponse];
    await kv.set(`session:${sessionId}:responses`, JSON.stringify(updatedResponses));
    
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error submitting response: ${error}`);
    return c.json({ error: "Failed to submit response", details: String(error) }, 500);
  }
});

// Delete user's response
app.delete("/make-server-85692d7a/session/:sessionId/response/:userId", async (c) => {
  try {
    const sessionId = c.req.param("sessionId");
    const userId = c.req.param("userId");
    
    // Get current responses
    const responsesData = await kv.get(`session:${sessionId}:responses`);
    const responses = responsesData ? JSON.parse(responsesData) : [];
    
    // Remove response from this user
    const updatedResponses = responses.filter((r: any) => r.authorId !== userId);
    await kv.set(`session:${sessionId}:responses`, JSON.stringify(updatedResponses));
    
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting response: ${error}`);
    return c.json({ error: "Failed to delete response", details: String(error) }, 500);
  }
});

// Clear all responses (reset session)
app.delete("/make-server-85692d7a/session/:sessionId/clear", async (c) => {
  try {
    const sessionId = c.req.param("sessionId");
    await kv.mset([
      [`session:${sessionId}:responses`, "[]"],
      [`session:${sessionId}:revealed`, "false"],
    ]);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error clearing session: ${error}`);
    return c.json({ error: "Failed to clear session", details: String(error) }, 500);
  }
});

Deno.serve(app.fetch);