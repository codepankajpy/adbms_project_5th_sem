import { FastifyReply } from 'fastify';

export function sendSuccess<T>(reply: FastifyReply, data: T, message: string = 'Success', statusCode: number = 200) {
  return reply.code(statusCode).send({
    success: true,
    message,
    data,
  });
}

export function sendError(reply: FastifyReply, message: string, statusCode: number = 400, details?: any) {
  return reply.code(statusCode).send({
    success: false,
    message,
    details: details || null,
  });
}

