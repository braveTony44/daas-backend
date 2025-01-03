import { Schema, model, Document, Types } from 'mongoose';

interface IResourceUsage {
  cpu: number;
  memory: number;
  storage: number;
}

interface IDatabaseInstance extends Document {
  instanceName: string;
  databaseType: 'postgres' | 'mongodb';
  containerId: string;
  containerName: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'running' | 'pause' | 'error';
  version: string;
  port: number;
  host: string;
  connectionString: string;
  resourceUsage: IResourceUsage;
  configuration: Record<string, any>;
  owner: Types.ObjectId;
}

const ResourceUsageSchema = new Schema<IResourceUsage>({
  cpu: { type: Number, default: 0 },
  memory: { type: Number, default: 0 },
  storage: { type: Number, default: 0 }
});

const DatabaseInstanceSchema = new Schema<IDatabaseInstance>({
  instanceName: { type: String, required: true, unique: true },
  databaseType: { type: String, enum: ['postgres', 'mongodb'], required: true },
  containerId: { type: String, required: true },
  containerName: { type: String, required: true },
  status: { type: String, enum: ['running', 'pause', 'error'], required: true },
  version: { type: String, required: true },
  port: { type: Number, required: true },
  host: { type: String, required: true },
  connectionString: { type: String, required: true },
  resourceUsage: { type: ResourceUsageSchema, default: {} },
  configuration: { type: Schema.Types.Mixed },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true, // Automatically manage createdAt and updatedAt
});

// Indexing
DatabaseInstanceSchema.index({ instanceName: 1, databaseType: 1 });
DatabaseInstanceSchema.index({ containerId: 1 });
DatabaseInstanceSchema.index({ owner: 1 });

// Model
const DatabaseInstance = model<IDatabaseInstance>('DatabaseInstance', DatabaseInstanceSchema);

export { DatabaseInstance, IDatabaseInstance };
