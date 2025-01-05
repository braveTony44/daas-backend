import { Client } from 'pg';
import logger from '../config/log.init';

async function getAllTables(connectionString: string): Promise<string[]> {
    const client = new Client({
        connectionString: connectionString
    });

    try {
        await client.connect();
        const res = await client.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);
        await client.end();
        return res.rows.map(row => row.table_name);
    } catch (error) {
        logger.error(`Error fetching tables: ${(error as Error).message}`);
        throw new Error(`Error fetching tables: ${(error as Error).message}`);
    } finally {
        await client.end();
    }
}


async function isPostgresConnected(connectionString: string): Promise<boolean> {
    const client = new Client({
        connectionString: connectionString
    });

    try {
        await client.connect();
        await client.query('SELECT 1');
        return true;
    } catch (error) {
        logger.error(`Error connecting to PostgreSQL: ${(error as Error).message}`);
        // Retry once more
        try {
            logger.info('Retrying connection to PostgreSQL...');
            await client.connect();
            await client.query('SELECT 1');
            return true;
        } catch (retryError) {
            logger.error(`Retry failed: ${(retryError as Error).message}`);
            return false;
        }
    } finally {
        await client.end();
    }
}



async function getTableColumns(connectionString: string, tableName: string): Promise<{ column_name: string, data_type: string }[]> {
    const client = new Client({
        connectionString: connectionString
    });

    try {
        await client.connect();
        const res = await client.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = $1
            ORDER BY ordinal_position;
        `, [tableName]);
        return res.rows;
    } catch (error) {
        logger.error(`Error fetching columns for table ${tableName}: ${(error as Error).message}`);
        throw new Error(`Error fetching columns for table ${tableName}: ${(error as Error).message}`);
    } finally {
        await client.end();
    }
}


async function getTableData(connectionString: string, tableName: string): Promise<any[]> {
    const client = new Client({
        connectionString: connectionString
    });

    try {
        await client.connect();
        const res = await client.query(`SELECT * FROM ${tableName}`);
        return res.rows;
    } catch (error) {
        logger.error(`Error fetching data for table ${tableName}: ${(error as Error).message}`);
        throw new Error(`Error fetching data for table ${tableName}: ${(error as Error).message}`);
    } finally {
        await client.end();
    }
}



export { getAllTables ,getTableData,isPostgresConnected,getTableColumns};