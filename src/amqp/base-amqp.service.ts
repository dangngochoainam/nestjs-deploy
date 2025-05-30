import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  Channel,
  ChannelModel,
  ConfirmChannel,
  connect,
  Connection,
  Options,
} from 'amqplib';
import {
  IAddress,
  IExchange,
  QUEUE_ATTRIBUTE_KEY,
  TEMPORARY_QUEUE_LIFETIME,
} from './amqp.common';

@Injectable()
export abstract class AbstractAmqpService
  implements OnModuleInit, OnModuleDestroy
{
  protected connection!: Connection;
  protected channelModel!: ChannelModel;
  protected channel!: Channel;
  protected confirmChannel!: ConfirmChannel;

  private isShuttingDown = false;

  public constructor() {}

  public async onModuleDestroy() {
    if (this.connection) {
      this.isShuttingDown = true;
      await this.channelModel.close();
    }
  }

  public async onModuleInit() {
    const MQ_HOSTNAME = process.env.MQ_HOSTNAME;
    const host: Options.Connect = {
      protocol: 'amqp',
      hostname: MQ_HOSTNAME.split(':')[0],
      port: parseInt(MQ_HOSTNAME.split(':')[1]),
      username: process.env.MQ_USERNAME,
      password: process.env.MQ_PASSWORD,
    };
    await this.connect(host);
  }

  private async connect(host: Options.Connect) {
    this.channelModel = await connect(host);
    console.log(`[RabbitMQ] Connected to ${process.env.MQ_HOSTNAME}`);
    await this.handleNewConnection(this.channelModel.connection);
    this.isShuttingDown = false;
    this.handleDisconnect(host);
  }

  private async handleNewConnection(connection: Connection) {
    this.connection = connection;
    this.channel = await this.channelModel.createChannel();
    this.confirmChannel = await this.channelModel.createConfirmChannel();
    this.connection.on('error', (e: any) => {
      console.error({}, '[RabbitMQ] Connection Error', e);
    });
  }

  private handleDisconnect(host: Options.Connect) {
    this.connection.on('close', async () => {
      console.warn({}, '[RabbitMQ] AMQP disconnected');
      let connected = false;
      while (!connected && !this.isShuttingDown) {
        try {
          console.warn({}, '[RabbitMQ] Retry connection');
          await this.connect(host);
          connected = true;
        } catch (e) {
          await new Promise((rs) => setTimeout(rs, 3000));
        }
      }
    });
  }

  public async assertTemporaryQueue(
    queueName: string,
    expireSeconds: number = TEMPORARY_QUEUE_LIFETIME,
  ) {
    const res = await this.channel.assertQueue(queueName, {
      durable: false,
      autoDelete: true,
      expires: expireSeconds * 1000,
      arguments: {
        [QUEUE_ATTRIBUTE_KEY.QUEUE_VERSION]: 1,
      },
    });
    return res.queue;
  }

  public async assertAMQPAddress(
    address: IAddress,
    exchange: IExchange,
  ): Promise<string> {
    const { name, options } = exchange;
    console.log(
      {},
      `[RabbitMQ] Asserting exchange ${name} with options ${JSON.stringify(options)}`,
    );
    const ex = await this.channel.assertExchange(name, 'topic', options);
    const addressOptions: Options.AssertQueue = {
      ...address.options,
    };
    const queue = await this.channel.assertQueue(address.name, addressOptions);
    await this.channel.bindQueue(
      queue.queue,
      ex.exchange,
      exchange.fanout ? '#' : exchange.routingKey,
    );
    return queue.queue;
  }
}
