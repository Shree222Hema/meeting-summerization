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
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        // --- SIMPLE AUTH BYPASS ---
        // One fixed email and any password as requested for simplicity
        if (credentials.email === "admin@example.com") {
          console.log("🚀 AUTH: Admin bypass used.");
          let user = await prisma.user.findUnique({
            where: { email: "admin@example.com" }
          });

          if (!user) {
            user = await prisma.user.create({
              data: {
                name: "Admin User",
                email: "admin@example.com",
                password: await bcrypt.hash("password123", 12)
              }
            });
          }
          return user;
        }
        // ---------------------------

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        });

        if (!user || !user?.password) {
          throw new Error("Invalid credentials");
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isCorrectPassword) {
          throw new Error("Invalid credentials");
        }

        return user;
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
