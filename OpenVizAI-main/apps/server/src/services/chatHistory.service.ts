import { PostgresChatMessageHistory } from '@langchain/community/stores/message/postgres';
import { AIMessage, HumanMessage } from '@langchain/core/messages';
import { HTTP_STATUS_CODE } from '@utils/httpStatusCodes';
import customErrorHandler from '@utils/customErrorHandler';
import { Pool } from 'pg';
import { prisma } from '@db';

/**
 * Service for managing chat history and sessions
 */
export default class ChatHistoryService {
  /**
   * Adds a chat history message to the chat history table
   * @param sessionId The ID of the session to add the message to
   * @param message The message to add
   */
  static async addChatHistory(
    sessionId: string,
    message: HumanMessage | AIMessage,
    pool: Pool,
  ) {
    try {
      const chatHistory = new PostgresChatMessageHistory({
        sessionId: sessionId,
        pool: pool,
        tableName: 'chat_history',
      });

      await chatHistory.addMessages([message]);
    } catch (error) {
      throw new customErrorHandler(
        HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR,
        'Failed to add chat history',
      );
    }
  }

  /**
   * Retrieves previous messages from the chat history table
   * @param sessionId The ID of the session to retrieve messages from
   * @returns An array of previous messages
   */
  static async getPreviousMessages(sessionId: string, pool: Pool) {
    try {
      const chatHistory = new PostgresChatMessageHistory({
        sessionId: sessionId,
        pool: pool,
        tableName: 'chat_history',
      });

      const rawMessages = await chatHistory.getMessages();
      rawMessages.pop(); // remove the last message which is the current message
      return rawMessages;
    } catch (error) {
      throw new customErrorHandler(
        HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR,
        'Failed to get previous messages',
      );
    }
  }

  /**
   * Retrieves all chat history by session ID
   * @param sessionId The ID of the session to retrieve chat history for
   * @returns An array of chat history records
   */
  static async getChatHistoryBySessionId(sessionId: string) {
    try {
      const chatHistory = await prisma.chatHistory.findMany({
        where: { session_id: sessionId },
        select: { id: true, message: true },
        orderBy: { created_ts: 'asc' },
      });
      return chatHistory;
    } catch (error) {
      throw new customErrorHandler(
        HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR,
        'Failed to get chat history by session ID',
      );
    }
  }

  static async getMessageById(messageId: number) {
    try {
      const message = await prisma.chatHistory.findUnique({
        where: { id: messageId },
        select: { message: true, session_id: true },
      });

      return typeof message === 'string'
        ? JSON.parse(message)
        : message.message;
    } catch (error) {
      throw new customErrorHandler(
        HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR,
        'Failed to get message by ID',
      );
    }
  }
}