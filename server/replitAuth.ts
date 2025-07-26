import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    authProvider: 'replit',
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    console.log('=== COMPLETE LOGOUT PROCESS ===');
    console.log('Session exists before logout:', !!req.session);
    console.log('Is authenticated before logout:', req.isAuthenticated?.());
    console.log('Cookies before logout:', Object.keys(req.cookies || {}));
    
    // Clear session and Firebase cookies
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
      }
      
      console.log('After req.logout - clearing ALL cookies and session data');
      
      // Clear ALL possible auth cookies
      const cookiesToClear = ['firebase-auth', 'connect.sid', 'session', 'auth-token'];
      cookiesToClear.forEach(cookieName => {
        res.clearCookie(cookieName, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/'
        });
        // Also clear without httpOnly for client-side cookies
        res.clearCookie(cookieName, {
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/'
        });
      });
      
      // Destroy session completely and forcefully
      if (req.session) {
        req.session.destroy((destroyErr) => {
          if (destroyErr) {
            console.error('Session destroy error:', destroyErr);
          } else {
            console.log('Session destroyed successfully on logout');
          }
        });
      }
      
      // Set additional headers to prevent caching
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      // For development, redirect to localhost with proper port and clear query params
      const redirectUrl = process.env.NODE_ENV === 'production' 
        ? `${req.protocol}://${req.hostname}` 
        : 'http://localhost:5000';
      
      console.log('LOGOUT COMPLETE - Redirecting to:', redirectUrl);
      
      // Add cache control headers to prevent caching of redirect
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      res.redirect(302, redirectUrl);
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  // Check Replit auth first
  if (req.isAuthenticated() && user && user.expires_at) {
    const now = Math.floor(Date.now() / 1000);
    if (now <= user.expires_at) {
      return next();
    }

    const refreshToken = user.refresh_token;
    if (refreshToken) {
      try {
        const config = await getOidcConfig();
        const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
        updateUserSession(user, tokenResponse);
        return next();
      } catch (error) {
        // Fall through to Firebase auth check
      }
    }
  }

  // Check Firebase auth cookie
  const firebaseAuth = req.cookies['firebase-auth'];
  if (firebaseAuth) {
    try {
      const userData = JSON.parse(Buffer.from(firebaseAuth, 'base64').toString());
      if (userData.exp > Date.now()) {
        // Create compatible user object for downstream middleware
        req.user = {
          claims: {
            sub: userData.sub,
            email: userData.email,
            first_name: userData.first_name,
            last_name: userData.last_name,
            profile_image_url: userData.profile_image_url,
          },
          authProvider: userData.authProvider
        };
        return next();
      }
    } catch (error) {
      // Invalid Firebase token, fall through
    }
  }

  return res.status(401).json({ message: "Unauthorized" });
};
