import docker from "../config/dockerRode";
import { createPostgresContainer } from "../postgres/init.db";
import {
  addDatabaseInstanceToUser,
  generateRandomName,
  generateStrongPassword,
  getLocalIPAddress,
  getUniquePort,
  saveContainerData,
} from "../utils/helpers";
import { Request, Response } from "express";
import { DatabaseInstance } from "../model/pg.conatiner";
import logger from "../config/log.init";
import { cache } from "../config/cache.init";

const createPostgresDb = async (req: Request, res: Response): Promise<any> => {
  try {
    const user = req.user;
    const dbName = req.body.dbName || "mydatabase";

    // Check if a database with the same name already exists
    const existingDb = await DatabaseInstance.findOne({ instanceName: dbName, owner: user.id });
    if (existingDb) {
      logger.warn(`Database ${dbName} already exists`)
      return res.status(400).json({ message: "Database with the same name already exists." });
    }
    const containerName = generateRandomName();
    const password = generateStrongPassword(40);
    const port = (await getUniquePort()).toString();
    const host = getLocalIPAddress() || "127.0.0.1";

    const container = await createPostgresContainer(
      containerName,
      user.username,
      dbName,
      password,
      port
    );

    const saveData = await saveContainerData({
      containerId: container.id,
      containerName: containerName,
      databaseType: 'postgres',
      host: host,
      instanceName: dbName,
      port: parseInt(port),
      status: 'running',
      version: 'latest',
      connectionString: `postgres://${user.username}:${password}@${host}:${port}/${dbName}`,
      resourceUsage: { cpu: 1024, memory: 512, storage: 0 },
      configuration: {},
      owner: user.id
    });

    await addDatabaseInstanceToUser(user.id, saveData?._id);
    cache.flushAll();
    logger.info(`Postgres Database Instance created successfully`)
    logger.info(`Postgres Database Instance Id ${container.id} saved to db successfully`)
    return res.status(201).json({
      success: true,
      message: "Postgres Db created succesfuly",
      url: `postgres://${user.username}:${password}@${host}:${port}/${dbName}`,
      container: container.id,
    });
  } catch (error) {
    logger.error(`Failed to create Postgres container with error: ${(error as Error).message}`);
    return res.status(500).json({ error: (error as Error).message });
  }
};


const pausePostgresContainer = async (req: Request, res: Response): Promise<any> => {
  try {
      const user = req.user;
      const { containerId } = req.body;

      if (!containerId) {
        logger.warn(`Missing required parameters conatinerId`)
          return res.status(400).json({ status: false, error: "Missing required parameters" });
      }

      // Find the container in the database
      const container = await DatabaseInstance.findOne({ containerId: containerId });

      if (!container) {
         logger.error(`conatiner not found in the database conatinerId:${containerId}`);
          return res.status(404).json({ message: "Container not found in the database." });
      }

      // Check if the user is the owner of the container
      if (container.owner.toString() !== user.id.toString()) {
        logger.warn(`You do not have permission to pause this container conatinerId:${containerId}`);
          return res.status(403).json({ message: "You do not have permission to pause this container." });
      }

      // Pause the container
      const dockerContainer = docker.getContainer(containerId);
      await dockerContainer.pause();

      // Update the container status in the database
      container.status = 'pause';
      await container.save();
      cache.flushAll();
      logger.info(`Conatiner status changed to db successfully`)
      res.status(200).json({ message: "Container paused successfully", container });
  } catch (error) {
      logger.error(`Error pausing Postgres container: ${(error as Error).message}`);
      res.status(500).json({ message: "Internal server error" });
  }
};


const unPausePostgresContainer = async (req: Request, res: Response): Promise<any> => {
  try {
      const user = req.user;
      const { containerId } = req.body;

      if (!containerId) {
        logger.warn(`Missing required parameters conatinerId`)
          return res.status(400).json({ status: false, error: "Missing required parameters" });
      }

      // Find the container in the database
      const container = await DatabaseInstance.findOne({ containerId: containerId });

      if (!container) {
        logger.error(`conatiner not found in the database conatinerId:${containerId}`);
          return res.status(404).json({ message: "Container not found in the database." });
      }

      // Check if the user is the owner of the container
      if (container.owner.toString() !== user.id.toString()) {
        logger.warn(`You do not have permission to unpause this container conatinerId:${containerId}`);
          return res.status(403).json({ message: "You do not have permission to unpause this container." });
      }

      // Unpause the container
      const dockerContainer = docker.getContainer(containerId);
      await dockerContainer.unpause();

      // Update the container status in the database
      container.status = 'running';
      await container.save();
      cache.flushAll();
      logger.info(`Conatiner status changed to db successfully`)
      res.status(200).json({ message: "Container unpaused successfully", container });
  } catch (error) {
    logger.error(`Error unpausing Postgres container: ${(error as Error).message}`);
      res.status(500).json({ message: "Internal server error" });
  }
};

const deletePostgresContainer = async (req: Request, res: Response): Promise<any> => {
  try {
      const user = req.user;
      const { containerId } = req.body;

      if (!containerId) {
        logger.warn(`Missing required parameters conatinerId`)
          return res.status(400).json({ status: false, error: "Missing required parameters" });
      }

      // Find the container in the database
      const container = await DatabaseInstance.findOne({ containerId: containerId });

      if (!container) {
        logger.error(`conatiner not found in the database conatinerId:${containerId}`);
          return res.status(404).json({ message: "Container not found in the database." });
      }

      // Check if the user is the owner of the container
      if (container.owner.toString() !== user.id.toString()) {
        logger.warn(`You do not have permission to unpause this container conatinerId:${containerId}`);
          return res.status(403).json({ message: "You do not have permission to delete this container." });
      }

      // Delete the container
      const dockerContainer = docker.getContainer(containerId);
      await dockerContainer.stop();
      await dockerContainer.remove();

      logger.info("Container stop and deleted successfully")
      // Remove the container from the database
      await DatabaseInstance.deleteOne({ containerId: containerId });
      cache.flushAll();
      res.status(200).json({ message: "Container deleted successfully" });
  } catch (error) {
      logger.error(`Error deleting Postgres container with error:${(error as Error).message}`);
      res.status(500).json({ message: "Internal server error" });
  }
};

const logsOfPostgresContainer = async (req: Request, res: Response): Promise<any> => {
  const { containerId } = req.params;

  if (!containerId) {
      logger.warn('Missing required parameter: containerId');
      return res.status(400).json({ error: 'Missing required parameter: containerId' });
  }

  try {
      const container = docker.getContainer(containerId);

      if (!container) {
          logger.warn(`Container not found: ${containerId}`);
          return res.status(404).json({ error: 'Container not found' });
      }

      const logs = await container.logs({
          follow: false,
          stdout: true,
          stderr: true,
          timestamps: true
      });

      const logString = logs.toString('utf-8');
      logger.info(`Fetched logs for container ${containerId} successfully`);

      return res.status(200).json({ logs: logString });
  } catch (error) {
      logger.error(`Error fetching logs for container ${containerId}: ${(error as Error).message}`);
      return res.status(500).json({ error: (error as Error).message });
  }
};



// export const startPostgresContainer = async (req: Request, res: Response): Promise<any> => {
//   const containerId = req.body.containerId;
//   if (!containerId) {
//     return res.status(400).json({ error: 'Missing required parameter: containerId', start: false });
//   }

//   try {
//     const container = await DatabaseInstance.findOne({ containerId: containerId });
//     if (!container) {
//       logger.error(`Container not found in the database containerId: ${containerId}`);
//       return res.status(404).json({ message: "Container not found in the database.", start: false });
//     }

//     const cont = docker.getContainer(containerId);
//     await cont.start();
//     container.status = 'running';
//       await container.save();
//       logger.info(`Container started successfully.`);
//     return res.status(200).json({ message: "Container started successfully.", start: true });

//   } catch (error) {
//     logger.error(`Error starting container containerId: ${containerId}`, error);
//     return res.status(500).json({ message: "Failed to start the container.", start: false });
//   }
// };

// export const stopPostgresContainer = async (req: Request, res: Response): Promise<any> => {
//   const containerId = req.body.containerId;
//   if (!containerId) {
//     return res.status(400).json({ error: 'Missing required parameter: containerId', stop: false });
//   }
//   try {
//     const container = await DatabaseInstance.findOne({ containerId: containerId });
//     if (!container) {
//       logger.error(`Container not found in the database containerId: ${containerId}`);
//       return res.status(404).json({ message: "Container not found in the database.", stop: false });
//     }
//     const cont = docker.getContainer(containerId);
//     await cont.stop();
//     container.status = 'pause';
//     await container.save();
//     return res.status(200).json({ message: "Container stopped successfully.", stop: true });
//   } catch (error) {
//     logger.error(`Error stopping container containerId: ${containerId}`, error);
//     return res.status(500).json({ message: "Failed to stop the container.", stop: false });
//   }
// }

// export const getContainerStatus = async (req: Request, res: Response): Promise<any> => {
//   const {containerId} = req.params;
//   console.log(containerId);
//   try {
   
//     if (!containerId) {
//       logger.warn('Missing required parameter: containerId');
//       return res.status(400).json({ error: 'Missing required parameter: containerId', status: false });
//     }

//     const container = docker.getContainer(containerId);
//     if (!container) {
//       logger.error(`Container not found: ${containerId}`);
//       return res.status(404).json({ error: 'Container not found', status: false });
//     }

//     const containerStatus = (await container.inspect()).State;
//     logger.info(`Fetched status for container ${containerId} successfully`);
//     return res.status(200).json({ status: true,containerStatus, message: `Fetched status for container ${containerId} successfully` });

//   } catch (err) {
//     logger.error('Error fetching container status:', err);
//     return res.status(500).json({ error: (err as Error).message, status: false });
//   }
// };


export {
  pausePostgresContainer,
  createPostgresDb,
  unPausePostgresContainer,
  deletePostgresContainer,
  logsOfPostgresContainer,
};
