import { Message } from "#/lexicon/types/social/soapstone/message/defs";

/**
 * Generates message text from Message object parts.
 * @param message - The message object.
 * @returns The combined text string.
 */
export function createMessageText(message: Message): string {
  const parts: string[] = [];

  // For each part in the message, replace the asterisks in the base phrase with the text in the fill phrase.
  for (const part of message) {
    if (part.base && part.fill) {
      // Extract the actual text values from the typed objects
      const baseText =
        typeof part.base === "string"
          ? part.base
          : (part.base as any).text || part.base;
      const fillText =
        typeof part.fill === "string"
          ? part.fill
          : (part.fill as any).text || part.fill;

      // Replace the asterisks in the base phrase with the fill phrase
      const combinedText = baseText.replace(/\*{4}/g, fillText);
      parts.push(combinedText);
    }
  }

  return parts.join(" ").trim();
}
