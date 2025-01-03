import createPostgresConnection from "../config/pg.config";
import { Request, Response } from 'express';
import { getAllTables, getTableColumns, getTableData, isPostgresConnected } from "../utils/pg.db.helper";
import logger from "../config/log.init";
import { isContainerActive, startContainer } from "../utils/pg.container.helper";
import { cache } from "../config/cache.init";

export const isPgConnect = async (req: Request, res: Response): Promise<any> => {
    const { connectionString } = req.query;

    if (!connectionString) {
        logger.warn('Missing required parameter: connectionString');
        return res.status(400).json({ error: 'Missing required parameter: connectionString', connect: false });
    }

    try {
        const isDbConnect = await isPostgresConnected(connectionString as string);
        
        if (!isDbConnect) {
            logger.warn('Database connection failed');
            return res.status(400).json({ error: 'Database connection failed', connect: false });
        }
        logger.info('Database connection successful');
        return res.status(200).json({ message: 'Database connection successful', connect: isDbConnect });
    } catch (error) {
        logger.error(`Error connecting to database: ${(error as Error).message}`);
        return res.status(500).json({ error: 'Internal server error', connect: false });
    }
};


export const getTables = async (req: Request, res: Response): Promise<any> => {
    const connectionString = req.body.connectionString;
    const containerId = req.body.containerId;

    // Check if the tables are in the cache
    const cacheKey = `table_${containerId}-${connectionString}`;
    const cachedTables = cache.get(cacheKey);
    if (cachedTables) {
        logger.info(`Cache hit for container id ${containerId}`);
        return res.status(200).json({ tables: cachedTables });
    }

    try {
        let isContainerStart = await isContainerActive(containerId);
        if (!isContainerStart) {
            logger.info('Container is not active');
            await startContainer(containerId);
            logger.info('Container started successfully');
            isContainerStart = await isContainerActive(containerId);
            if (!isContainerStart) {
                logger.warn('Failed to start container');
                return res.status(400).json({ error: 'Failed to start container' });
            }
        }

        const isDbConnect = await isPostgresConnected(connectionString);
        if (!isDbConnect) {
            logger.warn('Database connection failed');
            return res.status(400).json({ error: 'Database connection failed' });
        }

        const tables = await getAllTables(connectionString);
        logger.info('Fetched tables successfully');

        // Store the tables in the cache
        cache.set(cacheKey, tables,20);

        return res.status(200).json({ tables });
    } catch (error) {
        logger.error(`Error fetching tables: ${(error as Error).message}`);
        return res.status(500).json({ error: (error as Error).message });
    }
};


export const getColumns = async (req: Request, res: Response): Promise<any> => {
    const connectionString = req.body.connectionString;
    const containerId = req.body.containerId;
    const tableName = req.body.tableName;
    try {
        let isContainerStart = await isContainerActive(containerId);
        if (!isContainerStart) {
            logger.info('Container is not active');
            await startContainer(containerId);
            logger.info('Container started successfully');
            isContainerStart = await isContainerActive(containerId);
            if (!isContainerStart) {
                logger.warn('Failed to start container');
                return res.status(400).json({ error: 'Failed to start container' });
            }
        }

        const isDbConnect = await isPostgresConnected(connectionString);
        if (!isDbConnect) {
            logger.warn('Database connection failed');
            return res.status(400).json({ error: 'Database connection failed' });
        }

        const columns = await getTableColumns(connectionString, tableName);
        logger.info(`Fetched columns for table ${tableName} successfully`);
        return res.status(200).json({ columns });
    } catch (error) {
        logger.error(`Error fetching columns for table ${tableName}: ${(error as Error).message}`);
        return res.status(500).json({ error: (error as Error).message });
    }
};

export const getTableDataController = async (req: Request, res: Response): Promise<any> => {
    const connectionString = req.body.connectionString;
    const containerId = req.body.containerId;
    const tableName = req.body.tableName;
    try {
        let isContainerStart = await isContainerActive(containerId);
        if (!isContainerStart) {
            logger.info('Container is not active');
            await startContainer(containerId);
            logger.info('Container started successfully');
            isContainerStart = await isContainerActive(containerId);
            if (!isContainerStart) {
                logger.warn('Failed to start container');
                return res.status(400).json({ error: 'Failed to start container' });
            }
        }

        const isDbConnect = await isPostgresConnected(connectionString);
        if (!isDbConnect) {
            logger.warn('Database connection failed');
            return res.status(400).json({ error: 'Database connection failed' });
        }

        const data = await getTableData(connectionString, tableName);
        logger.info(`Fetched data for table ${tableName} successfully`);
        return res.status(200).json({ data });
    } catch (error) {
        logger.error(`Error fetching data for table ${tableName}: ${(error as Error).message}`);
        return res.status(500).json({ error: (error as Error).message });
    }
};
