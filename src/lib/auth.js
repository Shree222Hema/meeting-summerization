import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { decode } from "next-auth/jwt";


export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("🔐 AUTH: Authorize attempt for:", credentials?.email);
        
        if (!credentials?.email || !credentials?.password) {
          console.error("❌ AUTH: Missing credentials");
          throw new Error("Invalid credentials");
        }

        // --- SIMPLE AUTH BYPASS ---
        // One fixed email and any password as requested for simplicity
        if (credentials.email === "admin@example.com") {
          console.log("🚀 AUTH: Admin bypass triggered.");
          try {
            let user = await prisma.user.findUnique({
              where: { email: "admin@example.com" }
            });

            if (!user) {
              console.log("🚀 AUTH: Admin user not found, creating default...");
              user = await prisma.user.create({
                data: {
                  name: "Admin User",
                  email: "admin@example.com",
                  password: await bcrypt.hash("password123", 12)
                }
              });
              console.log("✅ AUTH: Admin user created successfully.");
            } else {
              console.log("✅ AUTH: Admin user found in database.");
            }
            return user;
          } catch (dbError) {
            console.error("🚨 AUTH: Database error during bypass:", dbError.message);
            throw new Error("Database connection failed. Please check your DATABASE_URL.");
          }
        }
        // ---------------------------

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          });

          if (!user || !user?.password) {
            console.warn("⚠️ AUTH: User not found or missing password:", credentials.email);
            throw new Error("Invalid credentials");
          }

          const isCorrectPassword = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isCorrectPassword) {
            console.warn("⚠️ AUTH: Incorrect password for:", credentials.email);
            throw new Error("Invalid credentials");
          }

          console.log("✅ AUTH: Standard authentication successful.");
          return user;
        } catch (error) {
          console.error("🚨 AUTH: Unexpected error:", error.message);
          throw error;
        }
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id.toString();
      }
      return token;
    }
  },
  session: {
    strategy: "jwt"
  },
  jwt: {
    async decode({ secret, token }) {
      try {
        return await decode({ secret, token });
      } catch (error) {
        // This handles the "decryption operation failed" error gracefully
        console.warn("🚀 AUTH: JWT decryption failed (likely stale cookie). Clearing session.");
        return null; 
      }
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  }
};
