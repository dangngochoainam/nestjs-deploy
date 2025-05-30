import { Body, Controller, Get, OnModuleInit, Post } from '@nestjs/common';
import { ProducerService } from './producer.service';
import { ConsumerService } from './consumer.service';

@Controller()
export class AmqpController {
  public constructor(
    private readonly providerService: ProducerService,
    private readonly consumerService: ConsumerService,
  ) {}

  private name = 'AmqpTest';
  private countRequest = 0;

  @Get('test/init-amqp')
  public async setupInitAmqp() {
    await this.consumerService.receiveMessage({
      address: {
        name: `Q-${this.name}`,
      },
      exchange: {
        name: `E-${this.name}`,
        routingKey: '',
        fanout: true,
      },
      concurrentLimit: 5,
      durable: true,
    });
    return 'ok';
  }

  @Post('test/amqp')
  public async sendMessage(@Body() body: { traceId?: string }) {
    this.providerService.sendMessage({
      address: `Q-${this.name}`,
      message: `${this.countRequest}`,
      traceId: body.traceId || `${this.countRequest}`,
      messageId: body.traceId || `${this.countRequest}`,
      durable: true,
    });
    this.countRequest++;
    return 'Ok';
  }
}
