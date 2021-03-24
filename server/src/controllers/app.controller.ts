import { Socket } from 'socket.io';
import { Message } from 'amqplib';
import { logger } from 'juno-js';
import {
  config, RabbitMQ, EVENT, TASK_STATUS, RABBITMQ_CONNECTION_STRING, QUEUE,
} from '../components';
import { io } from '../app';
import { CustomerServiceUser, Task } from '../types/app.type';

class AppController {
  private static customerServiceUsers: CustomerServiceUser[] = [];
  private static mapId: Map<string, string> = new Map();

  static onConnection(socket: Socket) {
    socket.on(EVENT.userConnection,(user: CustomerServiceUser, socket: Socket) => this.onUserConnection(user, socket));
    socket.on(EVENT.taskHandler, (user: CustomerServiceUser, result: Task) => this.onTaskHandler(user, result, socket));
    socket.on(EVENT.userDisconnection,(() => this.onUserDisconnection(socket)));
    socket.on(EVENT.userCloseTab, this.onUserCloseTab);
    socket.on('abc', (user: any, result: any) => { console.log('data', user, result); })
  }

  private static onUserConnection(user: CustomerServiceUser, socket: Socket) {
    this.customerServiceUsers.push(user);
    this.mapId.set(user.socketId, user.id!);
    console.log('----------Connection-------------------');
    console.log(this.customerServiceUsers);
    this.onSubscriber(socket);
  }

  private static onUserDisconnection(socket: Socket) {
    this.customerServiceUsers = this.customerServiceUsers.filter(user => user.id !== this.mapId.get(socket.id));
    this.mapId.delete(socket.id);
    console.log('----------------Disconnect------------------');
    console.log(this.customerServiceUsers);
  }

  private static async onTaskHandler(user: CustomerServiceUser, result: Task, socket: Socket) {
    const rabbitMQ = new RabbitMQ(RABBITMQ_CONNECTION_STRING);
    await rabbitMQ.start();
    this.customerServiceUsers = this.changeStatusUser(this.customerServiceUsers, user);
    if (result.status === 'timeout' || result.status === 'faile') {
      let priority = result?.count + 1;
      console.log('-----retry-----', result);
      await rabbitMQ.publishInQueue(QUEUE.newTask, Buffer.from(JSON.stringify(result)), priority)
      await rabbitMQ.consume(QUEUE.newTask, this.assignTask);
    } else {
      const queueInfo = await rabbitMQ.getQueueInfo();
      // if queue have message or have CS available then create consume to get message
      if (queueInfo.messageCount > 0 || this.haveUserConnect(this.customerServiceUsers)) {
        this.onSubscriber(socket);
      } else {
        console.log('Task Done');
      }
    }
  }

  private static async onUserCloseTab(user: CustomerServiceUser, result: Task) {
    const rabbitMQ = new RabbitMQ(RABBITMQ_CONNECTION_STRING);
    await rabbitMQ.start();
    let priority = result.count + 1;
    await rabbitMQ.publishInQueue(QUEUE.newTask, Buffer.from(JSON.stringify(result)), priority);
  }

  private static async onSubscriber(socket?: Socket) {
    const rabbitMQ = new RabbitMQ(RABBITMQ_CONNECTION_STRING);
    await rabbitMQ.start();
    await rabbitMQ.assertQueue();
    if (socket) {
      socket.on(EVENT.userDisconnection, async () => {
        await rabbitMQ.closeChannel();
      });
    }
    const message = await rabbitMQ.consume(QUEUE.newTask, this.assignTask);
    logger.info(message.content.toString(), '------------message');
  }

  public static async assignTask(message: Message, rabbit: RabbitMQ) {
    const randomSocketId = AppController.randomId(AppController.getCustomerServiceUsers());
      let users = AppController.getCustomerServiceUsers();
      const userId = AppController.getMapId().get(randomSocketId) || '';
      if(AppController.checkAssign(users, userId)) {
        const content = JSON.parse(message.content.toString());
        io.to(randomSocketId).emit(EVENT.taskAssignment, content);
        users = AppController.changeStatusUser(users, { socketId: randomSocketId, status: 'inprocess' })
        AppController.setCustomerServiceUsers(users);
        rabbit.ack(message);
        rabbit.closeChannel();
      }
  }

  public static randomId(customerServiceUsers: CustomerServiceUser[]): string {
    const userReady = customerServiceUsers.filter(user => user.status === 'ready');
    if (userReady.length <= 0) return '';
    const random = Math.floor(Math.random() * Math.floor(userReady.length));
    return userReady[random].socketId;
  }

  public static checkAssign(customerServiceUsers: CustomerServiceUser[], id: string) {
    return customerServiceUsers.filter(user => (user.status === 'ready' && user.id === id)).length > 0;
  }

  public static changeStatusUser (customerServiceUsers: CustomerServiceUser[], data: CustomerServiceUser): CustomerServiceUser[] {
    return customerServiceUsers.map(user => {
        if (user.id === this.mapId.get(data.socketId)) {
            user = {
                ...user,
                status: data.status,
            };
            return user;
        }
        return user;
    });
  }

  public static haveUserConnect(customerServiceUsers: CustomerServiceUser[]) {
    return customerServiceUsers.filter(user => user.status === 'ready').length > 0;
  }

  public static getCustomerServiceUsers(): CustomerServiceUser[] {
    return this.customerServiceUsers;
  }

  public static setCustomerServiceUsers(customerServiceUsers: CustomerServiceUser[]) {
    this.customerServiceUsers = customerServiceUsers;
  }

  public static getMapId(): Map<string, string> {
    return this.mapId;
  }

  public static setMapId(mapId: Map<string, string>) {
    this.mapId = mapId;
  }
}

export { AppController };
