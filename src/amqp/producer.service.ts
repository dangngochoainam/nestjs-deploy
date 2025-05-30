import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AbstractAmqpService } from './base-amqp.service';
import { ISendMessage, TEMPORARY_QUEUE_LIFETIME } from './amqp.common';

@Injectable()
export class ProducerService extends AbstractAmqpService {
  public constructor() {
    super();
  }

  public async sendMessage(e: ISendMessage): Promise<void> {
    const { traceId, address } = e;
    if (!e.durable) {
      await this.assertTemporaryQueue(address, TEMPORARY_QUEUE_LIFETIME);
    }
    const msgBody = Buffer.from(e.message.toString());
    if (msgBody.byteLength / 1048576 > 5) {
      console.error(
        {
          traceId: traceId,
        },
        `AMQP Message size larger than 5MB
			Address ${address}
			It could cause performance problem`,
        new InternalServerErrorException('AMQP Message size larger than 5MB'),
      );
    }

    console.log(
      {
        traceId: traceId,
      },
      `Sending message to address ${address}`,
    );
    await new Promise((resolve) => {
      this.confirmChannel.sendToQueue(
        address,
        msgBody,
        { persistent: e.durable, correlationId: traceId },
        (err, ok) => {
          if (err) {
            console.error(
              {
                traceId: traceId,
              },
              `Fail to send message to address ${address}`,
              err as Error,
            );
            throw err;
          }
          resolve(ok);
        },
      );
    }).then((_) => {
      console.debug({ traceId }, `Message sent to address ${address}`);
    });
  }
}
