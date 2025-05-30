import { Module } from '@nestjs/common';
import { ProducerService } from './producer.service';
import { ConsumerService } from './consumer.service';
import { AmqpController } from './amqp.controller';

@Module({
  imports: [],
  providers: [ProducerService, ConsumerService],
  exports: [ProducerService, ConsumerService],
  controllers: [AmqpController],
})
export class AmqpModule {}
