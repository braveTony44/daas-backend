import docker from "../config/dockerRode";
import logger from "../config/log.init";

async function isContainerActive(conatinerId: string): Promise<any> {
    try {
        const container = await docker.getContainer(conatinerId).inspect();
        return container.State.Running;
    } catch (error) {
        logger.error(`Error fetching container status: ${(error as Error).message}`);
        throw new Error(`Error fetching container status: ${(error as Error).message}`);
    }
}

async function startContainer(conatinerId: string): Promise<any> {
    try {
        const container = await docker.getContainer(conatinerId);
        await container.start();
        return container;
    } catch (error) {
        logger.error(`Error starting container: ${(error as Error).message}`);
        throw new Error(`Error starting container: ${(error as Error).message}`);
    }
}

async function stopContainer(conatinerId: string): Promise<any> {
    try {
        const container = await docker.getContainer(conatinerId);
        await container.stop();
        return container;
    } catch (error) {
        logger.error(`Error stopping container: ${(error as Error).message}`);
        throw new Error(`Error stopping container: ${(error as Error).message}`);
    }
}

export { isContainerActive, startContainer, stopContainer };