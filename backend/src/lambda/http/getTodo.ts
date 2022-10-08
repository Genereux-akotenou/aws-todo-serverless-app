import {APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult} from 'aws-lambda'
import { getTodo } from '../../helpers/todos'
import { createLogger } from '../../utils/logger';

const logger = createLogger('createTodo');

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const authorization = event.headers.Authorization;
  const split = authorization.split(' ');
  const jwtToken = split[1];
  const todoId = event.pathParameters.todoId;

  try {
    const todo = await getTodo(jwtToken, todoId);
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        "item": todo
      }),
    }
  }
  catch (error) {
    logger.error(`Error: ${error.message}`);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({ error })
    };
  }
};