import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    // Debug logging like in your other project
    console.log("🚀 REGISTER: Attempting user registration...");
    console.log("🔗 DATABASE_URL length:", process.env.DATABASE_URL ? process.env.DATABASE_URL.length : "NOT SET");

    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const exists = await prisma.user.findUnique({
      where: { email }
    });

    if (exists) {
      console.warn("⚠️ REGISTER: User already exists with email:", email);
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Using 12 rounds to match your other project's security pattern
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword
      }
    });

    console.log("✅ REGISTER: User created successfully:", user.id);

    return NextResponse.json({ 
      message: "User registered successfully",
      user: { id: user.id, email: user.email, name: user.name } 
    }, { status: 201 });

  } catch (error) {
    console.error("❌ REGISTER ERROR:", error);
    return NextResponse.json(
      { message: "Registration failed. " + (error.message || "Try again later.") },
      { status: 500 }
    );
  }
}
