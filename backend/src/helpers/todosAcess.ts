import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';
import { Types } from 'aws-sdk/clients/s3';

const logger = createLogger('TodosAccess')

// DataLayer logic
export class TodoAccess {
    constructor (
        private readonly docClient: DocumentClient = new AWS.DynamoDB.DocumentClient(),
        private readonly todoTable = process.env.TODOS_TABLE,
        private readonly s3Client: Types = new AWS.S3({ signatureVersion: 'v4' }),
        private readonly s3BucketName = process.env.ATTACHMENT_S3_BUCKET,
        private readonly s3UrlExpirationDelay = process.env.SIGNED_URL_EXPIRATION
    ) {}

    async getAllTodo(userId: string): Promise<TodoItem[]> {
        logger.info('Retreiving all todo');
        const items = await this.docClient.query({
            TableName: this.todoTable,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
              ':userId': userId
            }
          })
          .promise();
        return items.Items as TodoItem[];
    }

    async createTodo(newTodoItem: TodoItem): Promise<TodoItem> {
        logger.info('Creating new todo');
        await this.docClient.put({
            TableName: this.todoTable,
            Item: newTodoItem
        })
        .promise();
        return newTodoItem;
    }

    async updateTodo(todoUpdate: TodoUpdate, todoId: string, userId: string): Promise<TodoUpdate> {
        logger.info("Updating todo " + todoId);
        const updatedTodo = await this.docClient.update({
            TableName: this.todoTable,
            Key: { userId, todoId },
            UpdateExpression: "set #a = :a, #b = :b, #c = :c",
            ExpressionAttributeNames: {
                "#a": "name",
                "#b": "dueDate",
                "#c": "done"
            },
            ExpressionAttributeValues: {
                ":a": todoUpdate['name'],
                ":b": todoUpdate['dueDate'],
                ":c": todoUpdate['done']
            },
            ReturnValues: "ALL_NEW"
        }).promise();
        return updatedTodo.Attributes as TodoUpdate;
    }

    async getTodo(userId: string, todoId: string): Promise<TodoItem> {
        logger.info(`Getting todo item: ${todoId}`);
        const result = await this.docClient.query({
            TableName: this.todoTable,
            KeyConditionExpression: 'userId = :userId and todoId = :todoId',
            ExpressionAttributeValues: {
              ':userId': userId,
              ':todoId': todoId
            }
          }).promise();
        const todoItem = result.Items[0];
        return todoItem as TodoItem;
    }

    async deleteTodo(todoId: string, userId: string): Promise<boolean> {
        logger.info("Deleting todo " + todoId);
        try{
            await this.docClient.delete({
                TableName: this.todoTable,
                Key: { userId, todoId },
            }).promise();
            return true
        }
        catch{
            return false;
        }
    }

    async generateUploadUrl(todoId: string): Promise<string> {
        logger.info("Generating upload url for todo " + todoId);
        const url = this.s3Client.getSignedUrl('putObject', {
            Bucket: this.s3BucketName,
            Key: todoId,
            Expires: this.s3UrlExpirationDelay,
        });
        return url as string;
    }
}

//   async saveImgUrl(userId: string, todoId: string, bucketName: string): Promise<void> {
//     await this.docClient
//       .update({
//         TableName: this.todosTable,
//         Key: { userId, todoId },
//         ConditionExpression: 'attribute_exists(todoId)',
//         UpdateExpression: 'set attachmentUrl = :attachmentUrl',
//         ExpressionAttributeValues: {
//           ':attachmentUrl': `https://${bucketName}.s3.amazonaws.com/${todoId}`
//         }
//       })
//       .promise();
//   }