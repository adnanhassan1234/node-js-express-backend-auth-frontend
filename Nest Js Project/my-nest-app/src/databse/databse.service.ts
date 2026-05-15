import { Injectable, OnModuleInit, OnApplicationShutdown } from '@nestjs/common';

@Injectable()
export class DatabseService implements OnModuleInit, OnApplicationShutdown {
  private isConnected: boolean = false;

  onModuleInit() {
    this.isConnected = true;
    console.log('Database connect success');
  }

  onApplicationShutdown(signal: string) {
    this.isConnected = false;
    console.log(`Database disconnect success singal: ${signal}`);
  }

  getStatus() {
    return this.isConnected ? 'Connected' : 'Disconnected';
  }
}
