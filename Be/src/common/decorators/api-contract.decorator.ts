import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

const errorSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: false },
    error: {
      type: 'object',
      properties: {
        code: { type: 'string', example: 'VALIDATION_ERROR' },
        message: { type: 'string' },
        details: {},
      },
      required: ['code', 'message'],
    },
  },
  required: ['success', 'error'],
};

export function ApiSuccessResponse(description = 'Success') {
  return ApiOkResponse({
    description,
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {},
        message: { type: 'string' },
        meta: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
      required: ['success', 'data'],
    },
  });
}

export function ApiErrorResponses() {
  return applyDecorators(
    ApiBadRequestResponse({
      description: 'Bad request',
      schema: errorSchema,
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
      schema: errorSchema,
    }),
    ApiInternalServerErrorResponse({
      description: HttpStatus.INTERNAL_SERVER_ERROR.toString(),
      schema: errorSchema,
    }),
  );
}

export function ApiContract(description = 'Success') {
  return applyDecorators(ApiSuccessResponse(description), ApiErrorResponses());
}
