import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (config: ConfigService): Redis => {
        const redisOptions: RedisOptions = {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          db: config.get<number>('REDIS_DB', 0),
          retryStrategy: (times: number) => {
            const delay = Math.min(times * 50, 2000);
            console.log(
              `Redis0 reconnecting attempt #${times},
              delay: ${delay}ms`,
            );
            return delay;
          },
        };

        const redisClient = new Redis(redisOptions);

        redisClient.on('connect', () => {
          console.log('Redis0 connected successfully');
        });

        redisClient.on('error', (err) => {
          console.error('Redis0 connection error:', err.message);
        });

        return redisClient;
      },
      inject: [ConfigService],
    },
    {
      provide: 'REDIS_TOKEN_CLIENT',
      useFactory: (config: ConfigService): Redis => {
        const redisOptions: RedisOptions = {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          db: config.get<number>('REDIS_TOKEN_DB', 1),
          retryStrategy: (times: number) => {
            const delay = Math.min(times * 50, 2000);
            console.log(
              `Redis1 reconnecting attempt #${times},
              delay: ${delay}ms`,
            );
            return delay;
          },
        };

        const redisClient = new Redis(redisOptions);

        redisClient.on('connect', () => {
          console.log('Redis1 connected successfully');
        });

        redisClient.on('error', (err) => {
          console.error('Redis1 connection error:', err.message);
        });

        return redisClient;
      },
      inject: [ConfigService],
    },
    {
      provide: 'REDIS_CHAT_CLIENT',
      useFactory: (config: ConfigService): Redis => {
        const redisOptions: RedisOptions = {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          db: config.get<number>('REDIS_CHAT_DB', 2),
          retryStrategy: (times: number) => {
            const delay = Math.min(times * 50, 2000);
            console.log(
              `Redis2 reconnecting attempt #${times},
              delay: ${delay}ms`,
            );
            return delay;
          },
        };

        const redisClient = new Redis(redisOptions);
        redisClient.on('connect', () => console.log('Redis2 (chat) connected'));
        redisClient.on('error', (err) => console.error('Redis2 error:', err));
        return redisClient;
      },
      inject: [ConfigService],
    },
  ],
  exports: ['REDIS_CLIENT', 'REDIS_TOKEN_CLIENT', 'REDIS_CHAT_CLIENT'],
})
export class RedisModule {}
