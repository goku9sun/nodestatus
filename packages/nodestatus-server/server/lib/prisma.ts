import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { Prisma } from '../../types/server';
import config from './config';

/* Initializing database for Docker */
if (process.env.IS_DOCKER === 'true' && !fs.existsSync('/usr/local/NodeStatus/server/db.sqlite')) {
  fs.existsSync('/app/db.base.sqlite') || process.exit(1);
  fs.mkdirSync('/usr/local/NodeStatus/server/', { recursive: true });
  fs.copyFileSync('/app/db.base.sqlite', '/usr/local/NodeStatus/server/db.sqlite');
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${ config.database }`
    }
  }
});

const actions = new Set(['create', 'createMany', 'update', 'updateMany', 'upsert']);

const parse = async (server: Prisma.ServerCreateInput) => {
  if (server.password) {
    server.password = await hash(server.password, 8);
  }
};

prisma.$use(async (params, next) => {
  if (params.model != 'Server' || !actions.has(params.action)) return next(params);
  const data: Prisma.ServerCreateInput | Prisma.ServerCreateInput[] = params.args.data;

  if (data instanceof Array) {
    await Promise.all(data.map(server => parse(server)));
  } else {
    await parse(data);
  }

  return next(params);
});

export default prisma;
