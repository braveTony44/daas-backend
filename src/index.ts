import cluster from 'cluster';
import os from 'os';
import dotenv from 'dotenv';
import connectDB from './config/database';
import logger from './config/log.init';
import app from './app';

// Load environment variables
dotenv.config();

// Configuration
const numCPUs = os.cpus().length;
const port: number = parseInt(process.env.PORT || '4000', 10);
const WORKERS_LIMIT = parseInt(process.env.WORKERS_LIMIT || numCPUs.toString(), 10);
let requestCount = 0;

// Ensure the environment is properly configured
if (!process.env.NODE_ENV) {
  logger.error('NODE_ENV is not defined. Please set the environment.');
  process.exit(1);
}

// Primary process logic
if (cluster.isPrimary) {
  logger.info(`Primary ${process.pid} is running`);

  // Function to add a new worker
  const addWorker = () => {
    if (Object.keys(cluster.workers || {}).length < WORKERS_LIMIT) {
      const newWorker = cluster.fork();
      logger.info(`New worker ${newWorker.process.pid} started`);
    }
  };

  // Start initial workers
  for (let i = 0; i < WORKERS_LIMIT; i++) {
    addWorker();
  }

  // Monitor request count and scale workers if necessary
  setInterval(() => {
    if (requestCount > 10 && Object.keys(cluster.workers || {}).length < WORKERS_LIMIT) {
      addWorker();
    }
    requestCount = 0;
  }, 5000);

  // Handle messages from workers
  cluster.on('message', (worker, message: { cmd?: string }) => {
    if (message.cmd === 'notifyRequest') {
      requestCount++;
    }
  });

  // Handle worker exit events
  cluster.on('exit', (worker, code, signal) => {
    logger.warn(`Worker ${worker.process.pid} died with code ${code} and signal ${signal}`);
    logger.info('Starting a new worker to replace the dead one...');
    addWorker();
  });

  // Handle uncaught exceptions in the primary process
  process.on('uncaughtException', (error) => {
    logger.error(`Uncaught exception in primary process: ${error.message}`, { stack: error.stack });
    process.exit(1);
  });

  // Handle unhandled promise rejections in the primary process
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection in primary process:', { reason, promise });
  });

} else {
  // Worker processes
  connectDB()
    .then(() => {
      app.listen(port, () => {
        logger.info(`Worker ${process.pid} running on port ${port}`);
      });
    })
    .catch((error) => {
      logger.error(`Database connection failed: ${error.message}`, { stack: error.stack });
      process.exit(1);
    });

  // Notify the primary process about incoming requests
  app.use((req, res, next) => {
    if (cluster.worker) {
      cluster.worker.send({ cmd: 'notifyRequest' });
    }
    next();
  });

  // Handle uncaught exceptions in worker processes
  process.on('uncaughtException', (error) => {
    logger.error(`Uncaught exception in worker ${process.pid}: ${error.message}`, { stack: error.stack });
    process.exit(1);
  });

  // Handle unhandled promise rejections in worker processes
  process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Unhandled rejection in worker ${process.pid}:`, { reason, promise });
  });
}