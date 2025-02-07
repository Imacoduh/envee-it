import { GCloudConfig } from './gcloud/config';
import { PaymentConfig } from './payment';
import { RedisOptions } from './redis';
import { R2StorageConfig, S3StorageConfig } from './storage';

declare module '../fundamentals/config' {
  interface PluginsConfig {
    readonly payment: PaymentConfig;
    readonly redis: RedisOptions;
    readonly gcloud: GCloudConfig;
    readonly 'cloudflare-r2': R2StorageConfig;
    readonly 'aws-s3': S3StorageConfig;
  }

  export type AvailablePlugins = keyof PluginsConfig;

  interface AFFiNEConfig {
    readonly plugins: {
      enabled: AvailablePlugins[];
      use<Plugin extends AvailablePlugins>(
        plugin: Plugin,
        config?: DeepPartial<PluginsConfig[Plugin]>
      ): void;
    } & Partial<PluginsConfig>;
  }
}
