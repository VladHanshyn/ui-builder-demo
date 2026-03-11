"use client";

import React, { useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import type { ChatMessage, GenerationStep } from "../types";

interface ChatPanelProps {
  messages: ChatMessage[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  generationStep: GenerationStep;
  disabled?: boolean;
}

export function ChatPanel({
  messages,
  inputValue,
  onInputChange,
  onSend,
  generationStep,
  disabled = false,
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle keyboard
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && inputValue.trim()) {
        onSend();
      }
    }
  };

  const isLoading = generationStep === "generating" || generationStep === "validating";

  return (
    <div className="flex flex-col h-full bg-[var(--color-base-surface-primary)] rounded-lg border border-[var(--color-base-stroke)]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--color-base-stroke)]">
        <h2 className="text-sm font-semibold text-[var(--color-base-primary)]">
          UI Builder
        </h2>
        <p className="text-xs text-[var(--color-base-tertiary)]">
          Describe the UI you want to generate
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Generation Status */}
      {isLoading && (
        <div className="px-4 py-2 border-t border-[var(--color-base-stroke)] bg-[var(--color-brand-primary)]/[0.05]">
          <div className="flex items-center gap-2">
            <LoadingDots />
            <span className="text-xs text-[var(--color-brand-primary)]">
              {generationStep === "generating" ? "Generating..." : "Validating..."}
            </span>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-[var(--color-base-stroke)]">
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the page you want to create..."
            disabled={disabled || isLoading}
            rows={2}
            className="flex-1 px-3 py-2 rounded-md border border-[var(--color-base-stroke)] bg-[var(--color-base-surface-secondary)] text-sm text-[var(--color-base-primary)] placeholder:text-[var(--color-base-tertiary)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/20 disabled:opacity-50"
          />
          <Button
            onClick={onSend}
            disabled={disabled || isLoading || !inputValue.trim()}
            isLoading={isLoading}
          >
            Send
          </Button>
        </div>
        <p className="mt-1 text-xs text-[var(--color-base-tertiary)]">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

// Message Bubble Component
function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] px-4 py-2.5 rounded-2xl ${
          isUser
            ? "bg-[var(--color-brand-primary)] text-white rounded-br-md"
            : "bg-[var(--color-base-surface-secondary)] text-[var(--color-base-primary)] rounded-bl-md"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <div
          className={`mt-1 text-[10px] ${
            isUser ? "text-white/70" : "text-[var(--color-base-tertiary)]"
          }`}
        >
          {formatTime(message.timestamp)}
          {message.status && message.status !== "done" && (
            <span className="ml-2">• {formatStatus(message.status)}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// Empty State
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <div className="w-12 h-12 rounded-full bg-[var(--color-brand-primary)]/10 flex items-center justify-center mb-4">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          className="text-[var(--color-brand-primary)]"
        >
          <path
            d="M12 2L2 7L12 12L22 7L12 2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 17L12 22L22 17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 12L12 17L22 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h3 className="text-sm font-medium text-[var(--color-base-primary)] mb-1">
        Start a conversation
      </h3>
      <p className="text-xs text-[var(--color-base-tertiary)] max-w-[200px]">
        Describe the UI you want to generate. For example: &quot;Create a users table with search and filters&quot;
      </p>
    </div>
  );
}

// Loading Dots Animation
function LoadingDots() {
  return (
    <div className="flex gap-1">
      <span className="w-1.5 h-1.5 bg-[var(--color-brand-primary)] rounded-full animate-bounce [animation-delay:-0.3s]" />
      <span className="w-1.5 h-1.5 bg-[var(--color-brand-primary)] rounded-full animate-bounce [animation-delay:-0.15s]" />
      <span className="w-1.5 h-1.5 bg-[var(--color-brand-primary)] rounded-full animate-bounce" />
    </div>
  );
}

// Helpers
function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatStatus(status: ChatMessage["status"]): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "generating":
      return "Generating";
    case "validating":
      return "Validating";
    case "failed":
      return "Failed";
    default:
      return "";
  }
}
