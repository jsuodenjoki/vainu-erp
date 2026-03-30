import NextAuth from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import config from "@/config";
import mongoClientPromise from "./mongo";
import connectMongoose from "./mongoose";
import mongoose from "mongoose";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("credentials-required");
        }
        try {
          await connectMongoose();
        } catch {}
        const User = mongoose.models.User || (await import("@/models/User")).default;
        const { default: bcrypt } = await import("bcryptjs");

        const user = await User.findOne({ email: credentials.email.toLowerCase() });
        if (!user || !user.password) throw new Error("invalid-credentials");

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) throw new Error("invalid-credentials");

        // Block login until email is verified
        if (!user.emailVerified) {
          throw new Error(`unverified:${user.email}`);
        }

        return { id: user._id.toString(), email: user.email, name: user.name, image: user.image };
      },
    }),

    ...(mongoClientPromise
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_ID,
            clientSecret: process.env.GOOGLE_SECRET,
            async profile(profile) {
              return {
                id: profile.sub,
                name: profile.given_name ? profile.given_name : profile.name,
                email: profile.email,
                image: profile.picture,
                createdAt: new Date(),
              };
            },
          }),
        ]
      : []),
  ],

  ...(mongoClientPromise && { adapter: MongoDBAdapter(mongoClientPromise) }),

  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    jwt: async ({ token, user }) => {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  theme: {
    brandColor: config.colors.main,
    logo: `https://${config.domainName}/logoAndName.png`,
  },
});
