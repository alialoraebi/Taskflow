import { Schema, model, Types } from 'mongoose';

const taskStatus = ['Todo', 'In Progress', 'Review', 'Completed', 'Blocked'];
const taskPriority = ['Low', 'Medium', 'High', 'Critical'];

const commentSchema = new Schema(
  {
    message: { type: String, required: true, trim: true },
    author: { type: Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const taskSchema = new Schema(
  {
    owner: { type: Types.ObjectId, ref: 'User', index: true },
    projectId: { type: Types.ObjectId, ref: 'Project', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    assignedTo: { type: Types.ObjectId, ref: 'User' },
    status: { type: String, enum: taskStatus, default: 'Todo' },
    priority: { type: String, enum: taskPriority, default: 'Medium' },
    dueDate: { type: Date },
    comments: [commentSchema],
    attachments: [{ type: String, trim: true }],
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const Task = model('Task', taskSchema);

export default Task;
