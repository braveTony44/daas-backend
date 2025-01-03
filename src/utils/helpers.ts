import docker from "../config/dockerRode";
import os from 'os';
import { DatabaseInstance, IDatabaseInstance } from '../model/pg.conatiner';
import { Types } from 'mongoose';
import { User} from '../model/user.model';
import logger from "../config/log.init";

function generateStrongPassword(length: number): string {
   try {
     // Define the character sets
     const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
     const lowercase = 'abcdefghijklmnopqrstuvwxyz';
     const numbers = '0123456789';
 
     // Combine all character sets into one pool
     const allCharacters = uppercase + lowercase + numbers;
 
     // Ensure we have at least one character from each category
     const getRandomElement = (chars: string): string => chars.charAt(Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] % chars.length));
 
     let password = '';
 
     // Ensure at least one character from each category
     password += getRandomElement(uppercase);
     password += getRandomElement(lowercase);
     password += getRandomElement(numbers);
 
     // Fill the rest of the password with random characters from the full pool
     for (let i = password.length; i < length; i++) {
         password += getRandomElement(allCharacters);
     }
 
     // Shuffle the password to ensure randomness
     password = password.split('').sort(() => Math.random() - 0.5).join('');
 
     return password;
   } catch (error) {
    logger.error(`Failed to generate a strong password: ${(error as Error).message}`);
    throw new Error(`Failed to generate a strong password: ${(error as Error).message}`);
   }
}

function generateRandomName(): string {
    try {
        const adjectives = [
            "quick", "lazy", "sleepy", "noisy", "hungry", "dark", "light", "cold", "busy",
            "brave", "calm", "eager", "fancy", "glamorous", "jolly", "kind", "lively", "mighty",
            "nice", "proud", "silly", "witty", "zealous"
        ];
        const nouns = [
            "rabbit", "turtle", "fox", "dog", "cat", "mouse", "elephant", "tom", "tongue",
            "lion", "tiger", "bear", "wolf", "eagle", "shark", "whale", "dolphin", "panda",
            "giraffe", "zebra", "kangaroo", "koala", "penguin"
        ];
        const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
        const uniqueSuffix = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
        return `${randomAdjective}-${randomNoun}-${uniqueSuffix}`;
    } catch (error) {
        logger.error(`Failed to generate a random name: ${(error as Error).message}`);
        throw new Error(`Failed to generate a random name: ${(error as Error).message}`);
    }
}


async function getUniquePort(startPort: number = 1100, endPort: number = 1200): Promise<number> {
    try {
        // Get the list of containers and filter the used ports
        const containers = await docker.listContainers();
        const usedPorts = new Set<number>(
            containers
                .flatMap(container => container.Ports?.map(port => port.PublicPort).filter(Boolean) || [])
        );

        // Get the list of ports from the database
        const dbInstances = await DatabaseInstance.find({}, 'port');
        dbInstances.forEach(instance => usedPorts.add(instance.port));

        // Iterate over the port range and return the first available port
        for (let port = startPort; port <= endPort; port++) {
            if (!usedPorts.has(port)) {
                return port;
            }
        }

        // If no port is found, throw an error
        logger.warn("No Ports available in the specified range");
        throw new Error('No available ports found in the specified range');
    } catch (error: any) {
        logger.error(`Failed to get a unique port: ${(error as Error).message}`);
        throw new Error(`Failed to get a unique port: ${error.message}`);
    }
}


function getLocalIPAddress(): string | null {
   try {
    const interfaces = os.networkInterfaces();
    for (const interfaceName in interfaces) {
        const networkInterface = interfaces[interfaceName];
        if (networkInterface) {
            for (const alias of networkInterface) {
                if (alias.family === 'IPv4' && !alias.internal) {
                    return alias.address;
                }
            }
        }
    }
    return null;
   } catch (error) {
    logger.error(`Failed to get local IP address: ${(error as Error).message}`);
    throw new Error(`Failed to get local IP address: ${(error as Error).message}`);
   }
}


async function saveContainerData(payload: {
    instanceName: string;
    databaseType: 'postgres' | 'mongodb';
    containerId: string;
    containerName: string;
    status: 'running' | 'pause' | 'error';
    version: string;
    port: number;
    host: string;
    connectionString: string;
    resourceUsage: { cpu: number; memory: number; storage: number };
    configuration: Record<string, any>;
    owner: string;
}): Promise<any> {
    const container:IDatabaseInstance = new DatabaseInstance({
        instanceName: payload.instanceName,
        databaseType: payload.databaseType,
        containerId: payload.containerId,
        containerName: payload.containerName,
        status: payload.status,
        version: payload.version,
        port: payload.port,
        host: payload.host,
        connectionString: payload.connectionString,
        resourceUsage: payload.resourceUsage,
        configuration: payload.configuration,
        owner: payload.owner
    });

    try {
        await container.save();
        logger.info('Container data saved successfully');
        return container;
    } catch (error) {
        logger.error(`Error saving container data: ${(error as Error).message}`);
        throw new Error(`Error saving container data: ${(error as Error).message}`);
    }
}


async function addDatabaseInstanceToUser(userId: string, databaseInstanceId: string): Promise<void> {
    try {
        await User.findByIdAndUpdate(
            userId,
            { $push: { databaseInstances: new Types.ObjectId(databaseInstanceId) } },
            { new: true, useFindAndModify: false }
        );
        logger.info("Database instance added to user successfully")
    } catch (error) {
        logger.error(`Error adding database instance to user: ${(error as Error).message}`)
        throw new Error(`Error adding database instance to user: ${(error as Error).message}`);
    }
}


async function isImageAvailable(imageName: string):Promise<boolean> {
    try {
        const image = await docker.getImage(imageName).inspect();
        if(!image.RepoTags){
            return false;
        }
        return true;
    } catch (error) {
        return false;
    }
}

async function downloadTheImage(imageName: string):Promise<any> {
    try {
        const image = await docker.pull(imageName);
        console.log(image);
        logger.info(`Image ${imageName} downloaded successfully`);
        return image;
    } catch (error) {
        throw new Error(`Error downloading image ${imageName}: ${(error as Error).message}`);
    }
}

export { generateRandomName,downloadTheImage,addDatabaseInstanceToUser,isImageAvailable, saveContainerData,generateStrongPassword, getUniquePort, getLocalIPAddress };