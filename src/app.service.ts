import { Injectable } from '@nestjs/common';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@Injectable()
export class AppService {
  getHello(): string {
    new Promise(async (resolve) => {
      // await delay(5000);
      const loop = 3000000000;
      for (let i = 0; i < loop; i++) {
        if (i === 0) {
          console.log('In for i = 0');
          console.log(new Date());
        }

        if (i === loop - 1) {
          console.log(`In for i = ${loop - 1}`);
          console.log(new Date());
        }
      }
      resolve(true);
    })
      .then((data) => {
        console.log('Promise successfully resolved');
        console.log(data);
      })
      .catch((err) => {
        console.log('Promise error occurred');
        console.log(err);
      });
    return 'Hello World!';
  }
}
