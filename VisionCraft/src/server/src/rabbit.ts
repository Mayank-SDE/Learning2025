import amqplib from 'amqplib';

const url = process.env.RABBIT_URL!;
const queue = process.env.RABBIT_QUEUE!;
let conn: amqplib.Connection | undefined;
let ch: amqplib.Channel | undefined;

export async function channel() {
  if (!ch) {
    conn = await amqplib.connect(url);
    ch = await conn.createChannel();
    await ch.assertQueue(queue, { durable: true });
  }
  return ch!;
}

export const QUEUE = queue;
