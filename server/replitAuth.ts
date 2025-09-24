import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import storage from "./storage";

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
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', // CSRF protection
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
    // Debug: Uncomment for logout process debugging
    
    // Clear ALL auth cookies with different options
    const cookiesToClear = ['connect.sid', 'session', '__session'];
    cookiesToClear.forEach(cookieName => {
      // Clear with all possible configurations
      res.clearCookie(cookieName, { path: '/', httpOnly: true, secure: false });
      res.clearCookie(cookieName, { path: '/', httpOnly: false, secure: false });
      res.clearCookie(cookieName, { path: '/', domain: undefined });
      res.clearCookie(cookieName);
    });

    // Destroy session completely
    if (req.session) {
      req.session.destroy((err) => {
      });
    }

    // Development mode - simple redirect after cookie clearing
    if (process.env.NODE_ENV === 'development') {
      
      // Add client-side script to clear localStorage and force fresh reload
      const clearStorageScript = `
        <html>
          <head><title>Abmeldung...</title></head>
          <body>
            <div style="text-align: center; padding: 50px; font-family: Arial;">
              <h2>Erfolgreich abgemeldet</h2>
              <p>Sie werden weitergeleitet...</p>
            </div>
            <script>
              localStorage.removeItem('clubflow-selected-club');
              localStorage.removeItem('clubflow-navigation');
              localStorage.removeItem('clubflow-theme');
              setTimeout(() => window.location.href = '/', 1000);
            </script>
          </body>
        </html>
      `;
      
      // Anti-cache headers
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Content-Type': 'text/html'
      });
      
      return res.send(clearStorageScript);
    }

    // Production mode - use proper Replit logout
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
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
        // Fall through to email auth check
      }
    }
  }

  // Check email/password session authentication
  const session = req.session as any;
  if (session?.user?.id) {
    try {
      const storage = (await import('./storage')).default;
      const sessionUser = await storage.getUser(session.user.id);
      if (sessionUser && sessionUser.authProvider === 'email') {
        // Add user to request for compatibility with existing code
        (req as any).user = {
          id: sessionUser.id,
          claims: {
            sub: sessionUser.id,
            email: sessionUser.email,
            name: `${sessionUser.firstName} ${sessionUser.lastName}`
          }
        };
        return next();
      }
    } catch (error) {
    }
  }

  return res.status(401).json({ message: "Unauthorized" });
};
