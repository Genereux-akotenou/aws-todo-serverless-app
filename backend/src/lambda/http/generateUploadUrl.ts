import {APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult} from 'aws-lambda'
import { generateUploadUrl } from '../../helpers/todos'
import { createLogger } from '../../utils/logger';

const logger = createLogger('createTodo');

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId

  try {
    const URL = await generateUploadUrl(todoId);
    return {
      statusCode: 202,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        uploadUrl: URL,
      })
    };
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
