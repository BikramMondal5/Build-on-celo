import 'dotenv/config';
import {connectDB} from './db';
import express, { type Request, Response, NextFunction, RequestHandler } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import session, { Session, SessionData } from 'express-session';

declare module 'express-session' {
  interface SessionData {
    walletAddress?: string;
    user?: {
      walletAddress: string;
      role: string;
    };
  }
}

// Extend Express Request type to include session
declare global {
  namespace Express {
    interface Request {
      session: Session & Partial<SessionData>;
    }
  }
}

// Simple in-memory session store
const sessions: Record<string, any> = {};
const app = express();

// Configure CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5000');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Custom session middleware
const sessionMiddleware: RequestHandler = (req, res, next) => {
  // Get session ID from cookie or generate a new one
  let sessionId = req.headers.cookie?.split('; ')
    .find((row: string) => row.startsWith('connect.sid='))
    ?.split('=')[1];

  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2, 15);
    res.cookie('connect.sid', sessionId, { 
      httpOnly: true, 
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
      sameSite: 'lax'
    });
  }

  console.log('🔐 Session ID:', sessionId);

  // Initialize session if it doesn't exist
  if (!sessions[sessionId]) {
    sessions[sessionId] = {};
    console.log('✨ Created new session');
  } else {
    console.log('♻️ Using existing session:', JSON.stringify(sessions[sessionId]));
  }

  // Add session to request
  req.session = sessions[sessionId];
  req.session.id = sessionId;
  
  // IMPORTANT: Make save method update the reference
  req.session.save = function(callback: (err?: any) => void) {
    console.log('💾 Saving session:', sessionId);
    console.log('📦 Session data:', JSON.stringify(req.session));
    sessions[sessionId] = { ...req.session }; // Create new object to ensure reference update
    console.log('✅ Session saved successfully');
    callback();
    return this;
  };
  
  req.session.destroy = function(callback: (err?: any) => void) {
    delete sessions[sessionId];
    res.clearCookie('connect.sid', { path: '/' });
    callback();
    return this;
  };
  
  req.session.regenerate = function(callback: (err?: any) => void) {
    const oldSession = { ...req.session };
    delete sessions[sessionId];
    const newSessionId = Math.random().toString(36).substring(2, 15);
    sessions[newSessionId] = oldSession;
    res.cookie('connect.sid', newSessionId, { 
      httpOnly: true, 
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
      sameSite: 'lax'
    });
    req.session = sessions[newSessionId];
    callback();
    return this;
  };
  
  req.session.reload = function(callback: (err?: any) => void) {
    callback();
    return this;
  };
  
  req.session.touch = function() {
    return this;
  };

  next();
};

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(sessionMiddleware);

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json.bind(res);
  res.json = function (bodyJson: any) {
    capturedJsonResponse = bodyJson;
    return originalResJson(bodyJson);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await connectDB();
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
 const port = 5000;
  server.listen(port, () => {
    log(`serving on port ${port}`);
  });
})();
