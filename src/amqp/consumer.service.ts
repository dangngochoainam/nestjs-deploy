import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { BehaviorSubject, filter, map, Observable } from 'rxjs';

import { AbstractAmqpService } from './base-amqp.service';
import { IAddress, IExchange } from './amqp.common';

@Injectable()
export class ConsumerService extends AbstractAmqpService {
  public constructor() {
    super();
  }

  public async receiveMessage<T>(options: {
    address: IAddress;
    exchange?: IExchange;
    concurrentLimit: number;
    durable: boolean;
  }): Promise<{
    source: Observable<any>;
  }> {
    try {
      console.log(
        {},
        `Registering address: ${JSON.stringify(options.address)}`,
      );
      const subject = new BehaviorSubject('');
      const queue = await this.assertAMQPAddress(
        options.address,
        options.exchange as IExchange,
      );
      await this.channel.prefetch(options.concurrentLimit);

      this.channel.consume(
        queue,
        (msg) => {
          if (!msg) {
            console.debug({}, `Message not found on queue ${queue}`);
            return;
          }
          console.debug(
            {},
            `Received message on queue ${queue}: ${msg.content.toString()}`,
          );
          subject.next(msg.content.toString());
        },
        {
          noAck: true,
        },
      );
      return {
        source: subject.pipe(
          filter((message) => !!message),
          map((message) => message && JSON.parse(message)),
        ),
      };
    } catch (error: any) {
      console.error(
        {},
        `Failed to register address: ${JSON.stringify(options.address)}`,
        error,
      );
      throw new InternalServerErrorException(error);
    }
  }
}
