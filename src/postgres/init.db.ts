import docker from "../config/dockerRode";
import logger from "../config/log.init";
import { downloadTheImage, isImageAvailable } from "../utils/helpers";

const createPostgresContainer = async (
  name: string,
  dbUser: string,
  dbName: string,
  dbPassword: string,
  hostPort: string
) => {
  if (!dbUser || !dbName || !dbPassword || !hostPort) {
    throw new Error("Missing required parameters");
  }

  try {
    const imageName = "postgres:latest"
     const isImage = await isImageAvailable(imageName);
    if (!isImage) {
      await downloadTheImage(imageName);
    }
    const container = await docker.createContainer({
      Image: imageName,
      name: name,
      Env: [
        `POSTGRES_USER=${dbUser}`,
        `POSTGRES_PASSWORD=${dbPassword}`,
        `POSTGRES_DB=${dbName}`,
      ],
      ExposedPorts: {
        "5432/tcp": {},
      },
      HostConfig: {
        PortBindings: {
          "5432/tcp": [
            {
              HostPort: hostPort,
            },
          ],
        },
        Memory: 512 * 1024 * 1024,
        CpuShares: 1024,
      },
    });
    await container.start();
    return container;
  } catch (error) {
    logger.error(`Failed to create PostgreSQL container error: ${(error as Error).message}`);
    if (error instanceof Error) {
      throw new Error(
        `Failed to create PostgreSQL container: ${error.message}`
      );
    } else {
      throw new Error(
        "An unknown error occurred while creating PostgreSQL container"
      );
    }
  }
};

const getAllContainers = async () => {
  try {
    const containers = await docker.listContainers({ all: true });
    return containers;

  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to list containers: ${error.message}`);
    } else {
      throw new Error("An unknown error occurred while listing containers");
    }
  }
};


export {
  createPostgresContainer,
  getAllContainers,
};
