import {Request,Response} from 'express'
import { cache } from "../config/cache.init";
import logger from "../config/log.init";
import { User } from '../model/user.model';
import { DatabaseInstance } from '../model/pg.conatiner';

export const userProfile = async (req: Request, res: Response): Promise<any> => {
    try {
      const user = req.user;
      const cacheKey = `userProfile_${user.id}`;
  
      // Check if the user profile is in the cache
      const cachedProfile = cache.get(cacheKey);
      if (cachedProfile) {
        logger.info("User profile fetched from cache");
        return res.status(200).json({message:'cached', user: cachedProfile });
      }
  
      // Fetch the user profile from the database
      const userProfile = await User.findById(user.id);
      if (!userProfile) {
        logger.error("User not found");
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Cache the user profile
      cache.set(cacheKey, userProfile);
  
      logger.info("User profile fetched successfully");
      return res.status(200).json({ user: userProfile });
    } catch (error) {
      logger.error(`Error fetching user profile: ${(error as Error).message}`);
      return res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAllUserConatiners = async (req: Request, res: Response): Promise<any> => {
  try {
     const user = req.user;
     const cacheKey = `cacheConatiners_${user.id}`;

     const cachedConatiners = cache.get(cacheKey);
      if (cachedConatiners) {
        logger.info("User containers fetched from cache");
        return res.status(200).json({message:'cached', containers: cachedConatiners });
      }
      const conatiners = await DatabaseInstance.find({ owner: user.id }).sort({ createdAt: -1 });
      if (!conatiners) {
        logger.error("No conatiner found");
        return res.status(404).json({ message: 'No conatiner found' });
      }
      cache.set(cacheKey, conatiners);
      logger.info("user conatiner fetched successfully");
      return res.status(200).json({ containers: conatiners });

  } catch (error) {
    logger.error(`Error while fetching conatiner error: ${(error as Error).message}`);
    return res.status(500).json(`Error while fetching conatiner error: ${(error as Error).message}`);
  }
}


// export const getInstance = async (req: Request, res: Response): Promise<any> => {{
//   const {instanceId} = req.params;
//   try {
//     const instance = await DatabaseInstance.findById(instanceId);
//     if (!instance) {
//       logger.error(`Could not find conatiner  for id ${instanceId}`);
//       return res.status(500).json({status:false, message:`Could not find conatiner for id ${instanceId}`});
//     }
//     logger.info(`Found conatiner for id ${instanceId}`);
//     return res.status(200).json({status:true, message:`Found conatiner for id ${instanceId}`, instance: instance });
//   } catch (error) {
//     logger.error(`Could not find conatiner for id ${instanceId} error:${(error as Error).message}`,);
//     return res.status(500).json({status:false, message:`Could not find conatiner for id ${instanceId} error:${(error as Error).message}`});
//   }
// }}

export const getInstance = async (req: Request, res: Response): Promise<any> => {
  const { instanceId } = req.params;

  // Check if the instance is in the cache
  const cachedInstance = cache.get(instanceId);
  if (cachedInstance) {
    logger.info(`Cache hit for instance id ${instanceId}`);
    return res.status(200).json({ status: true, message: `Found container for id ${instanceId}`, instance: cachedInstance });
  }

  try {
    const instance = await DatabaseInstance.findById(instanceId);
    if (!instance) {
      logger.error(`Could not find container for id ${instanceId}`);
      return res.status(500).json({ status: false, message: `Could not find container for id ${instanceId}` });
    }

    // Store the instance in the cache
    cache.set(instanceId, instance,30);

    logger.info(`Found container for id ${instanceId}`);
    return res.status(200).json({ status: true, message: `Found container for id ${instanceId}`, instance: instance });
  } catch (error) {
    logger.error(`Could not find container for id ${instanceId} error: ${(error as Error).message}`);
    return res.status(500).json({ status: false, message: `Could not find container for id ${instanceId} error: ${(error as Error).message}` });
  }
};
