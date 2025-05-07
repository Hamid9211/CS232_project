import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: String,
        required: true,
    },
    userEmail: {
        type: String,
        required: true,
    },
    userMessage: {
        type: String,
        required: true,
    },
    aiMessage: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

export default Message;
