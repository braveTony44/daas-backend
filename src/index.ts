import cluster from 'cluster';
import os from 'os';
import dotenv from 'dotenv';
import connectDB from './config/database';
import logger from './config/log.init';
import app from './app';

dotenv.config();

const numCPUs = os.cpus().length;
const port: number = parseInt(process.env.PORT || '4000', 10);
const WORKERS_LIMIT = parseInt(process.env.WORKERS_LIMIT || numCPUs.toString(), 10);
let requestCount = 0;

if (cluster.isPrimary) {
    logger.info(`Primary ${process.pid} is running`);

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

    setInterval(() => {
        if (requestCount > 10 && Object.keys(cluster.workers || {}).length < WORKERS_LIMIT) {
            addWorker();
        }
        requestCount = 0;
    }, 5000);

    cluster.on('message', (worker, message: { cmd?: string }) => {
        if (message.cmd === 'notifyRequest') {
            requestCount++;
        }
    });

    cluster.on('exit', (worker, code, signal) => {
        logger.warn(`Worker ${worker.process.pid} died with code ${code} and signal ${signal}`);
        addWorker();
    });

} else {
    // Worker processes
    connectDB().then(() => {
        app.listen(port, () => {
            logger.info(`Worker ${process.pid} running on port ${port}`);
        });
    }).catch((error) => {
        logger.error(`Database connection failed: ${error.message}`);
        process.exit(1);
    });

    // Notify the primary process about incoming requests
    app.use((req, res, next) => {
        if (cluster.worker) {
            cluster.worker.send({ cmd: 'notifyRequest' });
        }
        next();
    });
}
