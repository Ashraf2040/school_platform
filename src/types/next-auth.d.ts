import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    role: "ADMIN" | "TEACHER";
    id: string;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: "ADMIN" | "TEACHER";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "ADMIN" | "TEACHER";
  }
}
