import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { GRPC_PACKAGES } from './core/enums/global.enum';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Load every .proto file in the protos folder
  const protoDir = config.getOrThrow<string>('PROTO_FOLDER_PATH');
  const protoPaths = fs
    .readdirSync(protoDir)
    .filter((file) => file.endsWith('.proto'))
    .map((file) => path.join(protoDir, file));

  // gRPC server: this is what the gateway will connect to
  const grpcUrl = config.getOrThrow<string>('GRPC_URL');
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: GRPC_PACKAGES,
      protoPath: protoPaths,
      url: grpcUrl,
      loader: { keepCase: true, arrays: true },
    },
  });

  await app.startAllMicroservices();
  app.enableShutdownHooks();

  // Small HTTP port, only for health checks
  const port = config.get<number>('PORT') ?? 4000;
  await app.listen(port);
  Logger.log(`Job service: gRPC on ${grpcUrl}, HTTP on :${port}`);
}

bootstrap().catch((err: unknown) => {
  Logger.error('Failed to start job service', err);
  process.exit(1);
});
