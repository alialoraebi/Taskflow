import { Schema, model, Types } from 'mongoose';

const projectStatus = ['Planned', 'In Progress', 'Completed', 'On Hold', 'Cancelled'];

const projectSchema = new Schema(
  {
    owner: { type: Types.ObjectId, ref: 'User', index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: { type: String, enum: projectStatus, default: 'Planned' },
    startDate: { type: Date },
    endDate: { type: Date },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    assignedUsers: [{ type: Types.ObjectId, ref: 'User' }],
    relatedTasks: [{ type: Types.ObjectId, ref: 'Task' }],
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const Project = model('Project', projectSchema);

export default Project;
