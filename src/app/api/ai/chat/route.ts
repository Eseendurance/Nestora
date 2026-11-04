import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { localAssistant } from "@/lib/ai";
import { runAutomation } from "@/lib/automation";
import { readJsonBody } from "@/lib/request";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";

export async function POST(request: Request) {
  const user = await requireUser();

  const parsed = z
    .object({
      message: z.string().trim().min(1).max(2000),
      conversationId: z.string().min(1).max(128).optional(),
    })
    .safeParse(await readJsonBody(request));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid message." }, { status: 400 });
  }

  const { message, conversationId } = parsed.data;

  const conversation =
    (conversationId
      ? await prisma.aiConversation.findUnique({
          where: { id: conversationId },
        })
      : null) ??
    (await prisma.aiConversation.create({
      data: {
        userId: user.id,
        title: message.slice(0, 60),
      },
    }));

  if (conversation.userId !== user.id) {
    return NextResponse.json(
      { error: "Conversation not found." },
      { status: 404 }
    );
  }

  const [unread, appointments, saved, history] = await Promise.all([
    prisma.automationEvent.count({
      where: { userId: user.id, read: false },
    }),
    prisma.appointment.count({ where: { userId: user.id } }),
    prisma.savedListing.count({ where: { userId: user.id } }),
    prisma.aiMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      take: 10,
    }),
  ]);

  const fallback = localAssistant(message, {
    name: user.fullName.split(" ")[0],
    unread,
    appointments,
    saved,
  });

  let reply = fallback;
  let engine = "NESTORA_LOCAL";

  if (process.env.GEMINI_API_KEY) {
    try {
      const response = await fetch(
        `${GEMINI_URL}/${process.env.GEMINI_MODEL ?? "gemini-2.5-flash"}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": process.env.GEMINI_API_KEY,
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [
                {
                  text: "You are Nestora Assistant, a concise real-estate productivity helper. Help users with property search, affordability, viewing bookings, listings, saved homes and their inbox.",
                },
              ],
            },
            contents: [
              ...history.map((item) => ({
                role: item.role === "assistant" ? "model" : "user",
                parts: [{ text: item.content }],
              })),
              {
                role: "user",
                parts: [{ text: message }],
              },
            ],
            generationConfig: {
              maxOutputTokens: 800,
              temperature: 0.6,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const hosted =
          data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

        if (hosted) {
          reply = hosted.trim();
          engine = "GEMINI";
        }
      }
    } catch (error) {
      console.error("Gemini request failed:", error);
    }
  }

  await prisma.aiMessage.createMany({
    data: [
      {
        conversationId: conversation.id,
        role: "user",
        content: message,
      },
      {
        conversationId: conversation.id,
        role: "assistant",
        content: reply,
      },
    ],
  });

  await prisma.aiConversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  });

  await runAutomation({
    type: "AI_CHAT",
    title: "AI assistant used",
    detail: `Asked: ${message.slice(0, 120)}`,
    userId: user.id,
  });

  return NextResponse.json({
    reply,
    conversationId: conversation.id,
    engine,
  });
}