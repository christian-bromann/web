import { getPortPromise } from 'portfinder';
import { readConfig as readFileConfig, ConfigLoaderError } from '@web/config-loader';
import chalk from 'chalk';
import path from 'path';
import { DevServerCliConfig } from './DevServerCliConfig';

const defaultBaseConfig: Partial<DevServerCliConfig> = {
  rootDir: process.cwd(),
  hostname: 'localhost',
  middleware: [],
  plugins: [],
};

export function validateCoreConfig<T extends DevServerCliConfig>(config: Partial<T>): T {
  if (typeof config.hostname !== 'string') {
    throw new Error('No hostname specified.');
  }
  if (typeof config.port !== 'number') {
    throw new Error('No port specified.');
  }
  if (typeof config.rootDir !== 'string') {
    throw new Error('No rootDir specified.');
  }
  if (
    config.open != null &&
    !(typeof config.open === 'string' || typeof config.open === 'boolean')
  ) {
    throw new Error('The open option should be a boolean or string.');
  }

  return config as T;
}

export async function readConfig<T extends DevServerCliConfig & { config?: string }>(
  cliArgsConfig: Partial<T> = {},
): Promise<Partial<T>> {
  try {
    const fileConfig = await readFileConfig(
      'web-dev-server.config',
      typeof cliArgsConfig.config === 'string' ? cliArgsConfig.config : undefined,
    );
    const config: Partial<T> = {
      ...defaultBaseConfig,
      ...fileConfig,
      ...cliArgsConfig,
    };

    if (typeof config.rootDir === 'string') {
      config.rootDir = path.resolve(config.rootDir);
    }

    if (typeof config.port !== 'number') {
      const port = 9000 + Math.floor(Math.random() * 1000);
      config.port = await getPortPromise({ port });
    }

    return config;
  } catch (error) {
    if (error instanceof ConfigLoaderError) {
      console.error(chalk.red(`\n${error.message}\n`));
      process.exit(1);
    }
    throw error;
  }
}
