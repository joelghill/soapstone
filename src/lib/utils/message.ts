import {
  Message,
  MessagePart,
} from "#/lexicon/types/social/soapstone/message/defs";
import { BasePhrase } from "#/lexicon/types/social/soapstone/text/en/defs";
import { $Typed } from "#/lexicon/util";

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
      const baseText = (part.base as any).selection;
      const fillText = (part.fill as any).selection;

      // Replace the asterisks in the base phrase with the fill phrase
      const combinedText = baseText.replace(/\*{4}/g, fillText);
      parts.push(combinedText);
    }
  }

  return parts.join(" ").trim();
}
