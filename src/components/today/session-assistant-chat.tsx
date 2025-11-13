"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

import type { PredictionPayload, SessionPayload } from "./dashboard";
import { Button } from "@/components/ui/button";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  attachments?: Array<{ type: "image"; url: string }>;
};

type SessionAssistantChatProps = {
  session: SessionPayload | null;
  onSessionUpdate: (payload: { session: SessionPayload; prediction: PredictionPayload }) => void;
};

type AssistantResponse = {
  messages: Array<{ role: "assistant"; content: string }>;
  session: SessionPayload;
  prediction: PredictionPayload;
};

type AttachmentDraft = {
  preview: string;
  dataUrl: string;
};

const introMessage: ChatMessage = {
  id: "intro",
  role: "assistant",
  content: "I’m here all night. Describe each drink, share how you feel, or drop a photo—I’ll keep the log updated.",
  timestamp: new Date().toISOString(),
};

export function SessionAssistantChat({ session, onSessionUpdate }: SessionAssistantChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([introMessage]);
  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState<AttachmentDraft | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages([
      {
        ...introMessage,
        id: `intro-${session?.id ?? "none"}`,
        timestamp: new Date().toISOString(),
      },
    ]);
    setPendingImage(null);
    setError(null);
  }, [session?.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const disabled = !session || isSending;

  const handleSend = async (event: FormEvent) => {
    event.preventDefault();
    if (!session) {
      setError("Start a session before logging anything.");
      return;
    }

    const trimmed = input.trim();
    if (!trimmed && !pendingImage) {
      return;
    }

    setError(null);
    const newMessage: ChatMessage = {
      id: crypto.randomUUID?.() ?? `${Date.now()}-user`,
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
      attachments: pendingImage
        ? [
            {
              type: "image",
              url: pendingImage.preview,
            },
          ]
        : undefined,
    };

    const nextMessages = [...messages, newMessage];
    setMessages(nextMessages);
    setInput("");
    setPendingImage(null);
    setIsSending(true);

    try {
      const payload = {
        messages: nextMessages.map((message) => ({
          role: message.role,
          content: message.content,
          attachments: message.attachments?.map((attachment) => ({
            type: attachment.type,
            dataUrl: attachment.url,
          })),
        })),
      };

      const response = await fetch(`/api/session/${session.id}/assist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const problem = await response.json().catch(() => ({}));
        const message = problem?.error ?? "Assistant couldn’t process that. Try again.";
        setError(message);
        return;
      }

      const data = (await response.json()) as AssistantResponse;
      if (data.session && data.prediction) {
        onSessionUpdate({ session: data.session, prediction: data.prediction });
      }

      const assistantMessages = data.messages?.length
        ? data.messages
        : [{ role: "assistant" as const, content: "All set." }];

      setMessages((current) => [
        ...current,
        ...assistantMessages.map((message, index) => ({
          id: crypto.randomUUID?.() ?? `${Date.now()}-assistant-${index}`,
          role: "assistant" as const,
          content: message.content,
          timestamp: new Date().toISOString(),
        })),
      ]);
    } catch (err) {
      console.error(err);
      setError("Couldn’t reach Grok. Confirm your API key and try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPendingImage({ preview: result, dataUrl: result });
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const canSend = Boolean(session) && !isSending && (!!input.trim() || !!pendingImage);

  const helperText = useMemo(() => {
    if (!session) {
      return "Start a session to unlock the assistant.";
    }
    return "Describe drinks, feelings, water, snacks, or anything else.";
  }, [session]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 bg-white/5 px-6 py-4">
        <h2 className="text-lg font-semibold text-white">Session assistant</h2>
        <p className="text-sm text-white/60">{helperText}</p>
      </div>
      <div className="flex flex-1 flex-col gap-4 px-6 py-4">
        <div className="flex max-h-[420px] flex-col gap-3 overflow-y-auto pr-1">
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}
          <div ref={endRef} />
        </div>

        {error && (
          <p className="rounded-md border border-red-400 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>
        )}

        {pendingImage && (
          <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-white/15 bg-white/5 p-3 text-sm text-white/70">
            <Image
              src={pendingImage.preview}
              alt="Selected drink"
              width={64}
              height={64}
              className="h-16 w-16 rounded-md object-cover"
              unoptimized
            />
            <div className="flex-1 text-xs">
              <p>Attached photo</p>
              <button
                type="button"
                className="text-[var(--color-primary)] underline"
                onClick={() => setPendingImage(null)}
              >
                Remove
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSend} className="flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-white">
            <button
              type="button"
              className="rounded-full border border-white/30 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/80"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
            >
              Photo
            </button>
            <input
              type="text"
              className="flex-1 bg-transparent text-base text-white placeholder:text-white/40 focus:outline-none"
              placeholder={session ? "“Just had a hazy IPA...”" : "Start a session first"}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={disabled}
            />
          </div>
          <Button type="submit" disabled={!canSend || isSending}>
            {isSending ? "Thinking..." : "Send"}
          </Button>
        </form>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-[var(--color-primary)]/80 text-[var(--color-background)]"
            : "bg-white/10 text-white"
        }`}
      >
        {message.attachments?.map((attachment, index) => (
          <Image
            key={`${message.id}-img-${index}`}
            src={attachment.url}
            alt="Drink attachment"
            width={320}
            height={180}
            className="mb-2 h-32 w-full rounded-xl object-cover"
            unoptimized
          />
        ))}
        <p>{message.content}</p>
        <p className="mt-2 text-[10px] uppercase tracking-wide opacity-70">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}
