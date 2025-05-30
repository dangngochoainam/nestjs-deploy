import * as dotenv from 'dotenv';
dotenv.config();
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AmqpModule } from './amqp/amqp.module';

@Module({
  imports: [AmqpModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
