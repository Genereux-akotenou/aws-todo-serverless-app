import {APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult} from 'aws-lambda'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { createTodo } from '../../helpers/todos'
import { createLogger } from '../../utils/logger';

const logger = createLogger('createTodo');

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const newTodo: CreateTodoRequest = JSON.parse(event.body);
  const jwtToken = event.headers.Authorization.split(' ')[1];

  try {
    const todoItem = await createTodo(newTodo, jwtToken);
    return {
      statusCode: 201,
      headers: {
        "Access-Control-Allow-Origin": "*",
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        "item": todoItem
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
